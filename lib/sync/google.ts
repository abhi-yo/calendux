import { NormalizedEvent, SyncProvider } from "./types"

export class GoogleCalendarProvider implements SyncProvider {
  name = "GOOGLE"

  async fetchEvents(accessToken: string): Promise<NormalizedEvent[]> {
    // STUB: Real implementation would verify token and call Google API
    // For MVP, we return mock data simulating a "Work Calendar"
    
    console.log("Fetching Google Calendar events with token stub:", accessToken)

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return [
      {
        title: "Team Standup (GCal)",
        description: "Daily sync with engineering team",
        start: new Date(now.setHours(10, 0, 0, 0)),
        end: new Date(now.setHours(10, 30, 0, 0)),
        allDay: false,
        location: "Google Meet",
        source: "GOOGLE",
        externalId: "gcal_123_stub",
        type: "MEETING",
        energyCost: 3,
        cognitiveLoad: 3,
        importance: 4,
        flexibility: 1,
        isRecurring: true,
        recurrenceRule: "FREQ=DAILY;COUNT=5",
        recurrenceParentId: null,
        causedById: null,
        tags: ["work", "team"],
        notes: null
      },
      {
        title: "Project Review (GCal)",
        description: "Review Q4 roadmap",
        start: new Date(tomorrow.setHours(14, 0, 0, 0)),
        end: new Date(tomorrow.setHours(15, 30, 0, 0)),
        allDay: false,
        location: "Conference Room A",
        source: "GOOGLE",
        externalId: "gcal_456_stub",
        type: "MEETING",
        energyCost: 4, // High drain
        cognitiveLoad: 5,
        importance: 5,
        flexibility: 2,
        isRecurring: false,
        recurrenceRule: null,
        recurrenceParentId: null,
        causedById: null,
        tags: ["work", "strategy"],
        notes: null
      }
    ]
  }
}
