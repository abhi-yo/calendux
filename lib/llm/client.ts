import OpenAI from "openai"
import { Event } from "@/lib/intelligence"
import { ENERGY_SCORING_PROMPT } from "./prompts"

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
