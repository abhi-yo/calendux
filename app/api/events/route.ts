import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

// GET all events for the current user
export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    const events = await prisma.event.findMany({
      where: {
        userId,
        ...(start && end ? {
          start: { gte: new Date(start) },
          end: { lte: new Date(end) },
        } : {}),
      },
      orderBy: { start: "asc" },
    })

    return NextResponse.json(events)
  } catch (error) {

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new event
export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Ensure user exists in database
    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      // Auto-create user if not exists
      const { currentUser } = await import("@clerk/nextjs/server")
      const clerkUser = await currentUser()
      if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: clerkUser.emailAddresses[0].emailAddress,
            timezone: "UTC",
          },
        })
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    }

    const body = await request.json()
    const {
      title,
      description,
      start,
      end,
      allDay,
      type,
      energyCost,
      importance,
      flexibility,
      causedById,
      tags,
      notes,
    } = body

    if (!title || !start || !end) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let startDate = new Date(start)
    let endDate = new Date(end)

    // Server-side validation: Ensure end is after start
    if (endDate <= startDate) {
      endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: description || null,
        start: startDate,
        end: endDate,
        allDay: allDay || false,
        type: type || "TASK",
        energyCost: energyCost || 3,
        importance: importance || 3,
        flexibility: flexibility || 3,
        causedById: causedById || null,
        tags: tags || [],
        notes: notes || null,
        userId,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
