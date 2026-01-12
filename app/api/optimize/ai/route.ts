import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { rewriteEngine } from "@/lib/rewrite/engine"
import { Event } from "@/lib/intelligence"

export async function POST(req: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const weekStartStr = body.weekStart

    // 1. Fetch user events for the requested week
    // If no weekStart provided, default to "now" (legacy behavior protection)
    const startDate = weekStartStr ? new Date(weekStartStr) : new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 7)

    const events = await prisma.event.findMany({
      where: {
        userId,
        start: { gte: startDate, lt: endDate }
      }
    }) as unknown as Event[]

    if (events.length === 0) {
      return NextResponse.json({
        optimizedEvents: [],
        changes: [],
        explanation: "No events to optimize."
      })
    }

    // 2. Run Optimizer (Local or AI)
    const apiKey = req.headers.get("x-openai-key") || undefined // Keeping legacy name for now to avoid client-side breaking if variable names linger
    const aiProvider = req.headers.get("x-ai-provider") || "openai"

    // logic to determine whether to use AI or local is handled inside optimizeSchedule based on apiKey presence
    const result = await rewriteEngine.optimizeSchedule(events, undefined, startDate, apiKey, aiProvider)

    // 3. Apply changes to database if any events were moved
    if (result.changes.length > 0) {
      for (const optimizedEvent of result.optimizedEvents) {
        const originalEvent = events.find(e => e.id === optimizedEvent.id)

        // Check if this event was actually moved
        if (originalEvent &&
          (new Date(originalEvent.start).getTime() !== new Date(optimizedEvent.start).getTime())) {
          await prisma.event.update({
            where: { id: optimizedEvent.id },
            data: {
              start: new Date(optimizedEvent.start),
              end: new Date(optimizedEvent.end)
            }
          })
        }
      }
    }

    return NextResponse.json(result)

  } catch (error) {

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
