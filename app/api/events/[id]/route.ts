import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

// GET a single event
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.event.findFirst({
      where: { id, userId },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update an event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    // Ensure the event belongs to the user
    const existingEvent = await prisma.event.findFirst({
      where: { id, userId },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(start && { start: new Date(start) }),
        ...(end && { end: new Date(end) }),
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
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE an event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
