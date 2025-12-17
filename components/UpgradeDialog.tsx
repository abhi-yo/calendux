"use client"

import * as React from "react"
import { Check, Zap, Sparkles, Infinity, BarChart, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
}

export function UpgradeDialog({ open, onOpenChange, feature }: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-4xl p-0 gap-0 overflow-hidden bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <DialogTitle className="sr-only">Upgrade to Pro</DialogTitle>
        <div className="grid md:grid-cols-5 h-[600px] md:h-[550px]">
          
          {/* Left: Brand / Value (Darker contrast side) */}
          <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-900/50 p-8 flex flex-col justify-between border-r border-zinc-200 dark:border-zinc-800 relative">
             <div>
               <div className="flex items-center gap-2 mb-12">
                 <div className="h-8 w-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                   <Sparkles className="h-4 w-4 text-white dark:text-black" />
                 </div>
                 <span className="font-bold tracking-widest text-xs uppercase text-zinc-900 dark:text-zinc-100">Hyper-Context</span>
               </div>
               
               <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-[0.95] mb-6 text-zinc-900 dark:text-white">
                 Unlock<br/>
                 your full<br/>
                 potential.
               </h2>
               
               <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm leading-relaxed max-w-[240px]">
                 Stop managing your calendar manually. Let local intelligence optimize your energy and time.
               </p>
             </div>

             <div className="space-y-4">
                <FeatureRow icon={<Zap />} label="Burnout Forecasting" />
                <FeatureRow icon={<Infinity />} label="Unlimited Causal Depth" />
             </div>
          </div>

          {/* Right: Pricing / Action */}
          <div className="md:col-span-3 bg-white dark:bg-[#09090b] p-8 flex flex-col relative">
            <DialogClose className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <X className="h-4 w-4 text-zinc-500" />
            </DialogClose>

            <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
              <div className="mb-8">
                 <h3 className="text-xl font-bold tracking-tight mb-2">Upgrade to Pro</h3>
                 {feature && (
                   <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                     to use {feature}
                   </div>
                 )}
              </div>

              {/* Pricing Card */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50/50 dark:bg-zinc-900/20">
                 <div className="flex items-baseline justify-between mb-6">
                    <div>
                      <div className="font-bold text-lg">Pro Tier</div>
                      <div className="text-xs text-zinc-500 font-medium">For high-performers</div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black tracking-tight">$12<span className="text-sm font-medium text-zinc-500">/mo</span></div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Billed Annually</div>
                    </div>
                 </div>

                 <div className="space-y-3 mb-8">
                    <CheckItem text="Unlimited Integrations" />
                    <CheckItem text="AI Rewrite Engine" strong />
                    <CheckItem text="Burnout Protection" />
                    <CheckItem text="Weekly Reports" />
                 </div>

                 <Button className="w-full h-11 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold rounded-xl transition-all shadow-none">
                   Upgrade Now
                 </Button>
              </div>

               {/* Team Link */}
              <div className="mt-8 flex items-center justify-between px-1">
                <span className="text-sm text-zinc-500 font-medium">Need a team plan?</span>
                <button className="text-sm font-bold flex items-center gap-1 hover:underline decoration-2 underline-offset-4">
                  View Team Tier <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FeatureRow({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-4 w-4" })}
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}

function CheckItem({ text, strong }: { text: string, strong?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-5 w-5 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0">
        <Check className="h-3 w-3 text-white dark:text-black" strokeWidth={3} />
      </div>
      <span className={`text-sm ${strong ? "font-bold text-zinc-900 dark:text-zinc-100" : "font-medium text-zinc-600 dark:text-zinc-400"}`}>
        {text}
      </span>
    </div>
  )
}
