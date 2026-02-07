import Link from "next/link"

export const metadata = {
  title: "Privacy Policy",
  description: "How Calendux collects, uses, and protects your data.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>

        <div className="mt-10 space-y-8 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. What Calendux Is</h2>
            <p className="mt-2">
              Calendux is an AI-powered calendar that scores your events by energy and cognitive load, predicts burnout risk, and can reschedule flexible events to balance your week. This policy explains what data we collect and how we use it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Data We Collect</h2>
            <ul className="mt-3 list-disc pl-6 space-y-2">
              <li>
                <strong className="text-foreground">Google account info:</strong> When you sign in with Google we receive your name, email, and profile picture. We store a user record with your email, name, timezone, and preferences.
              </li>
              <li>
                <strong className="text-foreground">Events:</strong> Events you create include title, start/end time, type (meeting, task, focus, break, etc.), energy cost, flexibility, importance, cognitive load, tags, and notes. All stored in our database so we can display your calendar and run insights.
              </li>
              <li>
                <strong className="text-foreground">Preferences:</strong> Working hours, preferred focus time, timezone, and notification settings you configure in Settings.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. AI Processing</h2>
            <p className="mt-2">
              When you enable AI optimization in Settings and provide your own API key, your event titles, times, and energy scores are sent to OpenAI (GPT-4o) or Google (Gemini 2.0 Flash) to generate schedule suggestions. Your API key is stored only in your browser&apos;s localStorage and is never sent to or stored on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. How We Use Your Data</h2>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>Display your weekly calendar and event details.</li>
              <li>Calculate energy scores, burnout risk, and schedule balance.</li>
              <li>Generate causal insights (which events trigger follow-ups, overload patterns).</li>
              <li>Run AI optimization when you click &quot;AI Optimize&quot; (requires your own API key).</li>
              <li>Authenticate you via Google sign-in.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Data Sharing</h2>
            <p className="mt-2">
              We do not sell your data. We share data only with:
            </p>
            <ul className="mt-3 list-disc pl-6 space-y-1">
              <li>Google, for sign-in (OAuth).</li>
              <li>OpenAI or Google AI, only when you trigger AI optimization with your own key.</li>
              <li>Our hosting provider, which stores and serves the database.</li>
              <li>Law enforcement, only if legally required.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
            <p className="mt-2">
              Your account and event data exist as long as your account is active. You can delete individual events from the calendar. To delete your entire account and all associated data, contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Changes</h2>
            <p className="mt-2">
              If we update this policy, the new version will be posted on this page with an updated date.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </Link>
        </div>
      </div>
    </div>
  )
}
