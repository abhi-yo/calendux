import { prisma } from "@/lib/db"
import { SyncProvider } from "./types"
import { GoogleCalendarProvider } from "./google"

export class SyncManager {
  private providers: Record<string, SyncProvider> = {}

  constructor() {
    // Register providers
    this.registerProvider(new GoogleCalendarProvider())
  }

  registerProvider(provider: SyncProvider) {
    this.providers[provider.name] = provider
  }

  async syncUserEvents(userId: string) {
    console.log(`Starting sync for user ${userId}`)
    
    // 1. Get user connections (Stub: assume user has Google connected)
    // In real app: const connections = await prisma.connection.findMany({ where: { userId } })
    const activeProviders = ["GOOGLE"] 

    for (const providerName of activeProviders) {
      const provider = this.providers[providerName]
      if (!provider) continue

      try {
        // 2. Fetch events
        // In real app: retrieve access token from DB/Vault
        const events = await provider.fetchEvents("mock_token")
        
        // 3. Upsert into DB
        for (const event of events) {
            // Check if exists
            const existing = await prisma.event.findFirst({
                where: {
                    userId,
                    source: event.source,
                    externalId: event.externalId
                }
            })

            if (existing) {
                await prisma.event.update({
                    where: { id: existing.id },
                    data: {
                        title: event.title,
                        description: event.description,
                        start: event.start,
                        end: event.end,
                        location: event.location,
                        updatedAt: new Date()
                    }
                })
            } else {
                await prisma.event.create({
                    data: {
                        ...event,
                        userId
                    }
                })
            }
        }
        
        console.log(`Synced ${events.length} events from ${providerName}`)

      } catch (error) {
        console.error(`Failed to sync ${providerName} for user ${userId}:`, error)
      }
    }
  }
}

export const syncManager = new SyncManager()
