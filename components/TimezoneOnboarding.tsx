"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Globe, Clock } from "lucide-react"
import { toast } from "sonner"

export function TimezoneOnboarding() {
    const [open, setOpen] = React.useState(false)
    const [detectedZone, setDetectedZone] = React.useState("")
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        const checkTimezone = async () => {
            try {
                // 1. Detect Browser Timezone
                const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone
                setDetectedZone(localZone)

                // 2. Fetch User Profile
                const res = await fetch("/api/user")
                if (res.ok) {
                    const user = await res.json()

                    // 3. Compare with DB
                    // If DB is default "UTC" and we are NOT in UTC, ask user
                    // Or if user just hasn't set it explicitly (we assume UTC is unset default)
                    if (user.timezone === "UTC" && localZone !== "UTC") {
                        setOpen(true)
                    }
                }
            } catch (error) {
                console.error("Failed to check timezone", error)
            }
        }

        checkTimezone()
    }, [])

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ timezone: detectedZone })
            })

            if (res.ok) {
                toast.success(`Timezone set to ${detectedZone}`)
                setOpen(false)
                // Ideally trigger a refresh of calendar data here, 
                // but page reload or next fetch will pick it up.
                // We can force reload to be sure:
                window.location.reload()
            } else {
                toast.error("Failed to save timezone")
            }
        } catch {
            toast.error("Error saving timezone")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Set your timezone
                    </DialogTitle>
                    <DialogDescription>
                        We noticed you are in a different timezone than your account setting.
                        Update to ensure your schedule is accurate.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg space-y-2">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm font-medium text-muted-foreground">Detected Location</div>
                    <div className="text-xl font-bold text-primary">{detectedZone}</div>
                </div>

                <DialogFooter className="sm:justify-between flex-row items-center">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">
                        Keep UTC
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading}>
                        {loading ? "Saving..." : `Switch to ${detectedZone}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
