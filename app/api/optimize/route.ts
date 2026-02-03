import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { optimizeSchedule } from "@/lib/intelligence"

export async function POST(req: NextRequest) {
  const sessionPromise = auth()
  const bodyPromise = req.json()
  
  const [session, body] = await Promise.all([sessionPromise, bodyPromise])

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const userId = session.user.id

  try {
    const { weekStart } = body
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    const events = await prisma.event.findMany({
      where: {
        userId,
        start: {
          gte: start,
          lt: end,
        },
      },
    })

    // @ts-ignore
    const optimized = optimizeSchedule(events as any, start)

    return NextResponse.json(optimized)
  } catch (error) {
    console.error("Optimization failed:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
