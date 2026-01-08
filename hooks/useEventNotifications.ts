"use client"

import { useEffect, useRef, useCallback } from "react"

interface Event {
    id: string
    title: string
    start: string | Date
    description?: string | null
}

interface UseEventNotificationsOptions {
    events: Event[]
    enabled?: boolean
    notifyBefore?: number // minutes
}

/**
 * Hook to show browser notifications before events start
 */
export function useEventNotifications({
    events,
    enabled = true,
    notifyBefore = 15,
}: UseEventNotificationsOptions) {
    const notifiedRef = useRef<Set<string>>(new Set())
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const showNotification = useCallback((event: Event) => {
        if (!("Notification" in window)) return
        if (Notification.permission !== "granted") return

        const notification = new Notification(`⏰ ${event.title}`, {
            body: `Starting in ${notifyBefore} minutes`,
            icon: "/favicon.ico",
            tag: event.id,
            requireInteraction: true,
        })

        notification.onclick = () => {
            window.focus()
            notification.close()
        }

        // Auto close after 30 seconds
        setTimeout(() => notification.close(), 30000)
    }, [notifyBefore])

    const checkEvents = useCallback(() => {
        if (!enabled) return
        if (!("Notification" in window)) return
        if (Notification.permission !== "granted") return

        const now = new Date()
        const notifyWindow = notifyBefore * 60 * 1000 // Convert to ms

        events.forEach(event => {
            const eventStart = new Date(event.start)
            const timeUntilEvent = eventStart.getTime() - now.getTime()

            // Check if event is within notification window and hasn't been notified
            if (
                timeUntilEvent > 0 &&
                timeUntilEvent <= notifyWindow &&
                !notifiedRef.current.has(event.id)
            ) {
                showNotification(event)
                notifiedRef.current.add(event.id)
            }
        })

        // Clean up old notifications (events that have passed)
        notifiedRef.current.forEach(id => {
            const event = events.find(e => e.id === id)
            if (event) {
                const eventStart = new Date(event.start)
                if (eventStart.getTime() < now.getTime()) {
                    notifiedRef.current.delete(id)
                }
            }
        })
    }, [events, enabled, notifyBefore, showNotification])

    useEffect(() => {
        // Check immediately
        checkEvents()

        // Then check every minute
        intervalRef.current = setInterval(checkEvents, 60000)

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [checkEvents])

    return {
        isSupported: typeof window !== "undefined" && "Notification" in window,
        permission: typeof window !== "undefined" && "Notification" in window
            ? Notification.permission
            : "denied",
    }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
        return "denied"
    }

    if (Notification.permission === "granted") {
        return Notification.permission
    }

    return await Notification.requestPermission()
}

/**
 * Send a test notification
 */
export function sendTestNotification() {
    if (!("Notification" in window)) return false
    if (Notification.permission !== "granted") return false

    new Notification("🎉 Calendux Notifications Active!", {
        body: "You'll receive reminders before your events.",
        icon: "/favicon.ico",
    })

    return true
}
