"use client"

import { useCallback, useRef } from "react"
import { toast } from "sonner"

interface UndoableEvent {
    id: string
    title: string
    description?: string | null
    start: string | Date
    end: string | Date
    allDay: boolean
    type: string
    energyCost: number
    cognitiveLoad: number
    importance: number
    flexibility: number
    contextTag?: string | null
    causedById?: string | null
    notes?: string | null
}

interface UseUndoableActionOptions {
    onRefresh: () => Promise<void>
}

/**
 * Hook for managing undoable event actions (delete, move)
 * Shows a toast with an undo button that can restore the action
 */
export function useUndoableAction({ onRefresh }: UseUndoableActionOptions) {
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    /**
     * Delete an event with undo capability
     */
    const deleteWithUndo = useCallback(
        async (event: UndoableEvent) => {
            // Optimistically delete from server
            const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" })

            if (!res.ok) {
                toast.error("Failed to delete event")
                return
            }

            // Store the deleted event data for potential undo
            const deletedEvent = { ...event }

            // Show toast with undo button
            toast.success(`"${event.title}" deleted`, {
                description: "Click undo to restore",
                duration: 5000,
                action: {
                    label: "Undo",
                    onClick: async () => {
                        // Cancel any pending timeout
                        if (undoTimeoutRef.current) {
                            clearTimeout(undoTimeoutRef.current)
                        }

                        try {
                            // Recreate the event
                            const restoreRes = await fetch("/api/events", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    title: deletedEvent.title,
                                    description: deletedEvent.description,
                                    start: new Date(deletedEvent.start).toISOString(),
                                    end: new Date(deletedEvent.end).toISOString(),
                                    allDay: deletedEvent.allDay,
                                    type: deletedEvent.type,
                                    energyCost: deletedEvent.energyCost,
                                    cognitiveLoad: deletedEvent.cognitiveLoad,
                                    importance: deletedEvent.importance,
                                    flexibility: deletedEvent.flexibility,
                                    contextTag: deletedEvent.contextTag,
                                    causedById: deletedEvent.causedById,
                                    notes: deletedEvent.notes,
                                }),
                            })

                            if (restoreRes.ok) {
                                toast.success("Event restored")
                                await onRefresh()
                            } else {
                                toast.error("Failed to restore event")
                            }
                        } catch {
                            toast.error("Failed to restore event")
                        }
                    },
                },
            })

            await onRefresh()
        },
        [onRefresh]
    )

    /**
     * Move an event with undo capability
     */
    const moveWithUndo = useCallback(
        async (
            event: UndoableEvent,
            newStart: Date,
            newEnd: Date,
            originalStart: Date,
            originalEnd: Date
        ) => {
            // Perform the move
            const res = await fetch(`/api/events/${event.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    start: newStart.toISOString(),
                    end: newEnd.toISOString(),
                }),
            })

            if (!res.ok) {
                toast.error("Failed to move event")
                await onRefresh()
                return
            }

            // Format times for display
            const formatTime = (date: Date) =>
                date.toLocaleTimeString("en", {
                    weekday: "short",
                    hour: "numeric",
                    minute: "2-digit"
                })

            // Show toast with undo button
            toast.success(`Moved to ${formatTime(newStart)}`, {
                description: `"${event.title}"`,
                duration: 5000,
                action: {
                    label: "Undo",
                    onClick: async () => {
                        try {
                            // Restore original position
                            const undoRes = await fetch(`/api/events/${event.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    start: originalStart.toISOString(),
                                    end: originalEnd.toISOString(),
                                }),
                            })

                            if (undoRes.ok) {
                                toast.success("Move undone")
                                await onRefresh()
                            } else {
                                toast.error("Failed to undo move")
                            }
                        } catch {
                            toast.error("Failed to undo move")
                        }
                    },
                },
            })
        },
        [onRefresh]
    )

    return {
        deleteWithUndo,
        moveWithUndo,
    }
}
