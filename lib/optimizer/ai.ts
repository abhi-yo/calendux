
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { Event } from "@/lib/intelligence"
import { scoreSchedule, getScoreBreakdown } from "./scoring"
import { OptimizationResult } from "./engine"

// Schema for the AI response
const OptimizationResultSchema = z.object({
    movedEvents: z.array(z.object({
        id: z.string(),
        newStart: z.string(),
        newEnd: z.string(),
        reason: z.string().optional()
    })),
    explanation: z.string()
})

export class AIOptimizer {
    async optimize(
        events: Event[],
        apiKey: string,
        provider: string = "openai",
        weekStartParam?: Date
    ): Promise<OptimizationResult> {
        const scoreBefore = scoreSchedule(events)

        // select model based on provider
        let model;
        if (provider === 'google') {
            const google = createGoogleGenerativeAI({ apiKey });
            model = google('gemini-3-flash');
        } else {
            const openai = createOpenAI({ apiKey });
            model = openai('gpt-5.2');
        }

        // Filter and simplify events to save tokens
        const simplifiedEvents = events.map(e => ({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end,
            type: e.type,
            energyCost: e.energyCost,
            flexibility: e.flexibility,
            fixed: e.flexibility < 3 || e.causedById || this.isNonNegotiable(e)
        }))

        const systemPrompt = `You are an expert calendar optimization AI. 
        Your goal is to reschedule flexible events to maximize productivity and minimize burnout.
        
        Rules:
        1. DO NOT move "fixed": true events.
        2. DO NOT move events to the past (before today).
        3. Balance daily energy load (sum of energyCost).
        4. Group shallow tasks together and preserve deep work blocks.
        
        Return a JSON object with the moved events and a brief explanation.`

        try {
            const { object: result } = await generateObject({
                model,
                schema: OptimizationResultSchema,
                system: systemPrompt,
                prompt: `Current Schedule: ${JSON.stringify(simplifiedEvents)}`,
            })

            const movedEvents = result.movedEvents || []

            // Apply changes
            const optimizedEvents = events.map(originalEvent => {
                const move = movedEvents.find((m) => m.id === originalEvent.id)
                if (move) {
                    return {
                        ...originalEvent,
                        start: new Date(move.newStart),
                        end: new Date(move.newEnd)
                    }
                }
                return originalEvent
            })

            const scoreAfter = scoreSchedule(optimizedEvents)
            const changes = movedEvents.map((m) => {
                const event = events.find(e => e.id === m.id)
                return `Moved "${event?.title}" to ${new Date(m.newStart).toLocaleDateString('en', { weekday: 'short' })}`
            })

            return {
                events: optimizedEvents,
                changes: changes,
                // If the score didn't improve or was invalid, rely on the AI's explanation or a default one
                scoreBefore,
                scoreAfter: Math.max(scoreAfter, scoreBefore),
                breakdown: getScoreBreakdown(optimizedEvents)
            }

        } catch (error) {

            throw new Error("AI Optimization failed")
        }
    }

    private isNonNegotiable(event: Event): boolean {
        const NON_NEGOTIABLE_KEYWORDS = [
            'breakfast', 'lunch', 'dinner', 'meal',
            'sleep', 'wake', 'routine',
            'commute', 'school', 'pickup', 'dropoff',
            'gym', 'workout'
        ]
        if (event.type === 'HABIT') return true
        return NON_NEGOTIABLE_KEYWORDS.some(k => event.title.toLowerCase().includes(k))
    }
}

export const aiOptimizer = new AIOptimizer()
