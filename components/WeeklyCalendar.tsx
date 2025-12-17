"use client"

import * as React from "react"
import { addDays, format, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Zap, Plus, PanelRightOpen, PanelRightClose, Sparkles, Sun, Moon } from "lucide-react"
import { EventDialog } from "@/components/EventDialog"
import { InsightsPanel } from "@/components/InsightsPanel"
import { UserButton } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { UpgradeDialog } from "./UpgradeDialog"
import { 
  DndContext, 
  DragEndEvent, 
  useDraggable, 
  useDroppable, 
  useSensors, 
  useSensor, 
  MouseSensor, 
  TouchSensor 
} from "@dnd-kit/core"

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
  notes?: string | null
}

type InsightsData = {
  insights: { type: "warning" | "suggestion" | "info"; title: string; description: string; suggestedAction?: string }[]
  dailyLoads: { date: string; totalEnergy: number; status: "light" | "moderate" | "heavy" | "burnout"; eventCount: number }[]
  suggestions: { eventId: string; eventTitle: string; fromDay: string; toDay: string; reason: string }[]
  summary: { totalEnergy: number; burnoutRisk: boolean; heavyDays: number; eventCount: number }
}

// --- DnD Components ---

function DraggableEvent({ event, onClick, getEventColor }: { event: Event, onClick: () => void, getEventColor: (t: string) => string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event }
  })

  const startDate = new Date(event.start)
  const endDate = new Date(event.end)
  const startHour = startDate.getHours() + startDate.getMinutes() / 60
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

  // Use CSS translate for performance during drag
  // During drag, we don't change 'top', we just apply transform
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${startHour * 3.5}rem`,
    height: `${Math.max(duration * 3.5, 1.5)}rem`,
    left: '0.25rem',
    right: '0.25rem',
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.8 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "text-white text-xs p-2 rounded-lg cursor-grab active:cursor-grabbing transition-shadow",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_2px_4px_0_rgba(0,0,0,0.2)]",
        getEventColor(event.type),
        isDragging && "shadow-2xl ring-2 ring-primary"
      )}
      onClick={onClick}
    >
      <div className="font-medium truncate">{event.title}</div>
      {duration >= 0.75 && (
        <div className="text-white/80 text-[10px]">
          {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
        </div>
      )}
    </div>
  )
}

function DroppableDay({ day, children, className }: { day: Date, children: React.ReactNode, className?: string }) {
  const { setNodeRef } = useDroppable({
    id: format(day, "yyyy-MM-dd"), // Use date string as ID
  })

  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  )
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
  const [mounted, setMounted] = React.useState(false)

  // Sensors for drag activation
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Drag needs 10px movement to start
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, 
        tolerance: 5,
      },
    })
  )

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const fetchEvents = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/events?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`, { cache: "no-store" })
      if (res.ok) {
        setEvents(await res.json())
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    }
  }, [weekStart.toISOString(), weekEnd.toISOString()])

  const fetchInsights = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/insights?weekStart=${weekStart.toISOString()}`, { cache: "no-store" })
      if (res.ok) {
        setInsights(await res.json())
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error)
    }
  }, [weekStart.toISOString()])

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

  const isFreeTier = true 

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

  const handleCreateEvent = async (formData: any) => {
    try {
      const startDate = new Date(`${formData.date}T${formData.start}`)
      const endDate = new Date(`${formData.date}T${formData.end}`)
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
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
    if (!editingEvent?.id) return
    try {
      const startDate = new Date(`${formData.date}T${formData.start}`)
      const endDate = new Date(`${formData.date}T${formData.end}`)
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }),
      })
      if (res.ok) {
        toast.success("Event updated")
        setDialogOpen(false)
        setEditingEvent(null)
        await fetchEvents()
        await fetchInsights()
      } else {
        toast.error("Failed to update")
      }
    } catch (error) {
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
      }
    } catch {
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

  // --- Drag End Handler ---
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event
    if (!over) return

    const eventId = active.id as string
    const dbEvent = events.find(e => e.id === eventId)
    if (!dbEvent) return

    const targetDateStr = over.id as string
    
    // Calculate new time
    // 3.5rem = 56px per hour
    const pixelsPerHour = 56
    const hoursMoved = delta.y / pixelsPerHour
    
    // Snap to 15 mins (0.25 hours)
    const snappedHoursMoved = Math.round(hoursMoved * 4) / 4

    const oldStart = new Date(dbEvent.start)
    const oldEnd = new Date(dbEvent.end)
    const durationMs = oldEnd.getTime() - oldStart.getTime()
    
    const newStart = new Date(targetDateStr)
    // Add original hours + delta
    const originalHours = oldStart.getHours() + oldStart.getMinutes() / 60
    let newStartHour = originalHours + snappedHoursMoved
    
    // Clamp to 0-23
    newStartHour = Math.max(0, Math.min(23.75, newStartHour))
    
    newStart.setHours(Math.floor(newStartHour))
    newStart.setMinutes((newStartHour % 1) * 60)
    
    const newEnd = new Date(newStart.getTime() + durationMs)

    // Optimistic UI update (optional, but skipping for simplicity)
    
    // API Call
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
        toast.success(`Moved to ${format(newStart, 'EEE HH:mm')}`)
        await fetchEvents()
        await fetchInsights()
      } else {
        toast.error("Failed to move event")
      }
    } catch {
      toast.error("Move failed")
    }
  }


  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/50 shadow-sm">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={today}>Today</Button>
            <h1 className="text-lg font-semibold ml-2">{format(weekStart, "MMMM yyyy")}</h1>
            {insights?.summary.burnoutRisk && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full flex items-center gap-1">
                <Zap className="h-3 w-3" /> Burnout Risk
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOptimize} disabled={optimizing}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {optimizing ? "Optimizing..." : "AI Optimize"}
            </Button>
            <Button variant={showInsights ? "secondary" : "outline"} size="sm" onClick={() => setShowInsights(!showInsights)}>
              {showInsights ? <PanelRightClose className="h-4 w-4 mr-1.5" /> : <PanelRightOpen className="h-4 w-4 mr-1.5" />}
              Insights
            </Button>
            <Button size="sm" onClick={() => { setEditingEvent(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> New Event
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Sun className="h-4 w-4" />}
            </Button>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Day Headers */}
            <div className="flex border-b border-border">
              <div className="w-16 flex-shrink-0 border-r border-border" />
              {days.map((day) => {
                const isToday = isSameDay(day, new Date())
                const status = getDayStatus(day)
                return (
                  <div key={day.toString()} className={cn("flex-1 py-3 text-center border-r last:border-r-0 border-border/30", isToday && "bg-primary/5")}>
                    <div className="text-xs uppercase text-muted-foreground">{format(day, "EEE")}</div>
                    <div className={cn("text-lg font-semibold", isToday && "text-primary")}>{format(day, "d")}</div>
                    {status === "burnout" && <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mt-1" />}
                    {status === "heavy" && <div className="w-2 h-2 rounded-full bg-orange-500 mx-auto mt-1" />}
                  </div>
                )
              })}
            </div>

            {/* Time Grid */}
            <div className="flex-1 flex overflow-auto">
              <div className="w-16 flex-shrink-0 border-r border-border">
                {hours.map((hour) => (
                  <div key={hour} className="h-14 text-xs text-muted-foreground text-right pr-2 pt-1">
                    {format(new Date().setHours(hour, 0), "HH:mm")}
                  </div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7">
                {days.map((day) => (
                  <DroppableDay key={day.toString()} day={day} className="border-r last:border-r-0 border-border relative">
                    {hours.map((hour) => (
                      <div key={hour} className="h-14 border-b border-border/30" />
                    ))}
                    {events
                      .filter(e => isSameDay(new Date(e.start), day))
                      .map(event => (
                        <DraggableEvent 
                          key={event.id} 
                          event={event} 
                          onClick={() => {
                            setEditingEvent(event)
                            setDialogOpen(true)
                          }}
                          getEventColor={getEventColor}
                        />
                      ))}
                  </DroppableDay>
                ))}
              </div>
            </div>
          </div>

          {showInsights && (
            <div className="w-80 border-l border-border/50 bg-card overflow-y-auto">
              {/* Reuse simple handler for insights panel reschedule since we have dnd now */}
              <InsightsPanel 
                data={insights} 
                loading={loading}
                isFreeTier={isFreeTier}
                onReschedule={async (eventId, toDay) => {
                   const event = events.find(e => e.id === eventId)
                   if (!event) return
                   const targetDate = new Date(toDay)
                   const newStart = new Date(event.start)
                   newStart.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
                   const newEnd = new Date(event.end)
                   newEnd.setFullYear(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
                   
                   await fetch(`/api/events/${eventId}`, {
                     method: "PUT",
                     headers: { "Content-Type": "application/json" },
                     body: JSON.stringify({ start: newStart.toISOString(), end: newEnd.toISOString() })
                   })
                   await fetchEvents()
                }}
              />
            </div>
          )}
        </div>

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
        
        <UpgradeDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog} feature={upgradeFeature} />
      </div>
    </DndContext>
  )
}
