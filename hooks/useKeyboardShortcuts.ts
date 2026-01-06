"use client"

import { useEffect, useCallback } from "react"

interface KeyboardShortcutsConfig {
    onNewEvent: () => void
    onToday: () => void
    onNextWeek: () => void
    onPrevWeek: () => void
    onEscape: () => void
    enabled?: boolean
}

/**
 * Custom hook for handling keyboard shortcuts in the calendar
 * 
 * Shortcuts:
 * - N: New event
 * - T: Go to today
 * - → (ArrowRight): Next week
 * - ← (ArrowLeft): Previous week
 * - Escape: Close dialogs
 */
export function useKeyboardShortcuts({
    onNewEvent,
    onToday,
    onNextWeek,
    onPrevWeek,
    onEscape,
    enabled = true,
}: KeyboardShortcutsConfig) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return

            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                // Only allow Escape to work in inputs
                if (event.key === "Escape") {
                    onEscape()
                }
                return
            }

            // Handle keyboard shortcuts
            switch (event.key) {
                case "n":
                case "N":
                    event.preventDefault()
                    onNewEvent()
                    break

                case "t":
                case "T":
                    event.preventDefault()
                    onToday()
                    break

                case "ArrowRight":
                    // Only if not holding any modifier keys
                    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
                        event.preventDefault()
                        onNextWeek()
                    }
                    break

                case "ArrowLeft":
                    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
                        event.preventDefault()
                        onPrevWeek()
                    }
                    break

                case "Escape":
                    event.preventDefault()
                    onEscape()
                    break
            }
        },
        [enabled, onNewEvent, onToday, onNextWeek, onPrevWeek, onEscape]
    )

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])
}

// Optional: Display keyboard shortcuts hint
export const KEYBOARD_SHORTCUTS = [
    { key: "N", description: "New event" },
    { key: "T", description: "Go to today" },
    { key: "←", description: "Previous week" },
    { key: "→", description: "Next week" },
    { key: "Esc", description: "Close dialogs" },
] as const
