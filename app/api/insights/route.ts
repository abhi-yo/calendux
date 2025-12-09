import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { generateWeekInsights, calculateDayLoad, suggestRescheduling, ENERGY_THRESHOLDS } from "@/lib/intelligence"
import { startOfWeek, addDays } from "date-fns"

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const weekStartParam = searchParams.get("weekStart")
    
    const weekStart = weekStartParam 
      ? startOfWeek(new Date(weekStartParam), { weekStartsOn: 1 })
      : startOfWeek(new Date(), { weekStartsOn: 1 })
    
    const weekEnd = addDays(weekStart, 7)

    // Fetch events for the week
    const events = await prisma.event.findMany({
      where: {
        userId,
        start: { gte: weekStart },
        end: { lte: weekEnd },
      },
      orderBy: { start: "asc" },
    })

    // Generate insights
    const insights = generateWeekInsights(events, weekStart)
    
    // Calculate daily loads
    const dailyLoads = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i)
      dailyLoads.push(calculateDayLoad(events, day))
    }
    
    // Get rescheduling suggestions
    const suggestions = suggestRescheduling(events, weekStart)
    
    // Calculate week summary
    const totalEnergy = dailyLoads.reduce((sum, d) => sum + d.totalEnergy, 0)
    const burnoutRisk = dailyLoads.filter(d => d.status === "burnout").length > 0
    const heavyDays = dailyLoads.filter(d => d.status === "heavy" || d.status === "burnout").length

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      insights,
      dailyLoads: dailyLoads.map(d => ({
        date: d.date.toISOString(),
        totalEnergy: d.totalEnergy,
        status: d.status,
        eventCount: d.events.length,
        peakHour: d.peakHour,
      })),
      suggestions: suggestions.map(s => ({
        eventId: s.event.id,
        eventTitle: s.event.title,
        fromDay: s.fromDay.toISOString(),
        toDay: s.toDay.toISOString(),
        reason: s.reason,
      })),
      summary: {
        totalEnergy,
        burnoutRisk,
        heavyDays,
        eventCount: events.length,
        thresholds: ENERGY_THRESHOLDS,
      },
    })
  } catch (error) {
    console.error("Error generating insights:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
