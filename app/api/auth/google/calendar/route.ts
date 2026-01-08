import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/auth/google/calendar
 * Initiates Google OAuth flow for Calendar access
 */
export async function GET(request: NextRequest) {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

    if (!clientId) {
        return NextResponse.json({
            error: "Google OAuth not configured. Add GOOGLE_CLIENT_ID to .env"
        }, { status: 500 })
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID()

    // Store state in cookie for verification
    const response = NextResponse.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: "code",
            scope: [
                "https://www.googleapis.com/auth/calendar.readonly",
                "https://www.googleapis.com/auth/calendar.events.readonly",
            ].join(" "),
            access_type: "offline",
            prompt: "consent",
            state,
        }).toString()
    )

    response.cookies.set("google_oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10, // 10 minutes
    })

    return response
}
