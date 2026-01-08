import { NormalizedEvent, SyncProvider } from "./types"

// Google Calendar API base URL
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  location?: string
  status: string
  recurringEventId?: string
  recurrence?: string[]
}

export interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[]
  nextPageToken?: string
}

export class GoogleCalendarProvider implements SyncProvider {
  name = "GOOGLE"

  /**
   * Fetch events from Google Calendar using OAuth access token
   * @param accessToken - OAuth access token from Clerk
   */
  async fetchEvents(accessToken: string): Promise<NormalizedEvent[]> {
    if (!accessToken || accessToken === "mock_token") {
      console.warn("[GoogleCalendar] No valid access token provided")
      return []
    }

    try {
      // Calculate time range (current week + 2 weeks ahead)
      const now = new Date()
      const timeMin = new Date(now)
      timeMin.setDate(timeMin.getDate() - 7) // Past week
      const timeMax = new Date(now)
      timeMax.setDate(timeMax.getDate() + 21) // 3 weeks ahead

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: "true", // Expand recurring events
        orderBy: "startTime",
        maxResults: "100",
      })

      const response = await fetch(
        `${GOOGLE_CALENDAR_API}/calendars/primary/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      )

      if (!response.ok) {
        const error = await response.text()
        console.error("[GoogleCalendar] API Error:", response.status, error)

        if (response.status === 401) {
          throw new Error("INVALID_TOKEN")
        }
        throw new Error(`Google Calendar API error: ${response.status}`)
      }

      const data: GoogleCalendarListResponse = await response.json()
      console.log(`[GoogleCalendar] Fetched ${data.items?.length || 0} events`)

      return (data.items || [])
        .filter(event => event.status !== "cancelled")
        .map(event => this.normalizeEvent(event))

    } catch (error) {
      console.error("[GoogleCalendar] Fetch failed:", error)
      throw error
    }
  }

  /**
   * Convert Google Calendar event to our normalized format
   */
  private normalizeEvent(event: GoogleCalendarEvent): NormalizedEvent {
    // Handle all-day events (use date instead of dateTime)
    const isAllDay = !event.start.dateTime
    const start = new Date(event.start.dateTime || event.start.date || new Date())
    const end = new Date(event.end.dateTime || event.end.date || new Date())

    // Infer event type from title/description
    const type = this.inferEventType(event.summary, event.description)

    // Estimate energy cost based on event type and duration
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    const energyCost = this.estimateEnergyCost(type, durationHours)

    return {
      title: event.summary || "Untitled Event",
      description: event.description || null,
      start,
      end,
      allDay: isAllDay,
      location: event.location || null,
      source: "GOOGLE",
      externalId: event.id,
      type,
      energyCost,
      cognitiveLoad: Math.min(5, Math.max(1, Math.round(energyCost * 0.8))),
      importance: 3, // Default, can be adjusted
      flexibility: event.recurringEventId ? 1 : 3, // Recurring = less flexible
      isRecurring: !!event.recurringEventId || !!event.recurrence,
      recurrenceRule: event.recurrence?.[0] || null,
      recurrenceParentId: event.recurringEventId || null,
      causedById: null,
      tags: this.extractTags(event.summary, event.description),
      notes: null,
    }
  }

  /**
   * Infer event type from title and description
   */
  private inferEventType(title: string, description?: string): "MEETING" | "TASK" | "HABIT" | "FOCUS" | "BREAK" | "PERSONAL" {
    const text = `${title} ${description || ""}`.toLowerCase()

    if (/\b(meet|call|sync|1:1|standup|interview|review|demo)\b/.test(text)) {
      return "MEETING"
    }
    if (/\b(focus|deep work|coding|writing|design)\b/.test(text)) {
      return "FOCUS"
    }
    if (/\b(gym|workout|exercise|yoga|run|meditation|meditate)\b/.test(text)) {
      return "HABIT"
    }
    if (/\b(break|lunch|coffee|rest)\b/.test(text)) {
      return "BREAK"
    }
    if (/\b(birthday|party|dinner|date|family|friend)\b/.test(text)) {
      return "PERSONAL"
    }

    return "TASK" // Default
  }

  /**
   * Estimate energy cost based on event type and duration
   */
  private estimateEnergyCost(type: string, durationHours: number): number {
    const baseEnergy: Record<string, number> = {
      MEETING: 4,
      FOCUS: 4,
      TASK: 3,
      HABIT: 2,
      BREAK: 1,
      PERSONAL: 2,
    }

    let cost = baseEnergy[type] || 3

    // Adjust for duration
    if (durationHours > 2) cost = Math.min(5, cost + 1)
    if (durationHours < 0.5) cost = Math.max(1, cost - 1)

    return cost
  }

  /**
   * Extract tags from event text
   */
  private extractTags(title: string, description?: string): string[] {
    const tags: string[] = []
    const text = `${title} ${description || ""}`.toLowerCase()

    // Common tag patterns
    if (/work|job|office|project/.test(text)) tags.push("work")
    if (/personal|home|family/.test(text)) tags.push("personal")
    if (/health|gym|doctor|medical/.test(text)) tags.push("health")
    if (/social|friend|party|dinner/.test(text)) tags.push("social")
    if (/learn|course|study|training/.test(text)) tags.push("learning")

    return tags
  }
}
