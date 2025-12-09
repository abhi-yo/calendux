"use client"

import * as React from "react"
import { Conflict, ConflictType } from "@/lib/conflict/types"
import { AlertTriangle, Zap, RefreshCw, AlertOctagon } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ConflictList({ conflicts, onResolve }: { conflicts: Conflict[], onResolve?: (id: string) => void }) {
    if (conflicts.length === 0) return null

    const getIcon = (type: ConflictType) => {
        switch (type) {
            case ConflictType.HARD_OVERLAP: return <AlertOctagon className="h-4 w-4 text-red-500" />
            case ConflictType.ENERGY_OVERLOAD: return <Zap className="h-4 w-4 text-orange-500" />
            case ConflictType.RECOVERY_REQUIRED: return <RefreshCw className="h-4 w-4 text-yellow-500" />
            default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">detected conflicts</h3>
            <div className="space-y-2">
                {conflicts.map(conflict => (
                    <div key={conflict.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg shadow-sm hover:bg-accent/50 transition-colors">
                        <div className="mt-0.5">{getIcon(conflict.type)}</div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{conflict.title}</span>
                                <span className="text-[10px] font-mono border border-border px-1 rounded bg-secondary uppercase">{conflict.severity}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{conflict.description}</p>
                            {conflict.suggestedAction && (
                                <div className="text-xs text-primary mt-1 font-medium">
                                    💡 {conflict.suggestedAction}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
