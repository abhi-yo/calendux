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
  const sessionPromise = auth()
  const bodyPromise = req.json()
  
  const [session, body] = await Promise.all([sessionPromise, bodyPromise])

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const { timezone, onboardingCompleted } = body

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    const updateData: Record<string, unknown> = {}

    if (timezone !== undefined) {
      updateData.timezone = timezone
    }

    if (onboardingCompleted !== undefined) {
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

