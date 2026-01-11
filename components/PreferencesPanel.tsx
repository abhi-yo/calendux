"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Bell, Clock, Moon, Sun, Save, Check, Sparkles } from "lucide-react"
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
    useAI?: boolean
    aiProvider?: string
    apiKey?: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    preferredFocusTime: "morning",
    enableNotifications: true,
    notifyBefore: 15,
    theme: "system",
    useAI: false,
    apiKey: "",
    aiProvider: "openai"
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
        const storedKey = localStorage.getItem("calendux_openai_key")
        const storedProvider = localStorage.getItem("calendux_ai_provider")
        const storedUseAI = localStorage.getItem("calendux_use_ai")

        let initialPrefs = DEFAULT_PREFERENCES
        if (stored) {
            try {
                initialPrefs = { ...initialPrefs, ...JSON.parse(stored) }
            } catch {
                // Use defaults
            }
        }

        // Load AI settings separately
        if (storedKey) initialPrefs.apiKey = storedKey
        if (storedProvider) initialPrefs.aiProvider = storedProvider
        if (storedUseAI) initialPrefs.useAI = storedUseAI === "true"

        setPreferences(initialPrefs)

        // Check notification permission
        if ("Notification" in window) {
            setNotificationPermission(Notification.permission)
        }
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            // Seprate server-safe prefs from local-only secrets
            const { apiKey, aiProvider, useAI, ...serverPrefs } = preferences

            // Save standard prefs to localStorage object
            localStorage.setItem("calendux_preferences", JSON.stringify(serverPrefs))

            // Save AI settings to individual keys for WeeklyCalendar access
            if (apiKey) localStorage.setItem("calendux_openai_key", apiKey) // Legacy key name for compatibility
            if (aiProvider) localStorage.setItem("calendux_ai_provider", aiProvider)
            if (useAI !== undefined) localStorage.setItem("calendux_use_ai", String(useAI))

            // Also save logic to server (excluding key!)
            await fetch("/api/user", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferences: serverPrefs }),
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

            {/* AI Configuration */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border/50">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Intelligence Engine</h3>
                        <p className="text-xs text-muted-foreground">Configure the AI model used for schedule optimization</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                        <p className="font-medium text-sm">Enable AI Optimization</p>
                        <p className="text-xs text-muted-foreground max-w-[280px]">
                            Use advanced LLMs to reorganize your calendar. Requires your own API key.
                        </p>
                    </div>
                    <button
                        onClick={() => updatePreference("useAI", !preferences.useAI)}
                        className={cn(
                            "relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            preferences.useAI ? "bg-primary" : "bg-muted"
                        )}
                        role="switch"
                        aria-checked={preferences.useAI}
                    >
                        <span className={cn(
                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-background shadow-sm transition-transform duration-200",
                            preferences.useAI && "translate-x-5"
                        )} />
                    </button>
                </div>

                {preferences.useAI && (
                    <div className="space-y-5 animate-in slide-in-from-top-2 duration-200 fade-in-0">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                AI Provider
                            </label>
                            <select
                                value={preferences.aiProvider || "openai"}
                                onChange={(e) => updatePreference("aiProvider", e.target.value)}
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="openai">OpenAI (GPT-5.2)</option>
                                <option value="google">Google (Gemini 3 Flash)</option>
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {preferences.aiProvider === 'google' ? 'Google API Key' : 'OpenAI API Key'}
                            </label>
                            <input
                                type="password"
                                value={preferences.apiKey || ""}
                                onChange={(e) => updatePreference("apiKey", e.target.value)}
                                placeholder={
                                    preferences.aiProvider === 'google' ? 'AIza...' :
                                        'sk-...'
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                            />
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                                Keys are stored locally in your browser and never saved to our servers.
                            </p>
                        </div>
                    </div>
                )}
            </div>


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
