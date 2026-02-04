"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-neutral-700 dark:data-[state=unchecked]:bg-neutral-800",
        "border data-[state=checked]:border-primary/70 data-[state=unchecked]:border-neutral-600",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_8px_rgba(0,0,0,0.45)]",
        "focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:border-ring",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-[1.1rem] w-[1.1rem] rounded-full transition-transform",
          "data-[state=checked]:translate-x-[calc(100%-3px)] data-[state=unchecked]:translate-x-[2px]",
          "bg-white dark:bg-neutral-300 data-[state=checked]:bg-primary-foreground",
          "border border-neutral-500 shadow-[0_2px_6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
