"use client"

import * as React from "react"
import { addDays, format, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Zap, Plus, PanelRightOpen, PanelRightClose, Sparkles, Sun, Moon, Settings } from "lucide-react"
import { EventDialog } from "@/components/EventDialog"
import { InsightsPanel } from "@/components/InsightsPanel"
import { TimezoneOnboarding } from "@/components/TimezoneOnboarding"
import { OnboardingTour } from "@/components/OnboardingTour"
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp"
import { QuickAddInput } from "@/components/QuickAddInput"
import { UserButton } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useUndoableAction } from "@/hooks/useUndoableAction"
import { useEventNotifications } from "@/hooks/useEventNotifications"
import Link from "next/link"

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
  useSensors,
  useSensor,
  MouseSensor,
  TouchSensor,
  PointerSensor,
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
  source: "MANUAL"
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

// --- Event Card Component (used for both draggable and overlay) ---
function EventCard({ event, getEventColor, isDragging = false, isOverlay = false }: {
  event: Event,
  getEventColor: (t: string) => string,
  isDragging?: boolean,
  isOverlay?: boolean
}) {
  const startDate = new Date(event.start)
  const endDate = new Date(event.end)
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

  return (
    <div
      className={cn(
        "text-white text-xs p-2 rounded-lg transition-all duration-200",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_2px_4px_0_rgba(0,0,0,0.2)]",
        getEventColor(event.type),
        !isOverlay && "cursor-grab active:cursor-grabbing hover:scale-[1.02] hover:shadow-lg",
        isOverlay && "scale-105 shadow-2xl ring-2 ring-primary/50 rotate-1",
        isDragging && "opacity-40"
      )}
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

// --- DnD Components ---
function DraggableEvent({ event, onClick, getEventColor, isDragging }: {
  event: Event,
  onClick: () => void,
  getEventColor: (t: string) => string,
  isDragging: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event }
  })

  const startDate = new Date(event.start)
  const endDate = new Date(event.end)
  const startHour = startDate.getHours() + startDate.getMinutes() / 60
  const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${startHour * 3.5}rem`,
    height: `${Math.max(duration * 3.5, 1.5)}rem`,
    left: '0.25rem',
    right: '0.25rem',
    zIndex: isDragging ? 5 : 10,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isDragging ? 'none' : 'transform 150ms ease',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <EventCard event={event} getEventColor={getEventColor} isDragging={isDragging} />
    </div>
  )
}

function DroppableDay({ day, children, className, isOver }: {
  day: Date,
  children: React.ReactNode,
  className?: string,
  isOver?: boolean
}) {
  const { setNodeRef, isOver: dropIsOver } = useDroppable({
    id: format(day, "yyyy-MM-dd"),
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        "transition-colors duration-200",
        (isOver || dropIsOver) && "bg-primary/5"
      )}
    >
      {children}
    </div>
  )
}

// --- Clickable Time Slot ---
function TimeSlot({ hour, onClick }: { hour: number, onClick: () => void }) {
  return (
    <div
      className="h-14 border-b border-border/30 hover:bg-primary/5 transition-colors duration-150 cursor-pointer group"
      onClick={onClick}
    >
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-muted-foreground pl-1 pt-0.5">
        + Add event
      </div>
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
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [newEventDefaults, setNewEventDefaults] = React.useState<{ date: string; start: string } | null>(null)

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Improved sensors for smoother drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Slightly lower for more responsive feel
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
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

  // Refresh function for undoable actions
  const refreshAll = React.useCallback(async () => {
    await Promise.all([fetchEvents(), fetchInsights()])
  }, [fetchEvents, fetchInsights])

  // Undoable actions hook
  const { deleteWithUndo, moveWithUndo } = useUndoableAction({ onRefresh: refreshAll })

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewEvent: () => {
      setEditingEvent(null)
      setNewEventDefaults(null)
      setDialogOpen(true)
    },
    onToday: today,
    onNextWeek: nextWeek,
    onPrevWeek: prevWeek,
    onEscape: () => {
      if (dialogOpen) {
        setDialogOpen(false)
        setEditingEvent(null)
        setNewEventDefaults(null)
      }
    },
    enabled: !activeId, // Disable during drag
  })

  // Event notifications
  useEventNotifications({
    events,
    enabled: true,
    notifyBefore: 15,
  })

  const handleOptimize = async () => {
    setOptimizing(true)
    try {
      const res = await fetch("/api/optimize/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekStart.toISOString() })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.changes && data.changes.length > 0) {
          toast.success("Schedule optimized!", {
            description: data.explanation
          })
        } else {
          toast.info("No changes made", {
            description: data.explanation || "Your schedule is already balanced."
          })
        }
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
      let endDate = new Date(`${formData.date}T${formData.end}`)

      // Handle overnight events
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1)
      }

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
        setNewEventDefaults(null)
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
      let endDate = new Date(`${formData.date}T${formData.end}`)

      // Handle overnight events (if end time is before start time, it means next day)
      if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1)
      }

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
    const eventToDelete = events.find(e => e.id === id)
    if (!id || !eventToDelete) return

    setDialogOpen(false)
    setEditingEvent(null)

    // Use undoable delete
    await deleteWithUndo(eventToDelete)
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

  // --- Drag Handlers ---
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over, delta } = event
    setActiveId(null)

    if (!over) return

    const eventId = active.id as string
    const dbEvent = events.find(e => e.id === eventId)
    if (!dbEvent) return

    const targetDateStr = over.id as string

    // Calculate new time - 3.5rem = 56px per hour
    const pixelsPerHour = 56
    const hoursMoved = delta.y / pixelsPerHour
    const snappedHoursMoved = Math.round(hoursMoved * 4) / 4 // Snap to 15 mins

    const oldStart = new Date(dbEvent.start)
    const oldEnd = new Date(dbEvent.end)
    const durationMs = oldEnd.getTime() - oldStart.getTime()

    const newStart = new Date(targetDateStr)
    const originalHours = oldStart.getHours() + oldStart.getMinutes() / 60
    let newStartHour = originalHours + snappedHoursMoved
    newStartHour = Math.max(0, Math.min(23.75, newStartHour))

    newStart.setHours(Math.floor(newStartHour))
    newStart.setMinutes((newStartHour % 1) * 60)
    newStart.setSeconds(0)
    newStart.setMilliseconds(0)

    const newEnd = new Date(newStart.getTime() + durationMs)

    // Optimistic update for smooth UX
    setEvents(prev => prev.map(e =>
      e.id === eventId
        ? { ...e, start: newStart.toISOString(), end: newEnd.toISOString() }
        : e
    ))

    // Use undoable move
    await moveWithUndo(dbEvent, newStart, newEnd, oldStart, oldEnd)
    await fetchInsights()
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  // Click on time slot to create event
  const handleTimeSlotClick = (day: Date, hour: number) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const startTime = `${hour.toString().padStart(2, '0')}:00`
    setNewEventDefaults({ date: dateStr, start: startTime })
    setEditingEvent(null)
    setDialogOpen(true)
  }

  // Get the active event for the drag overlay
  const activeEvent = activeId ? events.find(e => e.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <TimezoneOnboarding />
      <OnboardingTour />
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
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={handleOptimize} disabled={optimizing} className="hidden sm:flex">
              <Sparkles className="h-4 w-4 mr-1.5" />
              {optimizing ? "Optimizing..." : "AI Optimize"}
            </Button>
            <Button variant="outline" size="icon" onClick={handleOptimize} disabled={optimizing} className="sm:hidden">
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button variant={showInsights ? "secondary" : "outline"} size="sm" onClick={() => setShowInsights(!showInsights)} className="hidden sm:flex">
              {showInsights ? <PanelRightClose className="h-4 w-4 mr-1.5" /> : <PanelRightOpen className="h-4 w-4 mr-1.5" />}
              Insights
            </Button>
            <Button variant={showInsights ? "secondary" : "outline"} size="icon" onClick={() => setShowInsights(!showInsights)} className="sm:hidden">
              {showInsights ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
            <QuickAddInput
              onCreateEvent={async (parsedEvent) => {
                try {
                  const res = await fetch("/api/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title: parsedEvent.title,
                      description: parsedEvent.description,
                      start: new Date(parsedEvent.start).toISOString(),
                      end: new Date(parsedEvent.end).toISOString(),
                      allDay: parsedEvent.allDay,
                      type: parsedEvent.type,
                      energyCost: parsedEvent.energyCost,
                      flexibility: parsedEvent.flexibility,
                      location: parsedEvent.location,
                    }),
                  })
                  if (res.ok) {
                    toast.success("Event created via Quick Add")
                    await fetchEvents()
                    await fetchInsights()
                  }
                } catch (error) {
                  toast.error("Failed to create event")
                }
              }}
            />
            <Button size="sm" onClick={() => { setEditingEvent(null); setNewEventDefaults(null); setDialogOpen(true); }} className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-1.5" /> New Event
            </Button>
            <Button size="icon" onClick={() => { setEditingEvent(null); setNewEventDefaults(null); setDialogOpen(true); }} className="sm:hidden">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Sun className="h-4 w-4" />}
            </Button>
            <KeyboardShortcutsHelp />
            <Link href="/settings">
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
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
                      <TimeSlot
                        key={hour}
                        hour={hour}
                        onClick={() => handleTimeSlotClick(day, hour)}
                      />
                    ))}
                    {events
                      .filter(e => isSameDay(new Date(e.start), day))
                      .map(event => (
                        <DraggableEvent
                          key={event.id}
                          event={event}
                          isDragging={event.id === activeId}
                          onClick={() => {
                            setEditingEvent(event)
                            setNewEventDefaults(null)
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
              <InsightsPanel
                data={insights}
                loading={loading}
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

        {/* Drag Overlay - This creates the smooth floating preview */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeEvent ? (
            <div className="w-[calc((100vw-4rem-20rem)/7-0.5rem)] min-w-32">
              <EventCard event={activeEvent} getEventColor={getEventColor} isOverlay />
            </div>
          ) : null}
        </DragOverlay>

        <EventDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditingEvent(null)
              setNewEventDefaults(null)
            }
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
          } : newEventDefaults ? {
            date: newEventDefaults.date,
            start: newEventDefaults.start,
            end: `${(parseInt(newEventDefaults.start.split(':')[0]) + 1).toString().padStart(2, '0')}:00`,
          } : null}
        />
      </div>
    </DndContext>
  )
}
