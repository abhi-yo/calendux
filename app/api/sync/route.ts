import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { syncManager } from "@/lib/sync/manager"

/**
 * POST /api/sync
 * Trigger Google Calendar sync for the authenticated user
 */
export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await syncManager.syncUserEvents(userId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        needsAuth: result.error?.includes("connect") || result.error?.includes("re-authenticate")
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${result.synced} events from ${result.provider}`,
      synced: result.synced
    })
  } catch (error) {
    console.error("[Sync API] Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

/**
 * GET /api/sync
 * Check if user has Google Calendar connected
 */
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const connected = await syncManager.hasGoogleConnection(userId)

    return NextResponse.json({
      connected,
      provider: "google"
    })
  } catch (error) {
    console.error("[Sync API] Check Error:", error)
    return NextResponse.json({ connected: false, provider: "google" })
  }
}

/**
 * DELETE /api/sync
 * Disconnect Google Calendar
 */
export async function DELETE() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const success = await syncManager.disconnectGoogle(userId)

    if (success) {
      return NextResponse.json({ success: true, message: "Google Calendar disconnected" })
    } else {
      return NextResponse.json({ success: false, error: "Failed to disconnect" }, { status: 500 })
    }
  } catch (error) {
    console.error("[Sync API] Disconnect Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
