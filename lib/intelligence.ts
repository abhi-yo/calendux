// Event type matching Prisma schema
export type Event = {
  id: string
  title: string
  description: string | null
  start: Date
  end: Date
  allDay: boolean
  location?: string | null
  source: "MANUAL" | "GOOGLE" | "NOTION" | "TODOIST" | "SLACK"
  externalId?: string | null
  type: "MEETING" | "TASK" | "HABIT" | "FOCUS" | "BREAK" | "PERSONAL"
  energyCost: number
  cognitiveLoad: number
  importance: number
  flexibility: number
  contextTag?: string | null
  isRecurring: boolean
  recurrenceRule: string | null
  recurrenceParentId: string | null
  causedById: string | null
  tags: string[]
  notes: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

// Energy thresholds
export const ENERGY_THRESHOLDS = {
  LOW: 8,      // Total daily energy under this is light
  MEDIUM: 15,  // Under this is moderate
  HIGH: 22,    // Under this is heavy
  BURNOUT: 30, // Above this is burnout risk
}

// Time of day energy multipliers (cognitive load is higher at certain times)
const TIME_MULTIPLIERS: Record<number, number> = {
  0: 0.5, 1: 0.5, 2: 0.5, 3: 0.5, 4: 0.5, 5: 0.6,
  6: 0.7, 7: 0.8, 8: 0.9, 9: 1.0, 10: 1.0, 11: 1.0,
  12: 0.8, 13: 0.7, 14: 0.8, 15: 0.9, 16: 0.9, 17: 0.8,
  18: 0.7, 19: 0.6, 20: 0.5, 21: 0.5, 22: 0.5, 23: 0.5,
}

export interface DayLoad {
  date: Date
  totalEnergy: number
  peakHour: number
  peakLoad: number
  events: Event[]
  status: "light" | "moderate" | "heavy" | "burnout"
  hourlyLoad: Record<number, number>
}

export interface WeekInsight {
  type: "warning" | "suggestion" | "info"
  title: string
  description: string
  affectedEvents?: string[]
  suggestedAction?: string
}

export interface CausalChain {
  rootEvent: Event
  chain: Event[]
  totalImpact: number
}

/**
 * Calculate the energy load for a single event
 */
export function calculateEventLoad(event: Event): number {
  const durationHours = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60)
  const startHour = new Date(event.start).getHours()
  const timeMultiplier = TIME_MULTIPLIERS[startHour] || 1
  
  return event.energyCost * durationHours * timeMultiplier
}

/**
 * Calculate hourly load distribution for a day
 */
export function calculateHourlyLoad(events: Event[], date: Date): Record<number, number> {
  const hourlyLoad: Record<number, number> = {}
  
  // Initialize all hours
  for (let h = 0; h < 24; h++) {
    hourlyLoad[h] = 0
  }
  
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  
  events.forEach(event => {
    const eventStart = new Date(event.start)
    const eventEnd = new Date(event.end)
    
    // Skip events not on this day
    if (eventEnd < dayStart || eventStart > dayEnd) return
    
    const startHour = Math.max(0, eventStart.getHours())
    const endHour = Math.min(23, eventEnd.getHours())
    
    for (let h = startHour; h <= endHour; h++) {
      hourlyLoad[h] += event.energyCost * TIME_MULTIPLIERS[h]
    }
  })
  
  return hourlyLoad
}

/**
 * Calculate the total load for a day
 */
