# Calendux

**AI-powered intelligent calendar for burnout prevention and schedule optimization.**

Calendux is a full-stack calendar application that goes beyond simple event scheduling. It uses artificial intelligence to analyze your workload, detect scheduling conflicts, predict burnout risks, and provide smart recommendations — helping you achieve a healthier work-life balance.

## Features

### Core Calendar

- **Weekly Calendar View** — Visualize your schedule in a clean weekly grid with drag-and-drop support (powered by `@dnd-kit`).
- **Event Management** — Create, edit, and delete events with rich metadata including energy cost, cognitive load, flexibility, and importance ratings.
- **Event Types** — Organize events as Meetings, Tasks, Habits, Focus blocks, Breaks, or Personal time.
- **Quick Add** — Rapidly create events using a streamlined text input.
- **Recurring Events** — Set up events that repeat on a defined schedule.

### AI-Powered Intelligence

- **Burnout Prediction** — Tracks daily energy levels and cognitive load across your week, flagging days where you're at risk of burnout.
- **Schedule Optimization** — AI analyzes your calendar and suggests how to rearrange tasks based on your energy profile, event flexibility, and importance.
- **Week Insights** — Automatically generated summaries highlighting your heaviest days, workload distribution, and actionable suggestions.
- **Conflict Detection** — Identifies overlapping events and scheduling conflicts with resolution suggestions.

### Energy & Workload Tracking

- **Energy Heatmap** — A visual representation of how your energy is distributed throughout the week.
- **Cognitive Load Tracking** — Each event carries a cognitive load score, enabling the system to balance mentally demanding work across your schedule.
- **Energy Profiles** — Customize your personal energy curve so the optimizer knows when you're at peak performance.

### Integrations & Event Sources

- **Google Calendar** — Import events from Google.
- **Notion, Todoist, Slack** — Additional event source support for pulling in tasks and meetings from other tools.
- **Manual Entry** — Create events directly within Calendux.

### User Experience

- **Dark / Light Theme** — Toggle between themes with `next-themes`.
- **Timezone Management** — Timezone-aware scheduling with an onboarding flow to set your timezone.
- **Keyboard Shortcuts** — Productivity-focused keyboard shortcuts for power users.
- **Onboarding Tour** — Interactive walkthrough for new users.
- **Toast Notifications** — Real-time feedback via `sonner`.
- **Causal Event Chains** — Link events that cause or are caused by other events, building a graph of how your tasks relate to one another.

### Subscription Tiers

- **Free** — Core calendar and basic insights.
- **Pro** — Advanced AI optimization and full energy analytics.
- **Team** — Collaborative features for teams.

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **UI** | [React 19](https://react.dev), [TailwindCSS 4](https://tailwindcss.com), [Radix UI](https://www.radix-ui.com), [Framer Motion](https://www.framer.com/motion/) |
| **3D Graphics** | [Three.js](https://threejs.org) with postprocessing |
| **Database** | [PostgreSQL](https://www.postgresql.org) with [Prisma ORM](https://www.prisma.io) |
| **Authentication** | [NextAuth.js v5](https://authjs.dev) (Google OAuth) |
| **AI / LLM** | [Vercel AI SDK](https://sdk.vercel.ai), Google Gemini, OpenAI GPT |
| **Validation** | [Zod](https://zod.dev) |
| **Package Manager** | [pnpm](https://pnpm.io) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org) |

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/                # REST API routes
│   │   ├── events/         # Event CRUD
│   │   ├── insights/       # AI-generated weekly insights
│   │   ├── optimize/       # Schedule optimization endpoint
│   │   ├── user/           # User profile & preferences
│   │   └── auth/           # Authentication endpoints
│   ├── pricing/            # Pricing page
│   ├── privacy/            # Privacy policy
│   ├── terms/              # Terms of service
│   ├── settings/           # User settings
│   ├── sign-in/            # Sign-in page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home / dashboard
├── components/             # React components
│   ├── CalendarShell.tsx   # Main calendar container
│   ├── WeeklyCalendar.tsx  # Weekly calendar grid
│   ├── EventDialog.tsx     # Event creation/editing modal
│   ├── InsightsPanel.tsx   # Weekly insights display
│   ├── SmartOptimizeDialog.tsx  # AI optimization UI
│   ├── EnergyHeatmap.tsx   # Energy distribution visualization
│   ├── ConflictList.tsx    # Conflict detection panel
│   ├── PreferencesPanel.tsx # User settings panel
│   ├── ui/                 # Radix-based UI primitives
│   └── animate-ui/         # Animated UI components
├── lib/                    # Core business logic
│   ├── intelligence.ts     # Energy & burnout calculations
│   ├── optimizer/          # Schedule optimization engine
│   ├── conflict/           # Conflict detection logic
│   ├── llm/                # LLM integration layer
│   ├── causal/             # Causal event tracking
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client singleton
│   └── data.ts             # Cached data fetching
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── prisma/                 # Database schema & migrations
│   ├── schema.prisma       # Data model
│   └── migrations/         # Migration history
├── public/                 # Static assets
└── scripts/                # Utility scripts
```

## Data Model

Calendux uses PostgreSQL with Prisma ORM. The core models include:

- **User** — Profile, timezone, energy profile, preferences, and subscription tier.
- **Event** — Rich event data with type, source, energy cost, cognitive load, flexibility, importance, tags, location, and recurrence support.
- **Cause / EventCause** — Tracks why events exist (causal relationships with confidence scores).
- **EventRelation** — Weighted directional graph edges between events.
- **Prediction** — AI-generated predictions for burnout, conflict, and overload risks.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (v18 or later)
- [pnpm](https://pnpm.io) (v10+)
- [PostgreSQL](https://www.postgresql.org) database

### Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Application URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth session encryption |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OPENAI_API_KEY` | *(Optional)* OpenAI API key for GPT-based features |
| `GOOGLE_GENERATIVE_AI_API_KEY` | *(Optional)* Google AI API key for Gemini-based features |

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client and run migrations
pnpm prisma generate
pnpm prisma migrate dev

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Generate Prisma client and build for production |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |

## Deployment

Calendux is designed to be deployed on [Vercel](https://vercel.com). Ensure your environment variables are configured in your Vercel project settings and that your PostgreSQL database is accessible from the deployment environment.

```bash
pnpm build
pnpm start
```

For more details, see the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## License

This project is private.
