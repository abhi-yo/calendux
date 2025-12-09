"use client"

import * as React from "react"
import { addDays, format, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay, addWeeks, subWeeks, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Zap, Plus, PanelRightOpen, PanelRightClose, Sparkles, Sun, Moon } from "lucide-react"
import { EventDialog } from "@/components/EventDialog"
import { InsightsPanel } from "@/components/InsightsPanel"
import { UserButton } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { UpgradeDialog } from "./UpgradeDialog"

// Event type matching API response
export type Event = {
  id: string
  title: string
  description?: string | null
  start: string | Date
  end: string | Date
  allDay: boolean
  location?: string | null
  source: "MANUAL" | "GOOGLE" | "NOTION" | "TODOIST" | "SLACK"
  externalId?: string | null
  type: string
  energyCost: number
  cognitiveLoad: number
  importance: number
  flexibility: number
  contextTag?: string | null
  causedById?: string | null
}

// Insights data type
type InsightsData = {
  insights: { type: "warning" | "suggestion" | "info"; title: string; description: string; suggestedAction?: string }[]
  dailyLoads: { date: string; totalEnergy: number; status: "light" | "moderate" | "heavy" | "burnout"; eventCount: number }[]
  suggestions: { eventId: string; eventTitle: string; fromDay: string; toDay: string; reason: string }[]
  summary: { totalEnergy: number; burnoutRisk: boolean; heavyDays: number; eventCount: number }
}

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [events, setEvents] = React.useState<Event[]>([])
  const [insights, setInsights] = React.useState<InsightsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [showInsights, setShowInsights] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<any>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [optimizing, setOptimizing] = React.useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = React.useState(false)
  const [upgradeFeature, setUpgradeFeature] = React.useState("")
  const { theme, setTheme } = useTheme()

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Fetch events
  const fetchEvents = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/events?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }, [weekStart.toISOString(), weekEnd.toISOString()])

  // Fetch insights
  const fetchInsights = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/insights?weekStart=${weekStart.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        setInsights(data)
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error)
    }
  }, [weekStart.toISOString()])

  // Initial load
  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchEvents(), fetchInsights()])
      setLoading(false)
    }
    load()
  }, [fetchEvents, fetchInsights])

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7))
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7))
  const today = () => setCurrentDate(new Date())

  // Determine user tier (Mock for now, easy to switch to real later)
  const isFreeTier = true // HARDCODED FOR DEMO to show gating

  const handleOptimize = async () => {
    if (isFreeTier) {
      setUpgradeFeature("AI Rewrite Engine")
      setShowUpgradeDialog(true)
      return
    }

    setOptimizing(true)
    try {
      const res = await fetch("/api/optimize/ai", { method: "POST" })
      if (res.ok) {
        toast.success("Schedule optimized!")
        await fetchEvents()
        await fetchInsights()
      } else {
        toast.error("Optimization failed")
      }
    } catch {
      toast.error("Error connecting to AI")
    } finally {
      setOptimizing(false)
    }
  }

  const handleCreateEvent = async (formData: {
    title: string
    description?: string
    start: string
    end: string
    date: string
    type: string
    energyCost: number
    importance: number
    flexibility: number
    causedById?: string
    notes?: string
  }) => {
    try {
      const startDate = new Date(`${formData.date}T${formData.start}`)
      const endDate = new Date(`${formData.date}T${formData.end}`)

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: formData.type,
          energyCost: formData.energyCost,
          importance: formData.importance,
          flexibility: formData.flexibility,
          causedById: formData.causedById || null,
          notes: formData.notes,
        }),
      })

      if (res.ok) {
        toast.success("Event created")
        setDialogOpen(false)
        await fetchEvents()
        await fetchInsights()
      }
    } catch (error) {
      console.error("Failed to create event:", error)
    }
  }

  const handleUpdateEvent = async (formData: any) => {
    try {
      if (!editingEvent?.id) return

      const startDate = new Date(`${formData.date}T${formData.start}`)
      const endDate = new Date(`${formData.date}T${formData.end}`)

      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          type: formData.type,
          energyCost: formData.energyCost,
          importance: formData.importance,
          flexibility: formData.flexibility,
          causedById: formData.causedById || null,
          notes: formData.notes,
        }),
      })

      if (res.ok) {
        toast.success("Event updated")
        setDialogOpen(false)
        setEditingEvent(null)
        await fetchEvents()
        await fetchInsights()
      } else {
        toast.error("Failed to update event")
      }
    } catch (error) {
      console.error("Failed to update event:", error)
      toast.error("Error updating event")
    }
  }

  const handleDeleteEvent = async (eventId?: string) => {
    const id = eventId || editingEvent?.id
    if (!id) return

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Event deleted")
        setDialogOpen(false)
        setEditingEvent(null)
        await fetchEvents()
        await fetchInsights()
      } else {
        toast.error("Failed to delete event")
      }
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast.error("Error deleting event")
    }
  }

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      MEETING: "bg-blue-600",
      TASK: "bg-indigo-500",
      HABIT: "bg-purple-500",
      FOCUS: "bg-emerald-500",
      BREAK: "bg-teal-500",
      PERSONAL: "bg-pink-500",
    }
    return colors[type] || "bg-indigo-500"
  }

  const getDayStatus = (day: Date) => {
    const dayLoad = insights?.dailyLoads.find(d => 
      new Date(d.date).toDateString() === day.toDateString()
    )
    return dayLoad?.status || "light"
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* ===== HEADER - Elevated with depth ===== */}
      <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03),0_1px_3px_0_rgba(0,0,0,0.3)] shadow-sm">
        {/* Left: Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextWeek} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={today}>
            Today
          </Button>
          <h1 className="text-lg font-semibold ml-2">
            {format(weekStart, "MMMM yyyy")}
          </h1>
          {insights?.summary.burnoutRisk && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full flex items-center gap-1">
              <Zap className="h-3 w-3" /> Burnout Risk
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* AI Optimize - Depth button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleOptimize}
            disabled={optimizing}
            className="gap-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_4px_0_rgba(0,0,0,0.15)] transition-shadow"
          >
            <Sparkles className="h-4 w-4" />
            {optimizing ? "Optimizing..." : "AI Optimize"}
          </Button>

          {/* Insights Toggle - Depth button */}
          <Button 
            variant={showInsights ? "secondary" : "outline"} 
            size="sm" 
            onClick={() => setShowInsights(!showInsights)}
            className="gap-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_4px_0_rgba(0,0,0,0.15)] transition-shadow"
          >
            {showInsights ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            Insights
          </Button>

          {/* New Event - Primary CTA with depth */}
          <Button 
            size="sm" 
            onClick={() => { setEditingEvent(null); setDialogOpen(true); }}
            className="gap-1.5 bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_2px_4px_0_rgba(0,0,0,0.2)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_3px_6px_0_rgba(0,0,0,0.25)] transition-shadow"
          >
            <Plus className="h-4 w-4" />
            New Event
          </Button>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* User Account */}
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day Headers */}
          <div className="flex border-b border-border">
            <div className="w-16 flex-shrink-0 border-r border-border" />
            {days.map((day) => {
              const isToday = isSameDay(day, new Date())
              const status = getDayStatus(day)
              return (
                <div 
                  key={day.toString()} 
                  className={cn(
                    "flex-1 py-3 text-center border-r last:border-r-0 border-border/30",
                    isToday && "bg-primary/5 shadow-[inset_0_-2px_0_0_hsl(var(--primary))]" // Depth indicator for today
                  )}
                >
                  <div className="text-xs uppercase text-muted-foreground">{format(day, "EEE")}</div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isToday && "text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                  {status === "burnout" && (
                    <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mt-1" title="High energy day" />
                  )}
                  {status === "heavy" && (
                    <div className="w-2 h-2 rounded-full bg-orange-500 mx-auto mt-1" title="Heavy day" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Time Grid */}
          <div className="flex-1 flex overflow-auto">
            {/* Time Labels */}
            <div className="w-16 flex-shrink-0 border-r border-border">
              {hours.map((hour) => (
                <div key={hour} className="h-14 text-xs text-muted-foreground text-right pr-2 pt-1">
                  {format(new Date().setHours(hour, 0), "HH:mm")}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex-1 grid grid-cols-7">
              {days.map((day) => (
                <div key={day.toString()} className="border-r last:border-r-0 border-border relative">
                  {/* Hour lines */}
                  {hours.map((hour) => (
                    <div key={hour} className="h-14 border-b border-border/30" />
                  ))}

                  {/* Events */}
                  {events
                    .filter(e => isSameDay(new Date(e.start), day))
                    .map(event => {
                      const startDate = new Date(event.start)
                      const endDate = new Date(event.end)
                      const startHour = startDate.getHours() + startDate.getMinutes() / 60
                      const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
                      
                      return (
                        <div
                          key={event.id}
                          className={cn(
                            "absolute inset-x-1 text-white text-xs p-2 rounded-lg cursor-pointer transition-all",
                            "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_2px_4px_0_rgba(0,0,0,0.2)]", // Depth: top highlight + bottom shadow
                            "hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_4px_8px_0_rgba(0,0,0,0.3)] hover:scale-[1.02]",
                            getEventColor(event.type)
                          )}
                          style={{
                            top: `${startHour * 3.5}rem`,
                            height: `${Math.max(duration * 3.5, 1.5)}rem`,
                          }}
                          onClick={() => {
                            setEditingEvent(event)
                            setDialogOpen(true)
                          }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {duration >= 0.75 && (
                            <div className="text-white/80 text-[10px]">
                              {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Panel - Elevated side panel with depth */}
        {showInsights && (
          <div className="w-80 border-l border-border/50 bg-card shadow-[inset_1px_0_0_0_rgba(255,255,255,0.03),-4px_0_12px_0_rgba(0,0,0,0.1)] dark:shadow-[inset_1px_0_0_0_rgba(255,255,255,0.02),-4px_0_16px_0_rgba(0,0,0,0.3)] overflow-y-auto">
            <InsightsPanel 
              data={insights} 
              loading={loading}
              isFreeTier={isFreeTier}
              onReschedule={async (eventId, toDay) => {
                const event = events.find(e => e.id === eventId)
                if (!event) return

                const targetDate = new Date(toDay)
                const oldStart = new Date(event.start as string)
                const oldEnd = new Date(event.end as string)
                
                const newStart = new Date(targetDate)
                newStart.setHours(oldStart.getHours(), oldStart.getMinutes())
                
                const newEnd = new Date(targetDate)
                newEnd.setHours(oldEnd.getHours(), oldEnd.getMinutes())

                try {
                  const res = await fetch(`/api/events/${eventId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      start: newStart.toISOString(),
                      end: newEnd.toISOString(),
                    }),
                  })

                  if (res.ok) {
                    toast.success(`Rescheduled to ${format(targetDate, 'EEEE')}`)
                    await fetchEvents()
                    await fetchInsights()
                  } else {
                    toast.error("Failed to reschedule")
                  }
                } catch (error) {
                  console.error("Reschedule failed", error)
                  toast.error("Reschedule failed")
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Event Dialog */}
      <EventDialog 
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingEvent(null)
        }}
        // @ts-ignore
        onCreate={handleCreateEvent} 
        // @ts-ignore
        onUpdate={handleUpdateEvent}
        onDelete={() => handleDeleteEvent(editingEvent?.id)}
        existingEvents={events.map(e => ({ id: e.id, title: e.title }))}
        // @ts-ignore
        event={editingEvent ? {
          ...editingEvent,
          date: new Date(editingEvent.start).toISOString().split('T')[0],
          start: format(new Date(editingEvent.start), 'HH:mm'),
          end: format(new Date(editingEvent.end), 'HH:mm'),
        } : null}
      />
      
      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog}
        feature={upgradeFeature}
      />
    </div>
  )
}
