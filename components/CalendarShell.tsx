"use client"

import * as React from "react"
import { WeeklyCalendar, Event } from "@/components/WeeklyCalendar"

type InsightsData = {
  insights: { type: "warning" | "suggestion" | "info"; title: string; description: string; suggestedAction?: string }[]
  dailyLoads: { date: string; totalEnergy: number; status: "light" | "moderate" | "heavy" | "burnout"; eventCount: number }[]
  suggestions: { eventId: string; eventTitle: string; fromDay: string; toDay: string; reason: string }[]
  summary: { totalEnergy: number; burnoutRisk: boolean; heavyDays: number; eventCount: number }
}

interface CalendarShellProps {
  initialEvents: Event[]
  initialInsights: InsightsData | null
  initialWeekStart: string
}

export function CalendarShell({ initialEvents, initialInsights, initialWeekStart }: CalendarShellProps) {
  return (
    <div className="h-screen w-full overflow-hidden">
      <WeeklyCalendar 
        initialEvents={initialEvents}
        initialInsights={initialInsights}
        initialWeekStart={initialWeekStart}
      />
    </div>
  )
}
