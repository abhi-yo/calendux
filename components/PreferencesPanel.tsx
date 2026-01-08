"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Bell, Clock, Calendar, Moon, Sun, Save, Check, ExternalLink, RefreshCw, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface UserPreferences {
    workingHoursStart: string
    workingHoursEnd: string
    preferredFocusTime: string
    enableNotifications: boolean
    notifyBefore: number // minutes
    theme: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    preferredFocusTime: "morning",
    enableNotifications: true,
    notifyBefore: 15,
    theme: "system",
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
    value: `${i.toString().padStart(2, '0')}:00`,
    label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i < 12 ? 'AM' : 'PM'}`
}))

const NOTIFY_OPTIONS = [
    { value: 5, label: "5 minutes before" },
    { value: 10, label: "10 minutes before" },
    { value: 15, label: "15 minutes before" },
    { value: 30, label: "30 minutes before" },
    { value: 60, label: "1 hour before" },
]

/**
 * Google Calendar Sync Component
 */
function GoogleCalendarSync() {
    const [connected, setConnected] = useState<boolean | null>(null)
    const [syncing, setSyncing] = useState(false)
    const [lastSync, setLastSync] = useState<string | null>(null)
    const [isConfigured, setIsConfigured] = useState(true) // Assume configured until we know otherwise

    useEffect(() => {
        // Check connection status on mount
        checkConnection()
        // Get last sync time from localStorage
        const stored = localStorage.getItem("calendux_last_sync")
        if (stored) setLastSync(stored)

        // Check URL params for OAuth result
        const params = new URLSearchParams(window.location.search)
        if (params.get("success") === "google_connected") {
            toast.success("Google Calendar connected!")
            setConnected(true)
            // Clean URL
            window.history.replaceState({}, "", "/settings")
        }
        if (params.get("error")) {
            const error = params.get("error")
            if (error === "google_oauth_denied") {
                toast.error("Calendar access was denied")
            } else {
                toast.error("Failed to connect Google Calendar")
            }
            window.history.replaceState({}, "", "/settings")
        }
    }, [])

    const checkConnection = async () => {
        try {
            const res = await fetch("/api/sync")
            const data = await res.json()
            setConnected(data.connected)
        } catch {
            setConnected(false)
        }
    }

    const handleConnect = () => {
        // Redirect to our custom OAuth flow
        window.location.href = "/api/auth/google/calendar"
    }

    const handleSync = async () => {
        setSyncing(true)
        try {
            const res = await fetch("/api/sync", { method: "POST" })
            const data = await res.json()

            if (data.success) {
                toast.success(data.message || "Calendar synced!")
                const now = new Date().toLocaleString()
                setLastSync(now)
                localStorage.setItem("calendux_last_sync", now)
                setConnected(true)
            } else {
                toast.error(data.error || "Sync failed")

                // Check if OAuth is not configured
                if (data.error?.includes("not configured")) {
                    setIsConfigured(false)
                }

                if (data.error?.includes("not connected") || data.error?.includes("reconnect")) {
                    setConnected(false)
                }
            }
        } catch {
            toast.error("Failed to sync calendar")
        } finally {
            setSyncing(false)
        }
    }

    const handleDisconnect = async () => {
        try {
            const res = await fetch("/api/sync", { method: "DELETE" })
            if (res.ok) {
                toast.success("Google Calendar disconnected")
                setConnected(false)
                setLastSync(null)
                localStorage.removeItem("calendux_last_sync")
            }
        } catch {
            toast.error("Failed to disconnect")
        }
    }

    return (
        <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">Google Calendar</h3>
                </div>
                {connected !== null && (
                    <span className={cn(
                        "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                        connected ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
                    )}>
                        {connected ? (
                            <><CheckCircle className="h-3 w-3" /> Connected</>
                        ) : (
                            <><XCircle className="h-3 w-3" /> Not connected</>
                        )}
                    </span>
                )}
            </div>

            <p className="text-sm text-muted-foreground mb-4">
                {connected
                    ? "Your Google Calendar is connected. Sync events to keep them up to date."
                    : "Connect your Google Calendar to import and sync your events."
                }
            </p>

            {!isConfigured && (
                <div className="p-3 mb-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                        <strong>Google OAuth not configured.</strong> Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.
                    </p>
                </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
                {!connected ? (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={handleConnect}
                        className="bg-[#4285F4] hover:bg-[#3367D6] text-white"
                    >
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Connect Google Calendar
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleSync}
                            disabled={syncing}
                        >
                            {syncing ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...</>
                            ) : (
                                <><RefreshCw className="h-4 w-4 mr-2" /> Sync Now</>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnect}
                            className="text-red-500 hover:text-red-600"
                        >
                            Disconnect
                        </Button>
                    </>
                )}
                {lastSync && connected && (
                    <span className="text-xs text-muted-foreground">
                        Last synced: {lastSync}
                    </span>
                )}
            </div>
        </div>
    )
}

interface PreferencesPanelProps {
    onSave?: () => void
}

export function PreferencesPanel({ onSave }: PreferencesPanelProps) {
    const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")

    useEffect(() => {
        // Load preferences from localStorage or API
        const stored = localStorage.getItem("calendux_preferences")
        if (stored) {
            try {
                setPreferences(JSON.parse(stored))
            } catch {
                // Use defaults
            }
        }

        // Check notification permission
        if ("Notification" in window) {
            setNotificationPermission(Notification.permission)
        }
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            // Save to localStorage
            localStorage.setItem("calendux_preferences", JSON.stringify(preferences))

            // Also save to server
            await fetch("/api/user", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferences }),
            })

            setSaved(true)
            toast.success("Preferences saved")
            setTimeout(() => setSaved(false), 2000)
            onSave?.()
        } catch {
            toast.error("Failed to save preferences")
        } finally {
            setSaving(false)
        }
    }

    const requestNotificationPermission = async () => {
        if ("Notification" in window) {
            const permission = await Notification.requestPermission()
            setNotificationPermission(permission)
            if (permission === "granted") {
                toast.success("Notifications enabled!")
                setPreferences(prev => ({ ...prev, enableNotifications: true }))
            }
        }
    }

    const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
        setPreferences(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="space-y-6">
            {/* Working Hours */}
            <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold">Working Hours</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    The AI optimizer will try to schedule important tasks within these hours.
                </p>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                        <select
                            value={preferences.workingHoursStart}
                            onChange={(e) => updatePreference("workingHoursStart", e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                        >
                            {TIME_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <span className="text-muted-foreground mt-5">to</span>
                    <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1 block">End</label>
                        <select
                            value={preferences.workingHoursEnd}
                            onChange={(e) => updatePreference("workingHoursEnd", e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                        >
                            {TIME_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Focus Time Preference */}
            <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-4">
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold">Preferred Focus Time</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    When are you most productive for deep work?
                </p>
                <div className="flex gap-2">
                    {[
                        { value: "morning", label: "Morning", icon: "🌅" },
                        { value: "afternoon", label: "Afternoon", icon: "☀️" },
                        { value: "evening", label: "Evening", icon: "🌙" },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updatePreference("preferredFocusTime", opt.value)}
                            className={cn(
                                "flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all",
                                preferences.preferredFocusTime === opt.value
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background border-border hover:bg-muted"
                            )}
                        >
                            <span className="text-lg mr-2">{opt.icon}</span>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications */}
            <div className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-2 mb-4">
                    <Bell className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold">Notifications</h3>
                </div>

                {notificationPermission !== "granted" ? (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            Enable browser notifications to get reminders before your events.
                        </p>
                        <Button onClick={requestNotificationPermission} variant="outline" size="sm">
                            <Bell className="h-4 w-4 mr-2" />
                            Enable Notifications
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Event reminders</span>
                            <button
                                onClick={() => updatePreference("enableNotifications", !preferences.enableNotifications)}
                                className={cn(
                                    "relative w-11 h-6 rounded-full transition-colors",
                                    preferences.enableNotifications ? "bg-primary" : "bg-muted"
                                )}
                            >
                                <span className={cn(
                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                                    preferences.enableNotifications && "translate-x-5"
                                )} />
                            </button>
                        </div>

                        {preferences.enableNotifications && (
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Notify me</label>
                                <select
                                    value={preferences.notifyBefore}
                                    onChange={(e) => updatePreference("notifyBefore", parseInt(e.target.value))}
                                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm"
                                >
                                    {NOTIFY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Google Calendar */}
            <GoogleCalendarSync />

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
                size="lg"
            >
                {saved ? (
                    <>
                        <Check className="h-4 w-4 mr-2" />
                        Saved!
                    </>
                ) : saving ? (
                    "Saving..."
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                    </>
                )}
            </Button>
        </div>
    )
}
