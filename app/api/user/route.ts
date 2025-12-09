import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user exists in our database
    let user = await prisma.user.findUnique({
      where: { id: userId },
    })

    // If not, create them
    if (!user) {
      const clerkUser = await currentUser()
      
      if (!clerkUser?.emailAddresses?.[0]?.emailAddress) {
        return NextResponse.json({ error: "No email found" }, { status: 400 })
      }

      user = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error syncing user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { timezone } = body

    const user = await prisma.user.update({
      where: { id: userId },
      data: { timezone },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
