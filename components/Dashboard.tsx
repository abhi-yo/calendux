"use client"

import * as React from "react"
import { WeeklyCalendar } from "@/components/WeeklyCalendar"

export function Dashboard() {
    return (
        <div className="h-screen w-full overflow-hidden">
            <WeeklyCalendar />
        </div>
    )
}
