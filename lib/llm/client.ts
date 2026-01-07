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
 * Basic fallback parser when LLM is unavailable.
 * Uses simple pattern matching for common phrases.
 */
function parseWithFallback(input: string): ParseResult {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let start = new Date(now)
    let title = input

    // Simple time detection
    const timeMatch = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
    if (timeMatch) {
        let hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2] || "0")
        const ampm = timeMatch[3]?.toLowerCase()

        if (ampm === "pm" && hours < 12) hours += 12
        if (ampm === "am" && hours === 12) hours = 0

        start.setHours(hours, minutes, 0, 0)
    }

    // Simple date detection
    if (/tomorrow/i.test(input)) {
        start = tomorrow
        if (timeMatch) {
            let hours = parseInt(timeMatch[1])
            const minutes = parseInt(timeMatch[2] || "0")
            const ampm = timeMatch[3]?.toLowerCase()
            if (ampm === "pm" && hours < 12) hours += 12
            if (ampm === "am" && hours === 12) hours = 0
            start.setHours(hours, minutes, 0, 0)
        }
    }

    // Extract title (remove time/date references)
    title = input
        .replace(/\b(tomorrow|today|next week|this afternoon|this evening)\b/gi, "")
        .replace(/\b(at\s+)?\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, "")
        .replace(/\b(for\s+)?\d+\s*(hour|hr|minute|min)s?\b/gi, "")
        .trim()

    if (!title) title = input.slice(0, 50)

    // Infer type
    const type = inferEventType(input)

    const event: ParsedEventInput = {
        title,
        description: null,
        start,
        end: new Date(start.getTime() + 60 * 60 * 1000),
        allDay: false,
        location: null,
        type,
        flexibility: 3,
        energyCost: 3,
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
