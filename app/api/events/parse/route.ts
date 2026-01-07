import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { parseNaturalLanguageEvent } from "@/lib/llm/client"

/**
 * POST /api/events/parse
 * Parse natural language input into structured event data
 * 
 * Body: { input: string, timezone?: string }
 * Returns: ParseResult
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await request.json()
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
        console.error("[API] Parse event error:", error)
        return NextResponse.json(
            { success: false, error: "Failed to parse input", rawInput: "" },
            { status: 500 }
        )
    }
}
