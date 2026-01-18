"use client"

import { useSession } from "next-auth/react"
import { TimezoneSettings } from "@/components/TimezoneSettings"
import { PreferencesPanel } from "@/components/PreferencesPanel"
import Link from "next/link"
import { ChevronLeft, User, Mail } from "lucide-react"

export default function SettingsPage() {
  const { data: session } = useSession()

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
          {/* Account Section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-4">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-medium">{session?.user?.name || "User"}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {session?.user?.email}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Signed in with Google. Account managed through your Google account settings.
              </p>
            </div>
          </section>

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
        </div>
      </div>
    </div>
  )
}
