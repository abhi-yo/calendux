import { Event } from "@/lib/intelligence"

export type NormalizedEvent = Omit<Event, "id" | "createdAt" | "updatedAt" | "userId"> & {
  externalId: string
  source: "GOOGLE" | "NOTION" | "TODOIST" | "SLACK" | "MANUAL"
}

export interface SyncProvider {
  name: string
  fetchEvents(accessToken: string): Promise<NormalizedEvent[]>
}
