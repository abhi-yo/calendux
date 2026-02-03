import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { scoreEvent } from "@/lib/llm/client"

export async function POST(req: Request) {
  const sessionPromise = auth()
  const bodyPromise = req.json()
  
  const [session, body] = await Promise.all([sessionPromise, bodyPromise])

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { title, description, start, end } = body

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 })
    }

    const score = await scoreEvent({
      title,
      description,
      start: start ? new Date(start) : new Date(),
      end: end ? new Date(end) : new Date()
    })

    return NextResponse.json(score)

  } catch (error) {
    console.error("Score API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
