
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      // Create user if not exists
      if (session.user.email) {
        const newUser = await prisma.user.create({
          data: {
            id: userId,
            email: session.user.email,
            name: session.user.name || null,
            timezone: "UTC"
          }
        })
        return NextResponse.json(newUser)
      }
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await req.json()
    const { timezone, onboardingCompleted } = body

    // Get existing user to preserve preferences
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (timezone !== undefined) {
      updateData.timezone = timezone
    }

    if (onboardingCompleted !== undefined) {
      // Merge with existing preferences
      const currentPreferences = (existingUser?.preferences as Record<string, unknown>) || {}
      updateData.preferences = {
        ...currentPreferences,
        onboardingCompleted: onboardingCompleted
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    return NextResponse.json(user)
  } catch (error) {

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

