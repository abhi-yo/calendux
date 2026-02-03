import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionPromise = auth()
  const paramsPromise = params
  
  try {
    const [session, { id }] = await Promise.all([sessionPromise, paramsPromise])

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionPromise = auth()
  const paramsPromise = params
  const bodyPromise = request.json()
  
  try {
    const [session, { id }, body] = await Promise.all([sessionPromise, paramsPromise, bodyPromise])

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
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

    if (start && end) {
      const startDate = new Date(start)
      let endDate = new Date(end)
      if (endDate <= startDate) {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      }
    }

    const existingEvent = await prisma.event.findFirst({
      where: { id, userId },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Recalculate dates if needed
    const finalStart = start ? new Date(start) : undefined
    const finalEnd = end ? new Date(end) : undefined

    // Handle causedById - convert empty string or "none" to null
    const finalCausedById = causedById === "" || causedById === "none" ? null : causedById

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(finalStart && { start: finalStart }),
        ...(finalEnd && { end: finalEnd }),
        ...(allDay !== undefined && { allDay }),
        ...(type && { type }),
        ...(energyCost !== undefined && { energyCost: Number(energyCost) }),
        ...(importance !== undefined && { importance: Number(importance) }),
        ...(flexibility !== undefined && { flexibility: Number(flexibility) }),
        ...(causedById !== undefined && { causedById: finalCausedById }),
        ...(tags && { tags }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Internal server error", details: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionPromise = auth()
  const paramsPromise = params
  
  try {
    const [session, { id }] = await Promise.all([sessionPromise, paramsPromise])

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const existingEvent = await prisma.event.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
