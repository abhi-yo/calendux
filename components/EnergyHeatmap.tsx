"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type DailyEnergy = {
  date: Date
  totalEnergy: number
  status: "light" | "moderate" | "heavy" | "burnout"
}

export function EnergyHeatmap({ dailyData }: { dailyData: DailyEnergy[] }) {
    return (
        <div className="flex items-center gap-1">
            {dailyData.map((day, i) => {
                let color = "bg-green-500/50"
                if (day.status === "moderate") color = "bg-yellow-400/60"
                if (day.status === "heavy") color = "bg-orange-500/70"
                if (day.status === "burnout") color = "bg-red-500/80"

                // Height based on load, max 24px
                const height = Math.max(4, Math.min(24, (day.totalEnergy / 30) * 24))

                return (
                    <div key={i} className="group relative flex flex-col items-center justify-end h-8 w-6 cursor-help">
                         <div 
                            className={cn("w-full rounded-sm transition-all", color)}
                            style={{ height: `${height}px` }}
                        />
                        <span className="text-[8px] uppercase font-mono text-muted-foreground mt-0.5">{day.date.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute top-full mt-2 hidden group-hover:block z-50 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg whitespace-nowrap border border-border">
                            <div className="font-bold">{day.date.toLocaleDateString()}</div>
                            <div>Load: {day.totalEnergy.toFixed(1)} / 30</div>
                            <div className="capitalize font-medium" style={{ color: day.status === 'burnout' ? 'red' : 'inherit' }}>{day.status}</div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
