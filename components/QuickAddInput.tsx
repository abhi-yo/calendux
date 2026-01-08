"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Sparkles, Plus, Loader2, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface ParsedEvent {
    title: string
    description: string | null
    start: string
    end: string
    allDay: boolean
    location: string | null
    type: "TASK" | "EVENT" | "MEETING" | "HABIT" | "FOCUS"
    flexibility: number
    energyCost: number
    participants: string[]
}

interface ParseResult {
    success: boolean
    event: ParsedEvent | null
    error?: string
    rawInput: string
}

interface QuickAddInputProps {
    onCreateEvent: (event: ParsedEvent) => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function QuickAddInput({ onCreateEvent, open: controlledOpen, onOpenChange }: QuickAddInputProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen ?? internalOpen
    const setOpen = onOpenChange ?? setInternalOpen

    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<ParsedEvent | null>(null)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    // Focus input when opened
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus()
        }
    }, [open])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open with "/" or Cmd+K
            if ((e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) && !open) {
                const target = e.target as HTMLElement
                if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
                    e.preventDefault()
                    setOpen(true)
                }
            }
            // Close with Escape
            if (e.key === "Escape" && open) {
                e.preventDefault()
                handleClose()
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [open, setOpen])

    // Parse input with debounce
    useEffect(() => {
        if (!input.trim()) {
            setPreview(null)
            setError(null)
            return
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            setError(null)

            try {
                const res = await fetch("/api/events/parse", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        input,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    })
                })

                const data: ParseResult = await res.json()

                if (data.success && data.event) {
                    setPreview(data.event)
                    setError(null)
                } else {
                    setPreview(null)
                    setError(data.error || "Could not parse input")
                }
            } catch {
                setError("Failed to parse")
            } finally {
                setLoading(false)
            }
        }, 500) // 500ms debounce

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [input])

    const handleClose = () => {
        setOpen(false)
        setInput("")
        setPreview(null)
        setError(null)
    }

    const handleCreate = () => {
        if (preview) {
            onCreateEvent(preview)
            handleClose()
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (preview) {
            handleCreate()
        }
    }

    const getTypeColor = (type: string) => {
        switch (type) {
            case "MEETING": return "bg-blue-500/20 text-blue-400"
            case "FOCUS": return "bg-purple-500/20 text-purple-400"
            case "HABIT": return "bg-green-500/20 text-green-400"
            case "TASK": return "bg-orange-500/20 text-orange-400"
            default: return "bg-gray-500/20 text-gray-400"
        }
    }

    if (!open) {
        return (
            <Button
                onClick={() => setOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2 bg-background/80 backdrop-blur-sm border-dashed hover:border-solid hover:bg-primary/5"
            >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Quick Add</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    /
                </kbd>
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-xl mx-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    {/* Input */}
                    <div className="flex items-center gap-3 p-4 border-b border-border">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Meeting with Sarah tomorrow at 2pm..."
                            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
                            autoComplete="off"
                        />
                        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="h-8 w-8 shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Preview */}
                    {preview && (
                        <div className="p-4 space-y-3 bg-muted/30">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1 min-w-0">
                                    <h3 className="font-semibold text-lg truncate">{preview.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>
                                            {format(new Date(preview.start), "EEE, MMM d")}
                                        </span>
                                        {!preview.allDay && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    {format(new Date(preview.start), "h:mm a")} - {format(new Date(preview.end), "h:mm a")}
                                                </span>
                                            </>
                                        )}
                                        {preview.allDay && <span className="text-xs">(All day)</span>}
                                    </div>
                                </div>
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium shrink-0",
                                    getTypeColor(preview.type)
                                )}>
                                    {preview.type}
                                </span>
                            </div>

                            {/* Participants */}
                            {preview.participants.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">With:</span>
                                    <div className="flex gap-1.5">
                                        {preview.participants.map((p, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-primary/10 rounded-full text-xs">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Meta */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Energy: {preview.energyCost}/5</span>
                                <span>Flexibility: {preview.flexibility}/5</span>
                                {preview.location && <span>📍 {preview.location}</span>}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && input && (
                        <div className="p-4 text-sm text-muted-foreground">
                            <span className="text-orange-500">⚠️</span> {error}. Try being more specific.
                        </div>
                    )}

                    {/* Hints */}
                    {!input && (
                        <div className="p-4 space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">Try something like:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "Coffee with Sarah tomorrow at 2pm",
                                    "Focus time on Friday morning",
                                    "Team standup every day 9:30am",
                                    "Gym workout this evening",
                                ].map((example, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setInput(example)}
                                        className="px-2.5 py-1 text-xs bg-muted rounded-full hover:bg-muted/80 transition-colors"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 p-3 border-t border-border bg-muted/20">
                        <div className="text-xs text-muted-foreground">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to create
                            <span className="mx-2">•</span>
                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> to close
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={!preview || loading}
                            className="gap-2"
                        >
                            <Check className="h-4 w-4" />
                            Create Event
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
