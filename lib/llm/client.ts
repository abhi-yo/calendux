import OpenAI from "openai"
import { Event } from "@/lib/intelligence"
import { ENERGY_SCORING_PROMPT, NATURAL_LANGUAGE_PARSE_PROMPT } from "./prompts"

// Initialize OpenAI Helper
// In production, ensure OPENAI_API_KEY is set in .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "stub-key",
    dangerouslyAllowBrowser: true // For MVP client-side calls if needed, though strictly we use server actions
})

export type EnergyScore = {
    energyCost: number
    cognitiveLoad: number
    emotionalToll: number // We might add this to schema later
    contextTag: string
}

export type ParsedEventInput = {
    title: string
    description: string | null
    start: Date
    end: Date
    allDay: boolean
    location: string | null
    type: "TASK" | "EVENT" | "MEETING" | "HABIT" | "FOCUS"
    flexibility: number
    energyCost: number
    participants: string[]
}

export type ParseResult = {
    success: boolean
    event: ParsedEventInput | null
    error?: string
    rawInput: string
}

/**
 * Parse natural language input into structured event data.
 * Examples:
 * - "Meeting with John tomorrow at 3pm"
 * - "Dentist appointment Friday 10am for 1 hour"
 * - "Work on presentation next Monday"
 * - "Quick call with Sarah in 2 hours"
 */
export async function parseNaturalLanguageEvent(
    input: string,
    timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): Promise<ParseResult> {
    if (!input.trim()) {
        return {
            success: false,
            event: null,
            error: "Empty input",
            rawInput: input
        }
    }

    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY not found, using basic parsing fallback")
        return parseWithFallback(input)
    }

    try {
        const now = new Date()
        const currentDateTime = now.toISOString()
        const currentDate = now.toISOString().split('T')[0]

        const prompt = NATURAL_LANGUAGE_PARSE_PROMPT
            .replace("{{currentDateTime}}", currentDateTime)
            .replace("{{currentDate}}", currentDate)
            .replace("{{timezone}}", timezone)
            .replace("{{input}}", input)

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
            temperature: 0.2,
            max_tokens: 300,
            response_format: { type: "json_object" }
        })

        const result = JSON.parse(response.choices[0].message.content || "{}")

        // Validate and transform the result
        const parsedEvent: ParsedEventInput = {
            title: result.title || input.slice(0, 50),
            description: result.description || null,
            start: new Date(result.startDate || now),
            end: new Date(result.endDate || new Date(now.getTime() + 60 * 60 * 1000)),
            allDay: result.allDay ?? false,
            location: result.location || null,
            type: validateEventType(result.type),
            flexibility: Math.min(5, Math.max(1, result.flexibility || 3)),
            energyCost: Math.min(5, Math.max(1, result.energyCost || 3)),
            participants: Array.isArray(result.participants) ? result.participants : []
        }

        // Validate dates
        if (isNaN(parsedEvent.start.getTime())) {
            parsedEvent.start = now
        }
        if (isNaN(parsedEvent.end.getTime())) {
            parsedEvent.end = new Date(parsedEvent.start.getTime() + 60 * 60 * 1000)
        }

        // Ensure end is after start
        if (parsedEvent.end <= parsedEvent.start) {
            parsedEvent.end = new Date(parsedEvent.start.getTime() + 60 * 60 * 1000)
        }

        return {
            success: true,
            event: parsedEvent,
            rawInput: input
        }

    } catch (error) {
        console.error("LLM Parsing Failed:", error)
        return parseWithFallback(input)
    }
}

/**
 * Enhanced fallback parser when LLM is unavailable.
 * Uses pattern matching for common natural language phrases.
 */
