
import { LocalOptimizer } from "../lib/optimizer/engine"
import { Event } from "../lib/intelligence"

const optimizer = new LocalOptimizer()

// Mock events
const now = new Date()
const monday = new Date(now)
monday.setDate(monday.getDate() - monday.getDay() + 1) // Next Monday
monday.setHours(10, 0, 0, 0)

const tuesday = new Date(monday)
tuesday.setDate(tuesday.getDate() + 1)

// Create a scenario likely to fail or be on the edge
const events: Event[] = [
    // Heavy Monday (Load 26) - Just barely over threshold?
    {
        id: "1", title: "Heavy Work", start: monday, end: new Date(monday.getTime() + 6 * 3600000),
        energyCost: 20, flexibility: 1, type: "FOCUS", userId: "user1", createdAt: new Date(), updatedAt: new Date(),
        allDay: false, source: "MANUAL", cognitiveLoad: 10, importance: 10, tags: [], isRecurring: false, recurrenceRule: null,
        recurrenceParentId: null, causedById: null, notes: null, description: null
    },
    {
        id: "2", title: "Slightly Flexible", start: monday, end: new Date(monday.getTime() + 2 * 3600000),
        energyCost: 6, flexibility: 3, type: "TASK", userId: "user1", createdAt: new Date(), updatedAt: new Date(),
        allDay: false, source: "MANUAL", cognitiveLoad: 5, importance: 5, tags: [], isRecurring: false, recurrenceRule: null,
        recurrenceParentId: null, causedById: null, notes: null, description: null
    },
    // Light Tuesday (Load 2)
    {
        id: "3", title: "Tiny Task", start: tuesday, end: new Date(tuesday.getTime() + 0.5 * 3600000),
        energyCost: 2, flexibility: 3, type: "TASK", userId: "user1", createdAt: new Date(), updatedAt: new Date(),
        allDay: false, source: "MANUAL", cognitiveLoad: 3, importance: 3, tags: [], isRecurring: false, recurrenceRule: null,
        recurrenceParentId: null, causedById: null, notes: null, description: null
    }
]

console.log("Running optimizer verification (Debug Mode)...")
optimizer.optimize(events)
