import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/sign-in",
        error: "/sign-in", // Redirect to sign-in on error
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // Always allow sign in - we'll create user lazily if needed
            if (!user.email) {
                console.error("Sign in failed: No email provided")
                return false
            }
            return true
        },
        async jwt({ token, user, account, profile, trigger }) {
            // On initial sign in, set up the token
            if (user?.email) {
                token.email = user.email
                token.name = user.name
                token.picture = user.image

                // Try to fetch/create user in database
                try {
                    let dbUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    })

                    if (!dbUser) {
                        // Create new user
                        dbUser = await prisma.user.create({
                            data: {
                                id: crypto.randomUUID(),
                                email: user.email,
                                name: user.name || null,
                                timezone: "UTC",
                            },
                        })
                    }

                    token.userId = dbUser.id
                } catch (error) {
                    console.error("Database error during sign in:", error)
                    // Use a temporary ID based on email hash if DB fails
                    // This allows sign-in but features requiring DB will fail gracefully
                    token.userId = `temp_${Buffer.from(user.email).toString("base64").slice(0, 16)}`
                }
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = (token.userId as string) || ""
                session.user.email = token.email as string
                session.user.name = token.name as string
                session.user.image = token.picture as string
            }
            return session
        },
    },
})
