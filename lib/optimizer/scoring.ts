import { Event } from "@/lib/intelligence"

/**
 * Scoring functions for schedule optimization.
 * Higher score = better schedule.
 * Each function returns a score from 0-100.
 */

const IDEAL_DAILY_ENERGY = 20
const MAX_DAILY_ENERGY = 30
const CONTEXT_SWITCH_PENALTY = 5

/**
 * Score based on energy balance across days.
 * Penalizes days that are overloaded or have burnout risk.
 */
export function scoreDayBalance(events: Event[]): number {
  // Group events by day
  const dayMap = new Map<string, Event[]>()
  
  for (const event of events) {
    const dayKey = new Date(event.start).toDateString()
    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, [])
    }
    dayMap.get(dayKey)!.push(event)
  }

  if (dayMap.size === 0) return 100

  let totalScore = 0
  
  for (const [day, dayEvents] of dayMap) {
    const dayEnergy = dayEvents.reduce((sum, e) => sum + (e.energyCost || 3), 0)
    
    // Perfect score if energy is around ideal
    // Penalize if over max
    if (dayEnergy <= IDEAL_DAILY_ENERGY) {
      totalScore += 100
    } else if (dayEnergy <= MAX_DAILY_ENERGY) {
      // Linear penalty from ideal to max
      const overIdeal = dayEnergy - IDEAL_DAILY_ENERGY
      const penalty = (overIdeal / (MAX_DAILY_ENERGY - IDEAL_DAILY_ENERGY)) * 40
      totalScore += 100 - penalty
    } else {
      // Heavy penalty for exceeding max
      const overMax = dayEnergy - MAX_DAILY_ENERGY
      totalScore += Math.max(0, 60 - overMax * 5)
    }
  }

  return totalScore / dayMap.size
}

/**
 * Score based on context switching.
 * Penalizes rapid switches between different event types.
 */
export function scoreContextSwitching(events: Event[]): number {
  if (events.length < 2) return 100

  // Sort by start time
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  let switches = 0
  
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]
    
    // Check if same day
    if (new Date(prev.start).toDateString() !== new Date(curr.start).toDateString()) {
      continue
    }

    // Check if back-to-back (within 30 mins)
    const gap = (new Date(curr.start).getTime() - new Date(prev.end).getTime()) / 60000
    if (gap > 30) continue

    // Penalize type switches
    if (prev.type !== curr.type) {
      switches++
      
      // Extra penalty for high-energy switches
      if (prev.energyCost >= 4 && curr.energyCost >= 4) {
        switches++
      }
    }
  }

  // Normalize: 0 switches = 100, each switch costs 10 points
  return Math.max(0, 100 - switches * CONTEXT_SWITCH_PENALTY)
}

/**
 * Score based on recovery time after intense blocks.
 * Rewards breaks after high-energy events.
 */
export function scoreRecoveryTime(events: Event[]): number {
  if (events.length < 2) return 100

  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  )

  let goodRecoveries = 0
  let neededRecoveries = 0

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i]
    const next = sorted[i + 1]

    // Same day check
    if (new Date(curr.start).toDateString() !== new Date(next.start).toDateString()) {
      continue
    }

    // High energy event needs recovery
    if (curr.energyCost >= 4) {
      neededRecoveries++
      
      const gap = (new Date(next.start).getTime() - new Date(curr.end).getTime()) / 60000
      
      // 15+ minutes gap or next event is a break = good recovery
      if (gap >= 15 || next.type === "BREAK") {
        goodRecoveries++
      }
    }
  }

  if (neededRecoveries === 0) return 100
  return (goodRecoveries / neededRecoveries) * 100
}

/**
 * Score based on time-of-day preferences.
 * Penalizes deep work in low-focus hours.
 */
export function scoreTimePreference(events: Event[]): number {
  if (events.length === 0) return 100

  let score = 0

  for (const event of events) {
    const hour = new Date(event.start).getHours()
    
    // Deep work (high cognitive load) is best 9am-12pm and 2pm-5pm
    if (event.energyCost >= 4 || event.type === "FOCUS") {
      if ((hour >= 9 && hour < 12) || (hour >= 14 && hour < 17)) {
        score += 100 // Peak focus hours
      } else if (hour >= 8 && hour < 18) {
        score += 70 // Acceptable hours
      } else {
        score += 30 // Off-hours penalty
      }
    } else {
      // Low-energy tasks are fine anytime
      score += 100
    }
  }

  return score / events.length
}

/**
 * Overall schedule score (weighted average).
 */
export function scoreSchedule(events: Event[]): number {
  const weights = {
    dayBalance: 0.4,
    contextSwitching: 0.25,
    recoveryTime: 0.2,
    timePreference: 0.15
  }

  const scores = {
    dayBalance: scoreDayBalance(events),
    contextSwitching: scoreContextSwitching(events),
    recoveryTime: scoreRecoveryTime(events),
    timePreference: scoreTimePreference(events)
  }

  return (
    scores.dayBalance * weights.dayBalance +
    scores.contextSwitching * weights.contextSwitching +
    scores.recoveryTime * weights.recoveryTime +
    scores.timePreference * weights.timePreference
  )
}

/**
 * Get detailed scoring breakdown.
 */
export function getScoreBreakdown(events: Event[]) {
  return {
    overall: scoreSchedule(events),
    dayBalance: scoreDayBalance(events),
    contextSwitching: scoreContextSwitching(events),
    recoveryTime: scoreRecoveryTime(events),
    timePreference: scoreTimePreference(events)
  }
}
