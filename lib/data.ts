import { cache } from "react"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { generateWeekInsights, calculateDayLoad, suggestRescheduling, ENERGY_THRESHOLDS } from "@/lib/intelligence"
import { startOfWeek, addDays, endOfWeek } from "date-fns"

export const getUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
})

export const getEvents = cache(async (weekStart: Date, weekEnd: Date) => {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.event.findMany({
    where: {
      userId: session.user.id,
      start: { gte: weekStart },
      end: { lte: weekEnd },
    },
    orderBy: { start: "asc" },
  })
})

export const getInsights = cache(async (weekStart: Date) => {
  const session = await auth()
  if (!session?.user?.id) return null

  const weekEnd = addDays(weekStart, 7)

  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id,
      start: { gte: weekStart },
      end: { lte: weekEnd },
    },
    orderBy: { start: "asc" },
  })

  const insights = generateWeekInsights(events, weekStart)

  const dailyLoads = []
  for (let i = 0; i < 7; i++) {
    const day = addDays(weekStart, i)
    dailyLoads.push(calculateDayLoad(events, day))
  }

  const suggestions = suggestRescheduling(events, weekStart)

  const totalEnergy = dailyLoads.reduce((sum, d) => sum + d.totalEnergy, 0)
  const burnoutRisk = dailyLoads.filter(d => d.status === "burnout").length > 0
  const heavyDays = dailyLoads.filter(d => d.status === "heavy" || d.status === "burnout").length

  return {
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
  }
})

export function getWeekDates(date: Date = new Date()) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 })
  return { weekStart, weekEnd }
}