export function calculateDayLoad(events: Event[], date: Date): DayLoad {
  const dayEvents = events.filter(e => {
    const eventDate = new Date(e.start)
    return eventDate.toDateString() === date.toDateString()
  })
  
  const hourlyLoad = calculateHourlyLoad(dayEvents, date)
  const totalEnergy = dayEvents.reduce((sum, e) => sum + calculateEventLoad(e), 0)
  
  // Find peak hour
  let peakHour = 0
  let peakLoad = 0
  Object.entries(hourlyLoad).forEach(([hour, load]) => {
    if (load > peakLoad) {
      peakHour = parseInt(hour)
      peakLoad = load
    }
  })
  
  // Determine status
  let status: DayLoad["status"] = "light"
  if (totalEnergy >= ENERGY_THRESHOLDS.BURNOUT) {
    status = "burnout"
  } else if (totalEnergy >= ENERGY_THRESHOLDS.HIGH) {
    status = "heavy"
  } else if (totalEnergy >= ENERGY_THRESHOLDS.MEDIUM) {
    status = "moderate"
  }
  
  return {
    date,
    totalEnergy,
    peakHour,
    peakLoad,
    events: dayEvents,
    status,
    hourlyLoad,
  }
}

/**
 * Generate insights for a week's events
 */
export function generateWeekInsights(events: Event[], weekStart: Date): WeekInsight[] {
  const insights: WeekInsight[] = []
  const days: DayLoad[] = []
  
  // Calculate load for each day
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + i)
    days.push(calculateDayLoad(events, day))
  }
  
  // Check for burnout days
  const burnoutDays = days.filter(d => d.status === "burnout")
  if (burnoutDays.length > 0) {
    insights.push({
      type: "warning",
      title: "Burnout Risk Detected",
      description: `You have ${burnoutDays.length} day(s) with dangerously high cognitive load. Consider rescheduling.`,
      affectedEvents: burnoutDays.flatMap(d => d.events.map(e => e.id)),
      suggestedAction: "Move flexible events to lighter days",
    })
  }
  
  // Check for back-to-back heavy days
  for (let i = 0; i < days.length - 1; i++) {
    if (days[i].status === "heavy" && days[i + 1].status === "heavy") {
      insights.push({
        type: "warning",
        title: "Consecutive Heavy Days",
        description: `${formatDay(days[i].date)} and ${formatDay(days[i + 1].date)} are both heavily loaded. This pattern leads to exhaustion.`,
        suggestedAction: "Add a buffer day between heavy workloads",
      })
    }
  }
  
  // Check for meeting overload
  const meetingEvents = events.filter(e => e.type === "MEETING")
  const meetingHours = meetingEvents.reduce((sum, e) => {
    return sum + (new Date(e.end).getTime() - new Date(e.start).getTime()) / (1000 * 60 * 60)
  }, 0)
  
  if (meetingHours > 20) {
    insights.push({
      type: "warning",
      title: "Meeting Overload",
      description: `You have ${meetingHours.toFixed(1)} hours of meetings this week. This leaves little time for deep work.`,
      suggestedAction: "Decline or reschedule non-essential meetings",
    })
  }
  
  // Check for lack of focus time
  const focusEvents = events.filter(e => e.type === "FOCUS")
  if (focusEvents.length < 3) {
    insights.push({
      type: "suggestion",
      title: "Insufficient Focus Time",
      description: "You have very few dedicated focus blocks. Deep work requires uninterrupted time.",
      suggestedAction: "Block at least 2-3 focus sessions per week",
    })
  }
  
  // Check for no breaks
  const breakEvents = events.filter(e => e.type === "BREAK")
  if (breakEvents.length === 0) {
    insights.push({
      type: "suggestion",
      title: "No Scheduled Breaks",
      description: "Taking breaks improves productivity and prevents burnout.",
      suggestedAction: "Add short breaks between intensive work blocks",
    })
  }
  
  // Find causal chains
  const eventsWithCause = events.filter(e => e.causedById)
  if (eventsWithCause.length > 0) {
    const uniqueCauses = [...new Set(eventsWithCause.map(e => e.causedById))]
    uniqueCauses.forEach(causeId => {
      const rootEvent = events.find(e => e.id === causeId)
      const caused = eventsWithCause.filter(e => e.causedById === causeId)
      if (rootEvent && caused.length >= 2) {
        insights.push({
          type: "info",
          title: "Causal Chain Detected",
          description: `"${rootEvent.title}" has spawned ${caused.length} follow-up events.`,
          affectedEvents: [rootEvent.id, ...caused.map(e => e.id)],
        })
      }
    })
  }
  
  return insights
}

