import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseNaturalLanguageEvent } from "@/lib/llm/client"

export async function POST(request: NextRequest) {
    const sessionPromise = auth()
    const bodyPromise = request.json()
    
    try {
        const [session, body] = await Promise.all([sessionPromise, bodyPromise])

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }

        const { input, timezone } = body

        if (!input || typeof input !== "string") {
            return NextResponse.json(
                { success: false, error: "Input is required", rawInput: input || "" },
                { status: 400 }
            )
        }

        const result = await parseNaturalLanguageEvent(input, timezone)

        return NextResponse.json(result)

    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to parse input", rawInput: "" },
            { status: 500 }
        )
    }
}
