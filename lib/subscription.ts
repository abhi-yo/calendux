import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export type Tier = "FREE" | "PRO" | "TEAM"

/**
 * Get the current user's subscription tier.
 * Defaults to "FREE" if not found.
 */
export async function getUserTier(userId?: string): Promise<Tier> {
  if (!userId) {
    const session = await auth()
    userId = session?.userId || undefined
  }

  if (!userId) return "FREE"

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true }
    })
    
    // @ts-ignore - Prisma types might not represent the Enum correctly immediately after migration check
    return (user?.tier as Tier) || "FREE"
  } catch (error) {
    console.error("Failed to fetch user tier:", error)
    return "FREE"
  }
}

/**
 * Check if user has access to a specific feature.
 */
export async function checkFeatureAccess(feature: "ai_rewrite" | "unlimited_insights" | "integrations") {
  const tier = await getUserTier()
  
  if (tier === "TEAM" || tier === "PRO") return true
  
  // Free tier limits
  if (tier === "FREE") {
    return false
  }
  
  return false
}