/**
 * Find the most flexible events that could be rescheduled
 */
export function findRescheduleCandidates(events: Event[]): Event[] {
  return events
    .filter(e => e.flexibility >= 3)
    .sort((a, b) => b.flexibility - a.flexibility)
    .slice(0, 5)
}

/**
 * Suggest optimal rescheduling for overloaded days
 */
export function suggestRescheduling(
  events: Event[], 
  weekStart: Date
): { event: Event; fromDay: Date; toDay: Date; reason: string }[] {
  const suggestions: { event: Event; fromDay: Date; toDay: Date; reason: string }[] = []
  const days: DayLoad[] = []
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + i)
    days.push(calculateDayLoad(events, day))
  }
  
  // Find overloaded and light days
  const overloadedDays = days.filter(d => d.status === "heavy" || d.status === "burnout")
  const lightDays = days.filter(d => d.status === "light")
  
  overloadedDays.forEach(heavyDay => {
    const flexibleEvents = heavyDay.events
      .filter(e => e.flexibility >= 3)
      .sort((a, b) => b.flexibility - a.flexibility)
    
    if (flexibleEvents.length > 0 && lightDays.length > 0) {
      suggestions.push({
        event: flexibleEvents[0],
        fromDay: heavyDay.date,
        toDay: lightDays[0].date,
        reason: `Moving "${flexibleEvents[0].title}" would balance your week better`,
      })
    }
  })
  
  return suggestions
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/**
 * Smart Optimization Algorithm
 * Reshuffles flexible events to balance load across the week.
 */
export function optimizeSchedule(events: Event[], weekStart: Date): Event[] {
  // Clone events to avoid mutating original array
  let optimizedEvents = JSON.parse(JSON.stringify(events)) as Event[]
  
  // 1. Calculate daily loads
  const days: DayLoad[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + i)
    // Recalculate load with current state of optimizedEvents
    days.push(calculateDayLoad(optimizedEvents, day))
  }

  // 2. Identify unbalanced days
  const heavyDays = days.filter(d => d.status === "heavy" || d.status === "burnout")
  const lightDays = days.filter(d => d.status === "light" || d.status === "moderate")
    .sort((a, b) => a.totalEnergy - b.totalEnergy) // Sort by lightest first

  // 3. Move events
  heavyDays.forEach(heavyDay => {
    // Find movable events (flexibility > 3, not caused by others)
    const movableEvents = heavyDay.events
      .filter(e => e.flexibility >= 4 && !e.causedById)
      .sort((a, b) => b.energyCost - a.energyCost) // Move big drains first

    movableEvents.forEach(event => {
      // Find a target day that can accept this load
      const eventLoad = calculateEventLoad(event)
      const targetDay = lightDays.find(d => d.totalEnergy + eventLoad < ENERGY_THRESHOLDS.HIGH)

      if (targetDay) {
        // Move event to target day
        // Keep original time for simplicity, just change date
        // Ideally we'd find a free slot, but preserving time is a safe heuristic for now
        const oldStart = new Date(event.start)
        const oldEnd = new Date(event.end)
        const newStart = new Date(targetDay.date)
        newStart.setHours(oldStart.getHours(), oldStart.getMinutes())
        const newEnd = new Date(targetDay.date)
        newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes())

        // Update event in our working set
        const eventIndex = optimizedEvents.findIndex(e => e.id === event.id)
        if (eventIndex !== -1) {
          optimizedEvents[eventIndex].start = newStart
          optimizedEvents[eventIndex].end = newEnd
        }

        // Update target day load locally to prevent overfilling
        targetDay.totalEnergy += eventLoad
      }
    })
  })

  // Return only the events that changed? No, return full set for simplicity, UI diffs it.
  return optimizedEvents
}
