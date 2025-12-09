"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Plus, Zap, Clock, Shuffle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const EVENT_TYPES = [
  { value: "MEETING", label: "Meeting" },
  { value: "TASK", label: "Task" },
  { value: "HABIT", label: "Habit" },
  { value: "FOCUS", label: "Focus" },
  { value: "BREAK", label: "Break" },
  { value: "PERSONAL", label: "Personal" },
]

// Generate time options (every 15 minutes)
const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4)
  const minutes = (i % 4) * 15
  const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  const label = format(new Date().setHours(hours, minutes), 'h:mm a')
  return { value, label }
})

interface EventFormData {
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
}

export interface EventDialogProps {
  onCreate: (event: EventFormData) => void
  onUpdate?: (event: EventFormData) => void
  onDelete?: () => void
  existingEvents?: { id: string; title: string }[]
  trigger?: React.ReactNode
  event?: EventFormData | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EventDialog({ 
  onCreate, 
  onUpdate, 
  onDelete, 
  existingEvents = [], 
  trigger, 
  event,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: EventDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [formData, setFormData] = React.useState<EventFormData>({
    title: "",
    description: "",
    start: "09:00",
    end: "10:00",
    date: new Date().toISOString().split('T')[0],
    type: "TASK",
    energyCost: 3,
    importance: 3,
    flexibility: 3,
    causedById: "",
    notes: "",
  })

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())

  React.useEffect(() => {
    if (event) {
      setFormData(event)
      setSelectedDate(new Date(event.date))
    } else if (!open) {
      setFormData({
        title: "",
        description: "",
        start: "09:00",
        end: "10:00",
        date: new Date().toISOString().split('T')[0],
        type: "TASK",
        energyCost: 3,
        importance: 3,
        flexibility: 3,
        causedById: "",
        notes: "",
      })
      setSelectedDate(new Date())
    }
  }, [event, open])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      updateField("date", format(date, "yyyy-MM-dd"))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (event && onUpdate) {
      onUpdate(formData)
    } else {
      onCreate(formData)
    }
    setOpen(false)
  }

  const updateField = (field: keyof EventFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{event ? "Edit Event" : "Create Event"}</DialogTitle>
            <DialogDescription>
              {event ? "Modify event details." : "Add a new event with energy and causality tracking."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Event title"
                required
              />
            </div>

            {/* Date & Time - Using shadcn components */}
            <div className="grid grid-cols-3 gap-2">
              {/* Date Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "MMM d") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Start Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Start</label>
                <Select value={formData.start} onValueChange={(v) => updateField("start", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium">End</label>
                <Select value={formData.end} onValueChange={(v) => updateField("end", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {TIME_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField("type", type.value)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-all",
                      "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]",
                      formData.type === type.value 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : "bg-background border-border hover:bg-muted"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Cost */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Energy Cost
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateField("energyCost", level)}
                    className={cn(
                      "flex-1 py-2 text-sm rounded border transition-all",
                      "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]",
                      formData.energyCost === level 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    {level === 1 ? "Low" : level === 5 ? "High" : level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                How much mental energy does this drain?
              </p>
            </div>

            {/* Importance */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Importance
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateField("importance", level)}
                    className={cn(
                      "flex-1 py-2 text-sm rounded border transition-all",
                      "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]",
                      formData.importance === level 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    {level === 1 ? "Low" : level === 5 ? "Critical" : level}
                  </button>
                ))}
              </div>
            </div>

            {/* Flexibility */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-blue-500" />
                Flexibility
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateField("flexibility", level)}
                    className={cn(
                      "flex-1 py-2 text-sm rounded border transition-all",
                      "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_1px_2px_0_rgba(0,0,0,0.1)]",
                      formData.flexibility === level 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    {level === 1 ? "Fixed" : level === 5 ? "Flex" : level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Can this be rescheduled? Higher = more flexible.
              </p>
            </div>

            {/* Caused By (Causal Link) */}
            {existingEvents.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  Caused By (Optional)
                </label>
                <Select 
                  value={formData.causedById || "none"} 
                  onValueChange={(v) => updateField("causedById", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No causal link" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No causal link</SelectItem>
                    {existingEvents.map(evt => (
                      // @ts-ignore
                      (event?.id && evt.id === event.id) ? null :
                      <SelectItem key={evt.id} value={evt.id}>
                        {evt.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link this event to another that caused it.
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Additional context..."
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm min-h-[60px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {event && onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => {
                  if (confirm("Delete this event?")) {
                    onDelete()
                    setOpen(false)
                  }
                }}
                className="mr-auto"
              >
                Delete
              </Button>
            )}
            <Button type="submit">{event ? "Save Changes" : "Create Event"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
