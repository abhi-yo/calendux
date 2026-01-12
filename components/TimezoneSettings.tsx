"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Globe, Loader2 } from "lucide-react"
import { toast } from "sonner" // Assuming sonner is installed, or use simple alert if not

export function TimezoneSettings() {
  const [timezone, setTimezone] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // Get all supported timezones
  const timezones = React.useMemo(() => {
    return Intl.supportedValuesOf('timeZone')
  }, [])

  React.useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => {
        if (data.timezone) {
          setTimezone(data.timezone)
        } else {
          // Default to system timezone
          setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      })

      if (res.ok) {
        // Show success (using window.alert as fallback if no toast lib)
        alert("Timezone updated successfully")
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {

      alert("Failed to update timezone")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Timezone Settings
        </CardTitle>
        <CardDescription>
          Set your preferred timezone for calendar events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <label htmlFor="timezone" className="text-sm font-medium">
            Current Timezone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Your current time is: {new Date().toLocaleTimeString('en-US', { timeZone: timezone })}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
