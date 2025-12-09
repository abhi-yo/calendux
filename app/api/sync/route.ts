import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { syncManager } from "@/lib/sync/manager"

export async function POST(req: Request) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Trigger sync
    // In a real app, this might be offloaded to a queue (QStash/BullMQ)
    // For MVP, run inline (careful with timeouts on Vercel)
    await syncManager.syncUserEvents(userId)

    return NextResponse.json({ success: true, message: "Sync completed" })
  } catch (error) {
    console.error("Sync API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
