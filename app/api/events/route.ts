import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const sessionPromise = auth()
  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  
  try {
    const session = await sessionPromise

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const events = await prisma.event.findMany({
      where: {
        userId,
        ...(start && end ? {
          start: { lt: new Date(end) },
          end: { gt: new Date(start) },
        } : {}),
      },
      orderBy: { start: "asc" },
    })

    return NextResponse.json(events)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const sessionPromise = auth()
  const bodyPromise = request.json()
  
  try {
    const [session, body] = await Promise.all([sessionPromise, bodyPromise])

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    let user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      if (session.user.email) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: session.user.email,
            name: session.user.name || null,
            timezone: "UTC",
          },
        })
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    }

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
      location,
    } = body

    if (!title || !start || !end) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let startDate = new Date(start)
    let endDate = new Date(end)

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
        source: "MANUAL",
        energyCost: energyCost ?? 3,
        importance: importance ?? 3,
        flexibility: flexibility ?? 3,
        causedById: causedById && causedById !== "none" ? causedById : null,
        tags: tags || [],
        notes: notes || null,
        location: location || null,
        userId,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
