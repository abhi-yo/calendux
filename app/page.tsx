import { auth } from "@clerk/nextjs/server"
import { Dashboard } from "@/components/Dashboard"
import { LandingPage } from "@/components/LandingPage"

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    return <LandingPage />
  }

  return <Dashboard />
}