function parseWithFallback(input: string): ParseResult {
    const now = new Date()
    let start = new Date(now)
    let title = input
    let allDay = false

    // === WEEKDAY PARSING ===
    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const weekdayMatch = input.toLowerCase().match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i)
    if (weekdayMatch) {
        const targetDay = weekdays.indexOf(weekdayMatch[1].toLowerCase())
        const currentDay = now.getDay()
        let daysToAdd = targetDay - currentDay
        if (daysToAdd <= 0) daysToAdd += 7 // Next occurrence
        start = new Date(now)
        start.setDate(now.getDate() + daysToAdd)
        start.setHours(9, 0, 0, 0) // Default to 9am
    }

    // === RELATIVE DATE PARSING ===
    if (/\btomorrow\b/i.test(input)) {
        start = new Date(now)
        start.setDate(now.getDate() + 1)
        start.setHours(9, 0, 0, 0)
    } else if (/\btoday\b/i.test(input)) {
        start = new Date(now)
        // Keep current time or set to next hour
        start.setMinutes(0, 0, 0)
        if (start <= now) {
            start.setHours(start.getHours() + 1)
        }
    } else if (/\bnext week\b/i.test(input)) {
        start = new Date(now)
        start.setDate(now.getDate() + 7)
        start.setHours(9, 0, 0, 0)
    }

    // === TIME OF DAY KEYWORDS ===
    if (/\b(this\s+)?morning\b/i.test(input)) {
        start.setHours(9, 0, 0, 0)
    } else if (/\b(this\s+)?afternoon\b/i.test(input)) {
        start.setHours(14, 0, 0, 0)
    } else if (/\b(this\s+)?evening\b/i.test(input)) {
        start.setHours(18, 0, 0, 0)
        // If "this evening" and it's already past 6pm, leave as is
        if (/\bthis\s+evening\b/i.test(input) && !weekdayMatch && !/\btomorrow\b/i.test(input)) {
            const today = new Date(now)
            today.setHours(18, 0, 0, 0)
            if (now.getHours() < 18) {
                start = today
            }
        }
    } else if (/\bnight\b/i.test(input)) {
        start.setHours(20, 0, 0, 0)
    }

    // === SPECIFIC TIME PARSING (overrides time of day) ===
    const timeMatch = input.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
    if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2] || "0")
        const ampm = timeMatch[3]?.toLowerCase()

        // Handle 12-hour format
        if (ampm === "pm" && hours < 12) hours += 12
        if (ampm === "am" && hours === 12) hours = 0

        // If no am/pm specified, infer based on context
        if (!ampm && hours >= 1 && hours <= 6) {
            // Likely PM for 1-6 without am/pm
            hours += 12
        }

        start.setHours(hours, minutes, 0, 0)
    }

    // === DURATION PARSING ===
    let durationMinutes = 60 // Default 1 hour
    const durationMatch = input.match(/\bfor\s+(\d+)\s*(hour|hr|minute|min)s?\b/i)
    if (durationMatch) {
        const value = parseInt(durationMatch[1])
        const unit = durationMatch[2].toLowerCase()
        if (unit.startsWith("hour") || unit.startsWith("hr")) {
            durationMinutes = value * 60
        } else {
            durationMinutes = value
        }
    } else if (/\bquick\b/i.test(input)) {
        durationMinutes = 15
    } else if (/\b(coffee|lunch)\b/i.test(input)) {
        durationMinutes = 60
    }

    // === CHECK FOR ALL DAY ===
    if (/\ball\s*day\b/i.test(input)) {
        allDay = true
        start.setHours(0, 0, 0, 0)
    }

    // === EXTRACT CLEAN TITLE ===
    title = input
        .replace(/\b(tomorrow|today|next week|this morning|this afternoon|this evening|this night)\b/gi, "")
        .replace(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, "")
        .replace(/\b(morning|afternoon|evening|night)\b/gi, "")
        .replace(/\b(at\s+)?\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, "")
        .replace(/\bfor\s+\d+\s*(hour|hr|minute|min)s?\b/gi, "")
        .replace(/\ball\s*day\b/gi, "")
        .replace(/\bevery\s+(day|week|month)\b/gi, "") // Remove recurrence for now
        .replace(/\s+/g, " ")
        .trim()

    if (!title) title = input.slice(0, 50)

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1)

    // === INFER TYPE ===
    const type = inferEventType(input)

    // === INFER ENERGY COST ===
    let energyCost = 3
    if (type === "MEETING") energyCost = 3
    if (type === "FOCUS") energyCost = 4
    if (type === "HABIT") energyCost = 2
    if (/\b(standup|sync|quick)\b/i.test(input)) energyCost = 2

    // === BUILD EVENT ===
    const end = allDay
        ? new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1)
        : new Date(start.getTime() + durationMinutes * 60 * 1000)

    // === SAFETY: Ensure start is in the future for "this" references ===
    if (start <= now && /\bthis\b/i.test(input)) {
        // If "this evening" but it's already past evening, set to tomorrow
        start.setDate(start.getDate() + 1)
    }

    const event: ParsedEventInput = {
        title,
        description: null,
        start,
        end,
        allDay,
        location: null,
        type,
        flexibility: type === "MEETING" ? 2 : 3,
        energyCost,
        participants: extractParticipants(input)
    }

    return {
        success: true,
        event,
        rawInput: input
    }
}

