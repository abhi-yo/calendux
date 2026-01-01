"use client"

import * as React from "react"
import { AlertTriangle, Lightbulb, Info, TrendingUp, Zap, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Insight {
  type: "warning" | "suggestion" | "info"
  title: string
  description: string
  suggestedAction?: string
}

interface DailyLoad {
  date: string
  totalEnergy: number
  status: "light" | "moderate" | "heavy" | "burnout"
  eventCount: number
}

interface Suggestion {
  eventId: string
  eventTitle: string
  fromDay: string
  toDay: string
  reason: string
}

interface InsightsData {
  insights: Insight[]
  dailyLoads: DailyLoad[]
  suggestions: Suggestion[]
  summary: {
    totalEnergy: number
    burnoutRisk: boolean
    heavyDays: number
    eventCount: number
  }
}

interface InsightsPanelProps {
  data: InsightsData | null
  loading?: boolean
  onReschedule?: (eventId: string, toDay: string) => void
}

import { Button } from "@/components/ui/button"

export function InsightsPanel({ data, loading, onReschedule }: InsightsPanelProps) {
  if (loading) {
    return (
      <div className="h-full bg-muted/20 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-20 bg-muted rounded"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full bg-muted/20 p-4">
        <p className="text-sm text-muted-foreground">No insights available</p>
      </div>
    )
  }

  const getInsightIcon = (type: Insight["type"]) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "suggestion": return <Lightbulb className="h-4 w-4 text-yellow-500" />
      case "info": return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: DailyLoad["status"]) => {
    switch (status) {
      case "light": return "bg-green-500"
      case "moderate": return "bg-yellow-500"
      case "heavy": return "bg-orange-500"
      case "burnout": return "bg-red-500"
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Week Insights
        </h3>
      </div>

      {/* Summary */}
      <div className="p-4 border-b border-border">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{data.summary.eventCount}</div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
          <div className={cn(
            "rounded-lg p-3 text-center",
            data.summary.burnoutRisk ? "bg-red-500/10" : "bg-background"
          )}>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Zap className={cn("h-5 w-5", data.summary.burnoutRisk ? "text-red-500" : "")} />
              {Math.round(data.summary.totalEnergy)}
            </div>
            <div className="text-xs text-muted-foreground">Total Load</div>
          </div>
        </div>

        {data.summary.burnoutRisk && (
          <div className="mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              ⚠️ Burnout Risk Detected
            </p>
          </div>
        )}
      </div>

      {/* Daily Load Bar */}
      <div className="p-4 border-b border-border">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Daily Energy
        </h4>
        <div className="flex gap-1">
          {data.dailyLoads.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn("w-full rounded-t", getStatusColor(day.status))}
                style={{ height: `${Math.max(4, Math.min(40, day.totalEnergy * 2))}px` }}
                title={`${day.totalEnergy.toFixed(1)} energy`}
              />
              <span className="text-xs text-muted-foreground">
                {new Date(day.date).toLocaleDateString('en', { weekday: 'narrow' })}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Light
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Burnout
          </span>
        </div>
      </div>

      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Insights</h4>
          </div>
          <div className="space-y-3 relative">
            {data.insights.map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-lg border text-sm",
                  insight.type === "warning" && "bg-orange-500/5 border-orange-500/20",
                  insight.type === "suggestion" && "bg-yellow-500/5 border-yellow-500/20",
                  insight.type === "info" && "bg-blue-500/5 border-blue-500/20",
                )}
              >
                <div className="flex items-start gap-2">
                  {getInsightIcon(insight.type)}
                  <div>
                    <div className="font-medium">{insight.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                    {insight.suggestedAction && (
                      <p className="text-xs mt-2 font-medium text-primary">
                        💡 {insight.suggestedAction}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="p-4">
          <h4 className="text-sm font-medium mb-3">Optimization Suggestions</h4>
          <div className="space-y-2">
            {data.suggestions.map((suggestion, i) => (
              <div key={i} className="p-3 rounded-lg border bg-background text-sm">
                <p className="font-medium">{suggestion.eventTitle}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {suggestion.reason}
                </p>
                {onReschedule && (
                  <button
                    onClick={() => onReschedule(suggestion.eventId, suggestion.toDay)}
                    className="mt-2 text-xs text-primary hover:underline"
                  >
                    Move to {new Date(suggestion.toDay).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.insights.length === 0 && data.suggestions.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          <p>Your week looks balanced! 🎉</p>
        </div>
      )}
    </div>
  )
}
