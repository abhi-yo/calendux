import { Event, ENERGY_THRESHOLDS, calculateDayLoad } from "@/lib/intelligence"
import { Conflict, ConflictType } from "./types"

export class ConflictDetector {

  /**
   * Detects both hard scheduling conflicts and soft energy/focus conflicts.
   */
  detectConflicts(events: Event[]): Conflict[] {
    const conflicts: Conflict[] = []
    
    // Sort by start time
    const sorted = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    // 1. Hard Overlaps (Time)
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i+1]

      // Check intersection
      if (new Date(current.end) > new Date(next.start)) {
        conflicts.push({
          id: `overlap-${current.id}-${next.id}`,
          type: ConflictType.HARD_OVERLAP,
          severity: "high",
          title: "Double Booking",
          description: `"${current.title}" overlaps with "${next.title}"`,
          eventIds: [current.id, next.id],
          suggestedAction: "Reschedule one of the events"
        })
      }
    }

    // 2. Energy Overload (Daily)
    // Group by day
    const distinctDates = new Set(sorted.map(e => new Date(e.start).toDateString()))
    distinctDates.forEach(dateStr => {
        const date = new Date(dateStr)
        const dayLoad = calculateDayLoad(sorted, date)
        
        if (dayLoad.status === "burnout") {
             conflicts.push({
                id: `burnout-${dateStr}`,
                type: ConflictType.ENERGY_OVERLOAD,
                severity: "high",
                title: "Burnout Risk",
                description: `Total energy load for ${dateStr} is dangerous (${dayLoad.totalEnergy.toFixed(1)})`,
                eventIds: dayLoad.events.map(e => e.id),
                suggestedAction: "Move flexible tasks to another day"
             })
        }
    })

    // 3. Recovery Required (Fatigue)
    // Detect > 4 hours of High Cognitive Load (4+) without meaningful break
    let consecutiveHighLoadMinutes = 0
    let lastHighLoadEventEnd: Date | null = null
    const HIGH_LOAD_THRESHOLD = 4

    for (const event of sorted) {
        // Assume cognitiveLoad is available on event (it is in our new schema)
        // Fallback to energyCost if cognitiveLoad missing (for legacy compat)
        const load = (event as any).cognitiveLoad || event.energyCost || 3
        
        const durationMinutes = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000

        if (load >= HIGH_LOAD_THRESHOLD) {
            // Check if there was a gap since last high load
            if (lastHighLoadEventEnd && (new Date(event.start).getTime() - lastHighLoadEventEnd.getTime()) > 30 * 60000) {
                 // Reset if > 30 min break
                 consecutiveHighLoadMinutes = 0
            }
            
            consecutiveHighLoadMinutes += durationMinutes
            lastHighLoadEventEnd = new Date(event.end)

            if (consecutiveHighLoadMinutes > 240) { // 4 hours
                 conflicts.push({
                     id: `fatigue-${event.id}`,
                     type: ConflictType.RECOVERY_REQUIRED,
                     severity: "medium",
                     title: " cognitive Fatigue",
                     description: "More than 4 hours of intense work without a substantial break.",
                     eventIds: [event.id],
                     suggestedAction: "Schedule a 15 min break immediately"
                 })
                 // Reset to avoid spamming for every subsequent event
                 consecutiveHighLoadMinutes = 0 
            }
        }
    }

    return conflicts
  }
}

export const conflictDetector = new ConflictDetector()
