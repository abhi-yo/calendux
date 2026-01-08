import { prisma } from "@/lib/db"
import { SyncProvider } from "./types"
import { GoogleCalendarProvider } from "./google"

interface GoogleCalendarTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
  scope: string
}

export class SyncManager {
  private providers: Record<string, SyncProvider> = {}

  constructor() {
    // Register providers
    this.registerProvider(new GoogleCalendarProvider())
  }

  registerProvider(provider: SyncProvider) {
    this.providers[provider.name] = provider
  }

  /**
   * Get Google Calendar tokens from user's stored preferences
   */
  async getGoogleCalendarToken(userId: string): Promise<string | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { preferences: true }
      })

      if (!user?.preferences) {
        console.log(`[SyncManager] No preferences found for user ${userId}`)
        return null
      }

      const prefs = user.preferences as Record<string, any>
      const googleCalendar = prefs.googleCalendar as GoogleCalendarTokens | undefined

      if (!googleCalendar?.accessToken) {
        console.log(`[SyncManager] No Google Calendar token found for user ${userId}`)
        return null
      }

      // Check if token is expired
      if (googleCalendar.expiresAt && Date.now() > googleCalendar.expiresAt) {
        console.log(`[SyncManager] Token expired, attempting refresh...`)
        const newToken = await this.refreshGoogleToken(userId, googleCalendar.refreshToken)
        return newToken
      }

      return googleCalendar.accessToken
    } catch (error) {
      console.error(`[SyncManager] Failed to get Google token:`, error)
      return null
    }
  }

  /**
   * Refresh an expired Google access token
   */
  async refreshGoogleToken(userId: string, refreshToken: string): Promise<string | null> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        console.error("[SyncManager] Missing Google OAuth credentials")
        return null
      }

      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      })

      if (!response.ok) {
        console.error("[SyncManager] Token refresh failed")
        return null
      }

      const tokens = await response.json()

      // Update stored tokens
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const prefs = (user?.preferences as Record<string, any>) || {}

      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: {
            ...prefs,
            googleCalendar: {
              ...prefs.googleCalendar,
              accessToken: tokens.access_token,
              expiresAt: Date.now() + tokens.expires_in * 1000,
            }
          }
        }
      })

      console.log("[SyncManager] Token refreshed successfully")
      return tokens.access_token
    } catch (error) {
      console.error("[SyncManager] Token refresh error:", error)
      return null
    }
  }

  /**
   * Check if user has Google Calendar connected
   */
  async hasGoogleConnection(userId: string): Promise<boolean> {
    const token = await this.getGoogleCalendarToken(userId)
    return token !== null
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnectGoogle(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      const prefs = (user?.preferences as Record<string, any>) || {}

      // Remove Google Calendar from preferences
      delete prefs.googleCalendar

      await prisma.user.update({
        where: { id: userId },
        data: { preferences: prefs }
      })

      console.log(`[SyncManager] Disconnected Google Calendar for user ${userId}`)
      return true
    } catch (error) {
      console.error("[SyncManager] Disconnect error:", error)
      return false
    }
  }

  /**
   * Sync all connected calendar sources for a user
   */
  async syncUserEvents(userId: string): Promise<{
    success: boolean
    synced: number
    provider: string
    error?: string
  }> {
    console.log(`[SyncManager] Starting sync for user ${userId}`)

    // Get Google Calendar token
    const accessToken = await this.getGoogleCalendarToken(userId)

    if (!accessToken) {
      return {
        success: false,
        synced: 0,
        provider: "GOOGLE",
        error: "Google Calendar not connected. Click 'Connect Google Calendar' to authorize access."
      }
    }

    const provider = this.providers["GOOGLE"]
    if (!provider) {
      return { success: false, synced: 0, provider: "GOOGLE", error: "Provider not found" }
    }

    try {
      // Fetch events from Google Calendar
      const events = await provider.fetchEvents(accessToken)

      if (events.length === 0) {
        console.log(`[SyncManager] No events to sync`)
        return { success: true, synced: 0, provider: "GOOGLE" }
      }

      // Upsert events into database
      let syncedCount = 0
      for (const event of events) {
        try {
          // Check if event already exists
          const existing = await prisma.event.findFirst({
            where: {
              userId,
              source: event.source,
              externalId: event.externalId
            }
          })

          if (existing) {
            // Update existing event
            await prisma.event.update({
              where: { id: existing.id },
              data: {
                title: event.title,
                description: event.description,
                start: event.start,
                end: event.end,
                allDay: event.allDay,
                location: event.location,
                type: event.type,
                energyCost: event.energyCost,
                cognitiveLoad: event.cognitiveLoad,
                isRecurring: event.isRecurring,
                recurrenceRule: event.recurrenceRule,
                updatedAt: new Date()
              }
            })
          } else {
            // Create new event
            await prisma.event.create({
              data: {
                ...event,
                userId
              }
            })
          }
          syncedCount++
        } catch (eventError) {
          console.error(`[SyncManager] Failed to sync event:`, eventError)
          // Continue with other events
        }
      }

      console.log(`[SyncManager] Synced ${syncedCount} events from Google Calendar`)
      return { success: true, synced: syncedCount, provider: "GOOGLE" }

    } catch (error: any) {
      console.error(`[SyncManager] Sync failed:`, error)

      if (error.message === "INVALID_TOKEN") {
        // Token is invalid, user needs to reconnect
        await this.disconnectGoogle(userId)
        return {
          success: false,
          synced: 0,
          provider: "GOOGLE",
          error: "Google Calendar session expired. Please reconnect your calendar."
        }
      }

      return {
        success: false,
        synced: 0,
        provider: "GOOGLE",
        error: error.message || "Failed to sync Google Calendar"
      }
    }
  }
}

export const syncManager = new SyncManager()
