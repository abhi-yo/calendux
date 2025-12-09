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
    // 1. Fetch user events for next 7 days
    const now = new Date()
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)

    const events = await prisma.event.findMany({
        where: {
            userId,
            start: { gte: now, lte: nextWeek }
        }
    }) as unknown as Event[]

    if (events.length === 0) {
      return NextResponse.json({
        optimizedEvents: [],
        changes: [],
        explanation: "No events to optimize."
      })
    }

    // 2. Run Local Optimizer (no API key needed!)
    const result = await rewriteEngine.optimizeSchedule(events)

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
    console.error("Optimize API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
