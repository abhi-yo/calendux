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
 */
export class LocalOptimizer {

  optimize(events: Event[], weekStartParam?: Date): OptimizationResult {
    const scoreBefore = scoreSchedule(events)
    let optimized = [...events]
    const changes: string[] = []



    // Get today at midnight - never move to past
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate load per day
    const dayLoads = new Map<string, { load: number; events: Event[]; date: Date }>()

    let weekStart: Date

    if (weekStartParam) {
      weekStart = new Date(weekStartParam)
    } else {
      // Fallback: infer from events if no start date provided
      if (optimized.length > 0) {
        const eventDates = optimized.map(e => new Date(e.start))
        const minEventDate = new Date(Math.min(...eventDates.map(d => d.getTime())))
        weekStart = new Date(minEventDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      } else {
        weekStart = new Date() // Default to now if no events
      }
    }

    // Ensure strict midnight
    weekStart.setHours(0, 0, 0, 0)


    // Create entries for ALL 7 days (including empty ones!)
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

    // Convert to array and sort by load (heaviest first)
    const days = Array.from(dayLoads.entries())
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.load - a.load)



    if (days.length < 2) {

      return this.createResult(events, optimized, changes, scoreBefore)
    }

    // Find the heaviest and lightest days
    const heaviestDay = days[0]

    // Use string comparison for safety to avoid timezone subtlties
    const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Filter for future days (including today)
    const futureDays = days.filter(d => {
      const dayDate = new Date(d.date)
      const dayStr = dayDate.toISOString().split('T')[0]
      return dayStr >= todayStr
    })

    // Lightest is the last one (since sorted by load desc)
    const lightestDay = futureDays.pop()

    if (!lightestDay) {

      return this.createResult(events, optimized, changes, scoreBefore)
    }

    // Only balance if there's significant imbalance
    const loadDiff = heaviestDay.load - lightestDay.load


    if (loadDiff < 3) {

      return this.createResult(events, optimized, changes, scoreBefore)
    }

    // Find movable events from heaviest day
    const movableEvents = heaviestDay.events
      .filter(isMovable)
      .sort((a, b) => (b.flexibility || 1) - (a.flexibility || 1)) // Most flexible first



    if (movableEvents.length === 0) {

      return this.createResult(events, optimized, changes, scoreBefore)
    }

    // Move events until balanced or no more to move
    let currentHeavyLoad = heaviestDay.load
    let currentLightLoad = lightestDay.load

    for (const event of movableEvents) {
      const eventCost = event.energyCost || 3

      // Stop if we've balanced enough
      if (currentHeavyLoad - currentLightLoad < 3) break

      // Don't overload the target day
      if (currentLightLoad + eventCost > 25) continue

      // Move the event
      optimized = this.moveEventToDay(optimized, event.id, lightestDay.date)
      currentHeavyLoad -= eventCost
      currentLightLoad += eventCost

      const changeMsg = `Moved "${event.title}" from ${this.formatDay(heaviestDay.date)} to ${this.formatDay(lightestDay.date)}`
      changes.push(changeMsg)

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
