import { Event } from "@/lib/intelligence"

export enum ConflictType {
  HARD_OVERLAP = "HARD_OVERLAP",             // Time collision
  ENERGY_OVERLOAD = "ENERGY_OVERLOAD",       // Daily capacity exceeded
  CONTEXT_SWITCH_FATIGUE = "CONTEXT_SWITCH_FATIGUE", // Too many switches
  RECOVERY_REQUIRED = "RECOVERY_REQUIRED"    // High intense work without break
}

export interface Conflict {
  id: string
  type: ConflictType
  severity: "high" | "medium" | "low"
  title: string
  description: string
  eventIds: string[]
  suggestedAction?: string
}
