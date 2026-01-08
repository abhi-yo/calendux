import { UserProfile } from "@clerk/nextjs"
import { TimezoneSettings } from "@/components/TimezoneSettings"
import { PreferencesPanel } from "@/components/PreferencesPanel"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Calendar
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Timezone */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Timezone</h2>
            <TimezoneSettings />
          </section>

          {/* Preferences */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>
            <PreferencesPanel />
          </section>

          {/* Account */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <UserProfile
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-border rounded-lg",
                }
              }}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
