import { Event } from "@/lib/intelligence"
import { Conflict } from "@/lib/conflict/types"
import { localOptimizer, OptimizationResult } from "@/lib/optimizer/engine"

export type OptimizedSchedule = {
    optimizedEvents: Event[]
    changes: string[]
    explanation: string
    scoreBefore?: number
    scoreAfter?: number
}

/**
 * Rewrite Engine - Now uses LocalOptimizer instead of OpenAI.
 * 100% local, no API keys needed.
 */
export class RewriteEngine {

    async optimizeSchedule(events: Event[], conflicts?: Conflict[], weekStart?: Date, apiKey?: string, aiProvider?: string): Promise<OptimizedSchedule> {


        try {
            let result: OptimizationResult;

            if (apiKey) {
                // Multi-LLM Optimization
                const { aiOptimizer } = await import("@/lib/optimizer/ai")
                result = await aiOptimizer.optimize(events, apiKey, aiProvider || "openai", weekStart)
            } else {
                // Local Optimization
                result = localOptimizer.optimize(events, weekStart)
            }

            // Generate explanation
            let explanation = ""
            if (result.changes.length === 0) {
                explanation = "Your schedule is already well-balanced! No changes needed."
            } else {
                const improvement = result.scoreAfter - result.scoreBefore
                explanation = `Made ${result.changes.length} optimization${result.changes.length > 1 ? 's' : ''}. ` +
                    `Schedule quality improved by ${improvement.toFixed(0)} points ` +
                    `(${result.scoreBefore.toFixed(0)} → ${result.scoreAfter.toFixed(0)}).`
            }

            return {
                optimizedEvents: result.events,
                changes: result.changes,
                explanation,
                scoreBefore: result.scoreBefore,
                scoreAfter: result.scoreAfter
            }

        } catch (error) {

            return {
                optimizedEvents: events,
                changes: [],
                explanation: "Optimization failed. Original schedule preserved."
            }
        }
    }
}

export const rewriteEngine = new RewriteEngine()
