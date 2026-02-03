import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { rewriteEngine } from "@/lib/rewrite/engine"
import { Event } from "@/lib/intelligence"

export async function POST(req: Request) {
  const sessionPromise = auth()
  const bodyPromise = req.json()
  const apiKey = req.headers.get("x-openai-key") || undefined
  const aiProvider = req.headers.get("x-ai-provider") || "openai"
  
  const [session, body] = await Promise.all([sessionPromise, bodyPromise])

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const weekStartStr = body.weekStart
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

    const result = await rewriteEngine.optimizeSchedule(events, undefined, startDate, apiKey, aiProvider)

    if (result.changes.length > 0) {
      for (const optimizedEvent of result.optimizedEvents) {
        const originalEvent = events.find(e => e.id === optimizedEvent.id)

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
