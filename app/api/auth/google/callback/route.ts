import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

/**
 * GET /api/auth/google/callback
 * Handles OAuth callback from Google
 */
export async function GET(request: NextRequest) {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.redirect(new URL("/sign-in", request.url))
    }

    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Check for errors from Google
    if (error) {
        console.error("[Google OAuth] Error:", error)
        return NextResponse.redirect(
            new URL(`/settings?error=google_oauth_denied`, request.url)
        )
    }

    // Verify state
    const storedState = request.cookies.get("google_oauth_state")?.value
    if (!state || state !== storedState) {
        console.error("[Google OAuth] State mismatch")
        return NextResponse.redirect(
            new URL(`/settings?error=invalid_state`, request.url)
        )
    }

    if (!code) {
        return NextResponse.redirect(
            new URL(`/settings?error=no_code`, request.url)
        )
    }

    try {
        // Exchange code for tokens
        const clientId = process.env.GOOGLE_CLIENT_ID!
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: "authorization_code",
            }),
        })

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text()
            console.error("[Google OAuth] Token exchange failed:", errorData)
            return NextResponse.redirect(
                new URL(`/settings?error=token_exchange_failed`, request.url)
            )
        }

        const tokens = await tokenResponse.json()

        // Store tokens in user preferences (encrypted in production)
        await prisma.user.update({
            where: { id: userId },
            data: {
                preferences: {
                    // @ts-ignore - Prisma JSON field
                    ...(await prisma.user.findUnique({ where: { id: userId } }))?.preferences,
                    googleCalendar: {
                        accessToken: tokens.access_token,
                        refreshToken: tokens.refresh_token,
                        expiresAt: Date.now() + tokens.expires_in * 1000,
                        scope: tokens.scope,
                    }
                }
            }
        })

        console.log("[Google OAuth] Successfully connected for user:", userId)

        // Clear state cookie and redirect to settings
        const response = NextResponse.redirect(
            new URL(`/settings?success=google_connected`, request.url)
        )
        response.cookies.delete("google_oauth_state")

        return response

    } catch (error) {
        console.error("[Google OAuth] Callback error:", error)
        return NextResponse.redirect(
            new URL(`/settings?error=callback_failed`, request.url)
        )
    }
}
