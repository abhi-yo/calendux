"use client"

import React, { useState } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface Feature {
  text: string
  included: boolean
  bold?: boolean
}

const TIERS: {
  name: string
  id: string
  price: { monthly: number; annual: number }
  description: string
  features: Feature[]
  cta: string
  highlight: boolean
  badge?: string
}[] = [
  {
    name: "Free",
    id: "free",
    price: { monthly: 0, annual: 0 },
    description: "Good enough to hook you.",
    features: [
      { text: "1 Calendar (Google only)", included: true },
      { text: "Basic Weekly View", included: true },
      { text: "Light Energy Scoring", included: true },
      { text: "5 Causal Insights / mo", included: true },
      { text: "Unlimited Integrations", included: false },
      { text: "AI Rewrite Engine", included: false },
      { text: "Burnout Forecasting", included: false },
    ],
    cta: "Current Plan",
    highlight: false
  },
  {
    name: "Pro",
    id: "pro",
    price: { monthly: 18, annual: 12 },
    description: "Unlocks true causality.",
    features: [
      { text: "Unlimited Calendars", included: true },
      { text: "Full Causal Graphs", included: true },
      { text: "AI Rewrite Engine", included: true, bold: true },
      { text: "Burnout Forecasting", included: true },
      { text: "Decision Log", included: true },
      { text: "Context Notifications", included: true },
    ],
    cta: "Upgrade to Pro",
    highlight: true,
    badge: "Recommended"
  },
  {
    name: "Team",
    id: "team",
    price: { monthly: 59, annual: 29 },
    description: "Coordinate energy.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Team Burnout Radar", included: true },
      { text: "Cross-Team Causality", included: true },
      { text: "AI Schedule Balancer", included: true },
      { text: "Org Time Debt", included: true },
    ],
    cta: "Contact Sales",
    highlight: false
  }
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = (tierId: string) => {
    setLoading(tierId)
    setTimeout(() => setLoading(null), 2000)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 py-24 px-4 md:px-8 font-sans">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-24 space-y-6">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
          Pricing that pays<br/>for itself.
        </h1>
        <p className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed">
          Start for free using the basic energy model. Upgrade to reclaim 10+ hours a week with AI.
        </p>
        
        {/* Toggle */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <span className={`text-xs font-bold tracking-widest uppercase ${!annual ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>Monthly</span>
          <div className="scale-110">
             <Switch checked={annual} onCheckedChange={setAnnual} />
          </div>
          <span className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${annual ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
            Yearly <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-2 py-0.5 rounded text-[10px] font-bold">SAVE 33%</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
        {TIERS.map((tier) => (
          <div 
            key={tier.id} 
            className={`relative flex flex-col p-8 transition-all duration-300 rounded-3xl
              ${tier.highlight 
                ? "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl" 
                : "bg-transparent border border-zinc-200 dark:border-zinc-800 opacity-80 hover:opacity-100"
              }
            `}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-8">
                <span className="bg-zinc-900 text-white dark:bg-white dark:text-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  {tier.badge}
                </span>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-2xl font-black tracking-tight mb-2">{tier.name}</h3>
              <p className="text-sm font-medium text-zinc-500">{tier.description}</p>
            </div>
            
            <div className="mb-10">
              <div className="flex items-baseline gap-1">
                 <span className="text-base font-bold text-zinc-400 align-top mt-1">$</span>
                 <span className="text-6xl font-black tracking-tighter">
                  {annual ? tier.price.annual : tier.price.monthly}
                </span>
                <span className="text-sm font-bold text-zinc-400">/{tier.id === "team" ? "user" : "mo"}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-10">
              {tier.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  {feature.included ? (
                    <div className="mt-1 h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100 flex-shrink-0" />
                  ) : (
                    <div className="mt-1 h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" />
                  )}
                  <span className={`text-sm leading-tight ${feature.included ? "text-zinc-700 dark:text-zinc-300 font-medium" : "text-zinc-400 line-through"} ${feature.bold ? "text-zinc-900 dark:text-white font-bold" : ""}`}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            <Button 
              className={`w-full h-12 text-sm font-bold rounded-xl transition-all shadow-none
                ${tier.highlight 
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200" 
                  : "bg-white dark:bg-transparent border-2 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              variant="default"
              onClick={() => handleUpgrade(tier.id)}
              disabled={loading !== null || tier.id === "free"}
            >
              {loading === tier.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                tier.cta
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
