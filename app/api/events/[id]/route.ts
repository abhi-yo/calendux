import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET a single event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = await params

    const event = await prisma.event.findFirst({
      where: { id, userId },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update an event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = await params
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

    // Server-side validation: Ensure end is after start
    if (start && end) {
      const startDate = new Date(start)
      let endDate = new Date(end)
      if (endDate <= startDate) {
        // Fix: Make sure end is at least 15 min after start
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000)
      }
    }

    // Ensure the event belongs to the user
    const existingEvent = await prisma.event.findFirst({
      where: { id, userId },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Recalculate dates if needed
    let finalStart = start ? new Date(start) : undefined
    let finalEnd = end ? new Date(end) : undefined

    if (finalStart && finalEnd && finalEnd <= finalStart) {
      finalEnd = new Date(finalStart.getTime() + 60 * 60 * 1000)
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(finalStart && { start: finalStart }),
        ...(finalEnd && { end: finalEnd }),
        ...(allDay !== undefined && { allDay }),
        ...(type && { type }),
        ...(energyCost && { energyCost }),
        ...(importance && { importance }),
        ...(flexibility && { flexibility }),
        ...(causedById !== undefined && { causedById }),
        ...(tags && { tags }),
        ...(notes !== undefined && { notes }),
      },
    })

    return NextResponse.json(event)
  } catch (error) {

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE an event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { id } = await params

    // Ensure the event belongs to the user
    const existingEvent = await prisma.event.findFirst({
      where: { id, userId },
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
