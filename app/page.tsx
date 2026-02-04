import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { getEvents, getInsights, getWeekDates } from "@/lib/data"
import { LandingPage } from "@/components/LandingPage"
import { CalendarShell } from "@/components/CalendarShell"
import { CalendarSkeleton } from "@/components/CalendarSkeleton"

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return <LandingPage />
  }

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarContent />
    </Suspense>
  )
}

async function CalendarContent() {
  const { weekStart, weekEnd } = getWeekDates()
  
  const [events, insights] = await Promise.all([
    getEvents(weekStart, weekEnd),
    getInsights(weekStart),
  ])

  return (
    <CalendarShell 
      initialEvents={events} 
      initialInsights={insights}
      initialWeekStart={weekStart.toISOString()}
    />
  )
}
