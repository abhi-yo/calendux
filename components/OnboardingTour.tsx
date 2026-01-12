"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, ChevronLeft, Sparkles, Zap, Calendar, PanelRightOpen, MousePointerClick, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TourStep {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    gradient: string
}

const TOUR_STEPS: TourStep[] = [
    {
        id: "welcome",
        title: "Welcome to Calendux!",
        description: "Your AI-powered intelligent calendar that helps you optimize your schedule and prevent burnout. Let's take a quick tour!",
        icon: <Calendar className="h-10 w-10" />,
        gradient: "from-violet-500 to-purple-600",
    },
    {
        id: "create-event",
        title: "Create Events Easily",
        description: "Click on any time slot to create a new event, or use the 'New Event' button in the header. You can also press 'N' as a keyboard shortcut!",
        icon: <MousePointerClick className="h-10 w-10" />,
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        id: "ai-optimize",
        title: "AI Schedule Optimizer",
        description: "Let AI analyze your week and suggest optimal event placements to balance your energy and prevent overload. Click 'AI Optimize' to try it!",
        icon: <Sparkles className="h-10 w-10" />,
        gradient: "from-amber-500 to-orange-500",
    },
    {
        id: "energy-insights",
        title: "Energy Insights Panel",
        description: "Open the Insights panel to see your daily energy distribution, burnout warnings, and smart suggestions for rescheduling events.",
        icon: <PanelRightOpen className="h-10 w-10" />,
        gradient: "from-emerald-500 to-teal-500",
    },
    {
        id: "event-types",
        title: "Event Types & Energy",
        description: "Each event has an energy cost (1-5). Meetings, Focus blocks, Habits, and Breaks all affect your daily load differently. Balance them wisely!",
        icon: <Zap className="h-10 w-10" />,
        gradient: "from-rose-500 to-pink-500",
    },
    {
        id: "shortcuts",
        title: "Keyboard Shortcuts",
        description: "Power user tips: Press 'N' for new event, 'T' for today, '←/→' for week navigation, and 'Esc' to close dialogs. Work faster!",
        icon: <Keyboard className="h-10 w-10" />,
        gradient: "from-indigo-500 to-violet-500",
    },
]

const ONBOARDING_KEY = "calendux-onboarding-completed"

export function OnboardingTour() {
    const [isOpen, setIsOpen] = React.useState(false)
    const [currentStep, setCurrentStep] = React.useState(0)
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        // Check if user has completed onboarding (from database via API)
        const checkOnboardingStatus = async () => {
            try {
                const res = await fetch("/api/user")
                if (res.ok) {
                    const user = await res.json()
                    const preferences = user.preferences || {}
                    const hasCompletedOnboarding = preferences.onboardingCompleted === true

                    // Only show if not completed AND timezone is already set (not UTC)
                    // This prevents overlap with TimezoneOnboarding
                    if (!hasCompletedOnboarding && user.timezone !== "UTC") {
                        // Small delay to let the UI render first
                        setTimeout(() => setIsOpen(true), 800)
                    } else if (!hasCompletedOnboarding && user.timezone === "UTC") {
                        // If timezone is still UTC, delay more to let timezone dialog go first
                        // Or wait for timezone to be set
                        const checkAgain = setInterval(async () => {
                            const res2 = await fetch("/api/user")
                            if (res2.ok) {
                                const user2 = await res2.json()
                                if (user2.timezone !== "UTC") {
                                    clearInterval(checkAgain)
                                    setTimeout(() => setIsOpen(true), 500)
                                }
                            }
                        }, 2000)

                        // Stop checking after 30 seconds
                        setTimeout(() => clearInterval(checkAgain), 30000)
                    }
                }
            } catch (error) {

                // Fallback to localStorage
                const completed = localStorage.getItem(ONBOARDING_KEY)
                if (!completed) {
                    setTimeout(() => setIsOpen(true), 1500)
                }
            } finally {
                setIsLoading(false)
            }
        }

        checkOnboardingStatus()
    }, [])

    const saveOnboardingCompletion = async () => {
        try {
            // Save to database
            await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onboardingCompleted: true })
            })
        } catch (error) {

        }
        // Also save to localStorage as fallback
        localStorage.setItem(ONBOARDING_KEY, "true")
    }

    const handleComplete = () => {
        saveOnboardingCompletion()
        setIsOpen(false)
    }

    const handleSkip = () => {
        saveOnboardingCompletion()
        setIsOpen(false)
    }

    const nextStep = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleComplete()
        }
    }

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const step = TOUR_STEPS[currentStep]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Dark Overlay - No blur, just semi-transparent */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/70 z-[200]"
                        onClick={handleSkip}
                    />

                    {/* Centered Tour Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 350 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md"
                        >
                            <div className="bg-card border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                                {/* Gradient Header */}
                                <div className={`bg-gradient-to-br ${step.gradient} p-8 relative overflow-hidden`}>
                                    {/* Decorative circles */}
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full" />
                                    <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full" />

                                    {/* Close button */}
                                    <button
                                        onClick={handleSkip}
                                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    {/* Icon */}
                                    <motion.div
                                        key={`icon-${step.id}`}
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", damping: 15, delay: 0.1 }}
                                        className="relative z-10 w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg"
                                    >
                                        {step.icon}
                                    </motion.div>

                                    {/* Step indicator */}
                                    <div className="absolute bottom-4 right-4 text-white/60 text-sm font-medium">
                                        {currentStep + 1} / {TOUR_STEPS.length}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <motion.h3
                                        key={`title-${step.id}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: 0.1 }}
                                        className="text-xl font-bold mb-3"
                                    >
                                        {step.title}
                                    </motion.h3>
                                    <motion.p
                                        key={`desc-${step.id}`}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: 0.15 }}
                                        className="text-muted-foreground leading-relaxed"
                                    >
                                        {step.description}
                                    </motion.p>
                                </div>

                                {/* Footer */}
                                <div className="px-6 pb-6 flex items-center justify-between">
                                    {/* Step dots */}
                                    <div className="flex gap-2">
                                        {TOUR_STEPS.map((_, i) => (
                                            <motion.button
                                                key={i}
                                                onClick={() => setCurrentStep(i)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                className={`h-2 rounded-full transition-all duration-300 ${i === currentStep
                                                    ? `w-8 bg-gradient-to-r ${step.gradient}`
                                                    : i < currentStep
                                                        ? "w-2 bg-primary/50"
                                                        : "w-2 bg-muted-foreground/30"
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    {/* Navigation buttons */}
                                    <div className="flex gap-2">
                                        {currentStep > 0 && (
                                            <Button variant="ghost" size="sm" onClick={prevStep} className="gap-1">
                                                <ChevronLeft className="h-4 w-4" />
                                                Back
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={nextStep}
                                            className={`gap-1 bg-gradient-to-r ${step.gradient} border-0 text-white hover:opacity-90`}
                                        >
                                            {currentStep === TOUR_STEPS.length - 1 ? (
                                                "Get Started"
                                            ) : (
                                                <>
                                                    Next
                                                    <ChevronRight className="h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Skip text */}
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={handleSkip}
                                className="w-full text-center mt-4 text-white/60 hover:text-white/80 text-sm transition-colors"
                            >
                                Skip tutorial
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// Hook to reset the tour (useful for testing or settings page)
export function useResetOnboarding() {
    return async () => {
        // Clear localStorage
        localStorage.removeItem(ONBOARDING_KEY)

        // Clear database setting
        try {
            await fetch("/api/user", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onboardingCompleted: false })
            })
        } catch (error) {

        }

        window.location.reload()
    }
}
