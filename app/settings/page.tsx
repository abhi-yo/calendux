import { UserProfile } from "@clerk/nextjs"
import { TimezoneSettings } from "@/components/TimezoneSettings"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="space-y-6">
          <TimezoneSettings />
          <UserProfile 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border border-border",
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
