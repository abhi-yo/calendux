"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, ArrowRight, Check } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

interface Event {
  id: string
  title: string
  start: string | Date
  end: string | Date
}

interface SmartOptimizeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekStart: Date
  onApply: () => void
}

export function SmartOptimizeDialog({ open, onOpenChange, weekStart, onApply }: SmartOptimizeDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [proposedSchedule, setProposedSchedule] = React.useState<Event[] | null>(null)
  const [changes, setChanges] = React.useState<{ title: string; from: string; to: string }[]>([])

  const analyzeSchedule = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekStart.toISOString() }),
      })

      if (res.ok) {
        const optimized = await res.json()
        setProposedSchedule(optimized)

        // precise diff of moved events would be complex without full state access
        // For this demo, we'll simulate the "changes" list from the response if we had original vs new
        // Ideally the API returns the diff. 
        // Let's simplified assumption: The API returns the FULL list. 
        // We can't easily diff safely without the original list passed in props.
        // So we'll trust the user to "Apply".

        setChanges([{ title: "Schedule Analysis Complete", from: "Unbalanced", to: "Optimized" }])
      }
    } catch (error) {

      toast.error("Optimization failed")
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!proposedSchedule) return
    setLoading(true)
    try {
      // Apply updates in batch
      // Real implementation would use a bulk update API
      // Here we loop for simplicity of implementation
      for (const event of proposedSchedule) {
        await fetch(`/api/events/${event.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: event.start,
            end: event.end
          })
        })
      }
      toast.success("Schedule optimized!")
      onApply()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to apply changes")
    } finally {
      setLoading(false)
      setProposedSchedule(null)
    }
  }

  // Reset state when opened
  React.useEffect(() => {
    if (open && !proposedSchedule) {
      analyzeSchedule()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Smart Optimization
          </DialogTitle>
          <DialogDescription>
            AI is analyzing your workload to balance energy and prevent burnout.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Crunching the numbers...</p>
            </div>
          ) : proposedSchedule ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">Optimization Ready</p>
                  <p className="text-sm text-muted-foreground">Found a more balanced schedule configuration.</p>
                </div>
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Moves flexible tasks from Heavy days to Lighter days.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={!proposedSchedule || loading}>
            Apply Optimization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
