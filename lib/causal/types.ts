export enum RelationType {
  FOLLOWED_BY = "FOLLOWED_BY",
  GENERATED_BY = "GENERATED_BY", // e.g. "Prep for X" -> "X"
  CONTEXT_SWITCH = "CONTEXT_SWITCH", // High cognitive load delta
  BLOCKS = "BLOCKS" // e.g. "Focus Time" blocks "Meeting"
}

export interface GraphEdge {
  fromEventId: string
  toEventId: string
  type: RelationType
  weight: number
  metadata?: Record<string, any>
}
