import { Event } from "@/lib/intelligence"
import { scoreSchedule, getScoreBreakdown } from "./scoring"

export type OptimizationResult = {
  events: Event[]
  changes: string[]
  scoreBefore: number
  scoreAfter: number
  breakdown: {
    overall: number
    dayBalance: number
    contextSwitching: number
    recoveryTime: number
    timePreference: number
  }
}

/**
 * Local Smart Optimizer
 * Uses greedy algorithm to improve schedule by moving flexible events.
 */
export class LocalOptimizer {
  private maxIterations = 50

  /**
   * Main optimization function.
   * Returns optimized events and list of changes made.
   */
  optimize(events: Event[]): OptimizationResult {
    const original = [...events]
    let current = [...events]
    let currentScore = scoreSchedule(current)
    const changes: string[] = []

    console.log(`[LocalOptimizer] Starting. Initial score: ${currentScore.toFixed(1)}`)

    for (let i = 0; i < this.maxIterations; i++) {
      const improvement = this.findBestMove(current)

      if (!improvement) {
        console.log(`[LocalOptimizer] No more improvements found at iteration ${i}`)
        break
      }

      if (improvement.newScore <= currentScore + 0.5) {
        // Not enough improvement
        break
      }

      // Apply the move
      current = improvement.newEvents
      currentScore = improvement.newScore
      changes.push(improvement.description)

      console.log(`[LocalOptimizer] Applied: ${improvement.description} (score: ${currentScore.toFixed(1)})`)
    }

    return {
      events: current,
      changes,
      scoreBefore: scoreSchedule(original),
      scoreAfter: currentScore,
      breakdown: getScoreBreakdown(current)
    }
  }

  /**
   * Find the single best move that improves the schedule.
   */
  private findBestMove(events: Event[]): {
    newEvents: Event[]
    newScore: number
    description: string
  } | null {
    const currentScore = scoreSchedule(events)
    let bestMove: { newEvents: Event[]; newScore: number; description: string } | null = null
    let bestImprovement = 0

    // Get loads for all days
    const dayLoads = this.getDayLoads(events)
    const sortedDays = Array.from(dayLoads.entries())
      .sort((a, b) => b[1] - a[1]) // Heaviest first

    if (sortedDays.length < 2) return null

    // We split days into "heavy" (source) and "light" (target) candidates
    // Consider top half as potential sources and bottom half as potential targets
    const midPoint = Math.ceil(sortedDays.length / 2)
    const heavyDays = sortedDays.slice(0, midPoint)
    const lightDays = sortedDays.slice(midPoint).sort((a, b) => a[1] - b[1]) // Lightest first

    // Try moving flexible events from overloaded to light days
    for (const [heavyDay, heavyLoad] of heavyDays) {
      const dayEvents = events.filter(
        e => new Date(e.start).toDateString() === heavyDay
      )

      // Sort by flexibility (most flexible first)
      const flexibleEvents = dayEvents
        .filter(e => (e.flexibility || 1) >= 3)
        .sort((a, b) => (b.flexibility || 1) - (a.flexibility || 1))


      for (const event of flexibleEvents) {
        const eventCost = event.energyCost || 3

        for (const [lightDay, lightLoad] of lightDays) {
          // Skip if same day
          if (heavyDay === lightDay) continue

          const loadDiff = heavyLoad - lightLoad

          // Heuristic: Only move if the load difference is significant enough (e.g. > 5)
          // AND moving the event won't flip the imbalance too extremely
          if (loadDiff < 5) continue

          // Hard cap to prevent creating new burnout days
          if (lightLoad + eventCost > 28) continue

          // Create candidate schedule
          const candidateEvents = this.moveEventToDay(events, event.id, lightDay)
          const newScore = scoreSchedule(candidateEvents)
          const improvement = newScore - currentScore

          if (improvement > bestImprovement) {
            bestImprovement = improvement
            bestMove = {
              newEvents: candidateEvents,
              newScore,
              description: `Moved "${event.title}" from ${this.formatDay(heavyDay)} to ${this.formatDay(lightDay)} to balance load`
            }
          }
        }
      }
    }

    return bestMove
  }

  /**
   * Get total energy load per day.
   */
  private getDayLoads(events: Event[]): Map<string, number> {
    const loads = new Map<string, number>()

    for (const event of events) {
      const day = new Date(event.start).toDateString()
      const current = loads.get(day) || 0
      loads.set(day, current + (event.energyCost || 3))
    }

    return loads
  }

  /**
   * Create new events array with one event moved to a different day.
   */
  private moveEventToDay(events: Event[], eventId: string, targetDay: string): Event[] {
    return events.map(e => {
      if (e.id !== eventId) return e

      const targetDate = new Date(targetDay)
      const oldStart = new Date(e.start)
      const oldEnd = new Date(e.end)

      // Keep same time, change date
      const newStart = new Date(targetDate)
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)

      const newEnd = new Date(targetDate)
      newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0, 0)

      return {
        ...e,
        start: newStart,
        end: newEnd
      }
    })
  }

  private formatDay(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
  }
}

export const localOptimizer = new LocalOptimizer()
