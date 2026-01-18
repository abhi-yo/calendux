import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { optimizeSchedule } from "@/lib/intelligence"

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const userId = session.user.id

  try {
    const { weekStart } = await req.json()
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    // Fetch week's events
    const events = await prisma.event.findMany({
      where: {
        userId,
        start: {
          gte: start,
          lt: end,
        },
      },
    })

    // Run optimization
    // @ts-ignore - mismatch between Prisma Event and our internal logic Event type (dates vs strings)
    // We Map prisma dates to dates (they are Date objects already in runtime)
    const optimized = optimizeSchedule(events as any, start)

    return NextResponse.json(optimized)
  } catch (error) {
    console.error("Optimization failed:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
