import { prisma } from "@/lib/db"
import { Event } from "@/lib/intelligence"
import { GraphEdge, RelationType } from "./types"

export class CausalEngine {
  
  /**
   * Main Graph Build Loop
   * Analyzing interactions between events to build the Causal Graph.
   */
  async detectRelations(userId: string) {
    console.log(`[CausalEngine] Thinking... analyzing graph for ${userId}`)

    // 1. Fetch recent and upcoming events
    // We look at a window: last 7 days + next 14 days
    const now = new Date()
    const startWindow = new Date(now)
    startWindow.setDate(startWindow.getDate() - 7)
    const endWindow = new Date(now)
    endWindow.setDate(endWindow.getDate() + 14)

    const events = await prisma.event.findMany({
      where: {
        userId,
        start: { gte: startWindow, lte: endWindow }
      },
      orderBy: { start: 'asc' }
    })

    // Cast to our internal Event type which aligns with Prisma result mostly
    const internalEvents = events as unknown as Event[]
    const edges: GraphEdge[] = []

    // 2. Pairwise Analysis (O(N^2) but N is small for a 3-week window)
    for (let i = 0; i < internalEvents.length; i++) {
        for (let j = i + 1; j < internalEvents.length; j++) {
            const A = internalEvents[i]
            const B = internalEvents[j]

            // REL 1: Temporal Proximity (FOLLOWED_BY)
            // If B starts within 15 mins of A ending
            const gapMinutes = (new Date(B.start).getTime() - new Date(A.end).getTime()) / 60000
            if (gapMinutes >= 0 && gapMinutes <= 15) {
                edges.push({
                    fromEventId: A.id,
                    toEventId: B.id,
                    type: RelationType.FOLLOWED_BY,
                    weight: 1.0
                })
            }

            // REL 2: Semantic Causality (GENERATED_BY) - MVP Heuristic
            // pattern: "Prep for X" -> "X"
            if (this.isPrepFor(A.title, B.title)) {
                 edges.push({
                    fromEventId: A.id,
                    toEventId: B.id,
                    type: RelationType.GENERATED_BY,
                    weight: 0.9
                })
            }

            // REL 3: Context Switch Detection
            // If high focus -> low focus or vice-versa
            // and close in time
            if (gapMinutes >= 0 && gapMinutes <= 30) {
                 const energyDelta = Math.abs(A.energyCost - B.energyCost)
                 // If moving from Deep Work (5) to Admin (1) -> High switch cost
                 if (energyDelta >= 3) {
                     edges.push({
                         fromEventId: A.id,
                         toEventId: B.id,
                         type: RelationType.CONTEXT_SWITCH,
                         weight: energyDelta * 0.5
                     })
                 }
            }
        }
    }

    // 3. Save Edges to DB
    await this.saveRelations(edges)
    console.log(`[CausalEngine] Learned ${edges.length} new connections.`)
  }

  private isPrepFor(titleA: string, titleB: string): boolean {
      const lowerA = titleA.toLowerCase()
      const lowerB = titleB.toLowerCase()
      // "Prep for Meeting" -> "Meeting"
      if (lowerA.includes("prep") && lowerA.includes(lowerB)) return true
      // "Meeting Material" -> "Meeting"
      if (lowerA.includes("material") && lowerA.includes(lowerB)) return true
      return false
  }

  private async saveRelations(edges: GraphEdge[]) {
      for (const edge of edges) {
          // Upsert logic (simplest for MVP: delete existing edge of same type logic, or ignore duplicates)
          // We'll use findFirst to avoid duplicates
          const existing = await prisma.eventRelation.findFirst({
              where: {
                  fromEventId: edge.fromEventId,
                  toEventId: edge.toEventId,
                  type: edge.type
              }
          })

          if (!existing) {
              await prisma.eventRelation.create({
                  data: {
                      fromEventId: edge.fromEventId,
                      toEventId: edge.toEventId,
                      type: edge.type,
                      weight: edge.weight
                  }
              })
          }
      }
  }
}

export const causalEngine = new CausalEngine()
