import Link from "next/link"

export const metadata = {
  title: "Terms of Service",
  description: "Rules and conditions for using Calendux.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </Link>
        <h1 className="mt-8 text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>

        <div className="mt-10 space-y-8 text-muted-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. What You&apos;re Agreeing To</h2>
            <p className="mt-2">
              By signing in to Calendux you agree to these terms. Calendux is a calendar that uses energy scoring, burnout prediction, and optional AI optimization to help you manage your schedule. If you don&apos;t agree, don&apos;t use the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Your Account</h2>
            <p className="mt-2">
              You sign in with Google. You&apos;re responsible for the account tied to your Google email. Don&apos;t share access or let someone else use your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Your Data</h2>
            <p className="mt-2">
              You own the events and data you put into Calendux. By using the app you let us store and process that data to run the calendar, energy scoring, burnout insights, causal analysis, and AI optimization features. Details are in our{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. AI Features</h2>
            <p className="mt-2">
              AI optimization uses your own API key (OpenAI or Google) to send event data to those providers and get schedule suggestions back. The key is stored in your browser only. AI suggestions are recommendations — you decide whether to apply them. We&apos;re not responsible for scheduling decisions you make based on AI output.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Plans</h2>
            <p className="mt-2">
              Calendux has Free, Pro, and Team tiers. The Free plan includes basic weekly view, light energy scoring, and limited causal insights. Pro unlocks full causal graphs, AI rewrite engine, burnout forecasting, and more. Team adds cross-team features. Pricing is on the{" "}
              <Link href="/pricing" className="underline underline-offset-2 hover:text-foreground">pricing page</Link>.
              If you subscribe to a paid plan, payment terms and billing are as shown at checkout.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Acceptable Use</h2>
            <p className="mt-2">
              Don&apos;t abuse the service: no scraping, no overloading our systems, no using Calendux to harm others. We can suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Availability</h2>
            <p className="mt-2">
              We aim to keep Calendux running but don&apos;t guarantee 100% uptime. We may update, change, or remove features. The service is provided as-is without warranties beyond what the law requires.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Ending Use</h2>
            <p className="mt-2">
              You can stop using Calendux at any time. We can suspend or close your account if you break these terms. On termination, your data is handled as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Changes</h2>
            <p className="mt-2">
              We may update these terms. The current version is always on this page. Continued use after an update means you accept the new terms.
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
