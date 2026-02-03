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
 * Keywords that indicate an event should NOT be moved.
 */
const NON_NEGOTIABLE_KEYWORDS = [
  'breakfast', 'lunch', 'dinner', 'meal',
  'sleep', 'wake', 'morning routine', 'night routine',
  'commute', 'school', 'pickup', 'drop off', 'dropoff',
  'medication', 'medicine', 'pills',
  'gym', 'workout', 'exercise',
]

/**
 * Check if an event is non-negotiable (should not be moved).
 */
function isNonNegotiable(event: Event): boolean {
  if (event.type === 'HABIT') return true
  const titleLower = event.title.toLowerCase()
  return NON_NEGOTIABLE_KEYWORDS.some(keyword => titleLower.includes(keyword))
}

/**
 * Check if an event can be moved (is flexible and negotiable).
 */
function isMovable(event: Event): boolean {
  // Must have flexibility >= 2 (not totally fixed)
  if ((event.flexibility || 1) < 2) return false
  // Must not be non-negotiable
  if (isNonNegotiable(event)) return false
  // Must not be caused by another event (dependency)
  if (event.causedById) return false
  return true
}

/**
 * Simple, aggressive optimizer that balances load across days.
 * ONLY moves events to future dates, never to past.
 */
export class LocalOptimizer {

  optimize(events: Event[], weekStartParam?: Date): OptimizationResult {
    const scoreBefore = scoreSchedule(events)
    let optimized = [...events]
    const changes: string[] = []

    // Get current time - critical for determining what's in the past
    const now = new Date()
    
    // Tomorrow at midnight - we only move events to tomorrow or later
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    // Calculate load per day
    const dayLoads = new Map<string, { load: number; events: Event[]; date: Date }>()

    let weekStart: Date

    if (weekStartParam) {
      weekStart = new Date(weekStartParam)
    } else {
      if (optimized.length > 0) {
        const eventDates = optimized.map(e => new Date(e.start))
        const minEventDate = new Date(Math.min(...eventDates.map(d => d.getTime())))
        weekStart = new Date(minEventDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      } else {
        weekStart = new Date()
      }
    }

    weekStart.setHours(0, 0, 0, 0)

    // Create entries for ALL 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      const dayKey = date.toDateString()
      dayLoads.set(dayKey, { load: 0, events: [], date })
    }

    // Populate with actual events
    for (const event of optimized) {
      const date = new Date(event.start)
      const dayKey = date.toDateString()
      const day = dayLoads.get(dayKey)
      if (day) {
        day.load += event.energyCost || 3
        day.events.push(event)
      }
    }

    // Convert to array
    const allDays = Array.from(dayLoads.entries())
      .map(([key, data]) => ({ key, ...data }))

    // STRICT: Only consider days that are TOMORROW or later as valid targets
    const validTargetDays = allDays.filter(d => d.date >= tomorrow)

    // Days that have overloaded events (could be today or future)
    const overloadedDays = allDays.filter(d => d.load > 20)

    if (validTargetDays.length === 0 || overloadedDays.length === 0) {
      return this.createResult(events, optimized, changes, scoreBefore)
    }

    // Sort target days by load (lightest first for better distribution)
    validTargetDays.sort((a, b) => a.load - b.load)

    const OVERLOAD_THRESHOLD = 20
    const TARGET_LOAD = 15

    for (const heavyDay of overloadedDays) {
      if (heavyDay.load <= OVERLOAD_THRESHOLD) continue

      // Find movable events - must be flexible AND start in the future
      const movableEvents = heavyDay.events
        .filter(e => {
          // Check if event is movable by flexibility rules
          if (!isMovable(e)) return false
          // STRICT: Event must start AFTER current time
          const eventStart = new Date(e.start)
          return eventStart > now
        })
        .sort((a, b) => (b.flexibility || 1) - (a.flexibility || 1))

      if (movableEvents.length === 0) continue

      // Find lighter days to move events to - MUST be tomorrow or later
      const lighterDays = validTargetDays
        .filter(d => d.key !== heavyDay.key && d.load < TARGET_LOAD)

      if (lighterDays.length === 0) continue

      // Move events to balance
      for (const event of movableEvents) {
        if (heavyDay.load <= TARGET_LOAD) break

        const eventCost = event.energyCost || 3
        const targetDay = lighterDays.find(d => d.load + eventCost <= OVERLOAD_THRESHOLD)

        if (!targetDay) continue

        // Double-check target is in the future
        if (targetDay.date < tomorrow) continue

        // Move the event
        optimized = this.moveEventToDay(optimized, event.id, targetDay.date)
        heavyDay.load -= eventCost
        targetDay.load += eventCost

        const changeMsg = `Moved "${event.title}" from ${this.formatDay(heavyDay.date)} to ${this.formatDay(targetDay.date)}`
        changes.push(changeMsg)

        // Re-sort lighter days
        lighterDays.sort((a, b) => a.load - b.load)
      }
    }

    return this.createResult(events, optimized, changes, scoreBefore)
  }

  private createResult(original: Event[], optimized: Event[], changes: string[], scoreBefore: number): OptimizationResult {
    const scoreAfter = scoreSchedule(optimized)


    return {
      events: optimized,
      changes,
      scoreBefore,
      scoreAfter,
      breakdown: getScoreBreakdown(optimized)
    }
  }

  private moveEventToDay(events: Event[], eventId: string, targetDate: Date): Event[] {
    return events.map(e => {
      if (e.id !== eventId) return e

      const oldStart = new Date(e.start)
      const oldEnd = new Date(e.end)

      // Keep same time, change date
      const newStart = new Date(targetDate)
      newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0)

      const newEnd = new Date(targetDate)
      newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes(), 0, 0)

      return { ...e, start: newStart, end: newEnd }
    })
  }

  private formatDay(date: Date): string {
    return date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
  }
}

export const localOptimizer = new LocalOptimizer()
