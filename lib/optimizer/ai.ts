
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
        const now = new Date()
        
        // Tomorrow at midnight - minimum valid target date
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)

        // Select model based on provider
        let model;
        if (provider === 'google') {
            const google = createGoogleGenerativeAI({ apiKey });
            model = google('gemini-2.0-flash');
        } else {
            const openai = createOpenAI({ apiKey });
            model = openai('gpt-4o');
        }

        // Filter and simplify events to save tokens
        const simplifiedEvents = events.map(e => ({
            id: e.id,
            title: e.title,
            start: new Date(e.start).toISOString(),
            end: new Date(e.end).toISOString(),
            type: e.type,
            energyCost: e.energyCost,
            flexibility: e.flexibility,
            fixed: e.flexibility < 2 || !!e.causedById || this.isNonNegotiable(e)
        }))

        const currentDate = now.toISOString()
        const minTargetDate = tomorrow.toISOString()

        const systemPrompt = `You are an expert calendar optimization AI. 
Your goal is to reschedule flexible events to maximize productivity and minimize burnout.

CRITICAL DATE RULES:
- Current date/time: ${currentDate}
- NEVER move events to dates before: ${minTargetDate}
- Only move events that have "fixed": false
- Events that have already started (start time < current time) CANNOT be moved

Optimization Rules:
1. Balance daily energy load (sum of energyCost) across days
2. Aim for 15-20 total energyCost per day maximum
3. Move events from overloaded days to lighter FUTURE days
4. Group similar task types together when possible
5. Preserve deep work blocks in morning/afternoon

Return movedEvents array with NEW dates that are STRICTLY in the future (>= ${minTargetDate.split('T')[0]}).`

        try {
            const { object: result } = await generateObject({
                model,
                schema: OptimizationResultSchema,
                system: systemPrompt,
                prompt: `Optimize this schedule. Today is ${now.toDateString()}. Only suggest moves to ${tomorrow.toDateString()} or later.\n\nEvents:\n${JSON.stringify(simplifiedEvents, null, 2)}`,
            })

            const movedEvents = result.movedEvents || []

            // STRICT VALIDATION: Filter out any moves to past dates
            const validMoves = movedEvents.filter(move => {
                const newStartDate = new Date(move.newStart)
                // Must be tomorrow or later
                return newStartDate >= tomorrow
            })

            // Apply only valid changes
            const optimizedEvents = events.map(originalEvent => {
                const move = validMoves.find((m) => m.id === originalEvent.id)
                if (move) {
                    const newStart = new Date(move.newStart)
                    const newEnd = new Date(move.newEnd)
                    
                    // Double-check: skip if move is to the past
                    if (newStart < tomorrow) {
                        return originalEvent
                    }
                    
                    return {
                        ...originalEvent,
                        start: newStart,
                        end: newEnd
                    }
                }
                return originalEvent
            })

            const scoreAfter = scoreSchedule(optimizedEvents)
            const changes = validMoves.map((m) => {
                const event = events.find(e => e.id === m.id)
                const newDate = new Date(m.newStart)
                return `Moved "${event?.title}" to ${newDate.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}`
            })

            return {
                events: optimizedEvents,
                changes,
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