function validateEventType(type: string): "TASK" | "EVENT" | "MEETING" | "HABIT" | "FOCUS" {
    const validTypes = ["TASK", "EVENT", "MEETING", "HABIT", "FOCUS"]
    return validTypes.includes(type) ? type as ParsedEventInput["type"] : "EVENT"
}

function inferEventType(input: string): ParsedEventInput["type"] {
    const lower = input.toLowerCase()
    if (/\b(meet|call|sync|1:1|standup|coffee|lunch with)\b/.test(lower)) return "MEETING"
    if (/\b(focus|deep work|coding|writing|work on)\b/.test(lower)) return "FOCUS"
    if (/\b(gym|workout|meditate|run|exercise|yoga)\b/.test(lower)) return "HABIT"
    if (/\b(deadline|due|submit|finish|complete)\b/.test(lower)) return "TASK"
    return "EVENT"
}

function extractParticipants(input: string): string[] {
    const participants: string[] = []
    // Match "with [Name]" pattern
    const withMatch = input.match(/\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g)
    if (withMatch) {
        withMatch.forEach(m => {
            const name = m.replace(/^with\s+/i, "").trim()
            if (name && !participants.includes(name)) {
                participants.push(name)
            }
        })
    }
    return participants
}

export async function scoreEvent(event: Partial<Event>): Promise<EnergyScore> {
    if (!process.env.OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY not found, returning default scores")
        return {
            energyCost: 3,
            cognitiveLoad: 3,
            emotionalToll: 3,
            contextTag: "Uncategorized"
        }
    }

    try {
        const duration = event.start && event.end
            ? (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60)
            : 1

        const prompt = ENERGY_SCORING_PROMPT
            .replace("{{title}}", event.title || "Untitled")
            .replace("{{description}}", event.description || "No description")
            .replace("{{duration}}", duration.toString())
            .replace("{{time}}", new Date(event.start || Date.now()).toLocaleTimeString())

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
            temperature: 0.3,
            max_tokens: 100,
            response_format: { type: "json_object" }
        })

        const result = JSON.parse(response.choices[0].message.content || "{}")

        return {
            energyCost: Math.min(5, Math.max(1, result.energyCost || 3)),
            cognitiveLoad: Math.min(5, Math.max(1, result.cognitiveLoad || 3)),
            emotionalToll: Math.min(5, Math.max(1, result.emotionalToll || 3)),
            contextTag: result.contextTag || "General"
        }

    } catch (error) {
        console.error("LLM Scoring Failed:", error)
        return {
            energyCost: 3,
            cognitiveLoad: 3,
            emotionalToll: 3,
            contextTag: "Error"
        }
    }
}
