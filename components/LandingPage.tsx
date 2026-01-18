"use client"

import dynamic from "next/dynamic"
import { motion } from "framer-motion"
import {
    CalendarBlank,
    Sparkle,
    ChartLineUp,
    ShieldCheck,
    ArrowRight
} from "@phosphor-icons/react"

// Dynamic import to avoid SSR issues with Three.js
const PixelBlast = dynamic(() => import("@/components/PixelBlast"), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#08080a]" />
})

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#08080a] text-white overflow-x-hidden">
            {/* Floating Header */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-6rem)] max-w-5xl"
            >
                <nav className="flex items-center justify-between px-5 py-3 
                                bg-white/[0.03] backdrop-blur-xl rounded-2xl
                                border border-white/[0.08]
                                shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center gap-2">
                        <CalendarBlank weight="bold" className="w-4 h-4 text-white/70" />
                        <span className="text-sm font-semibold tracking-tight" style={{ fontFamily: 'var(--font-inter)' }}>
                            Calendux
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="/sign-in"
                            className="px-4 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            Sign In
                        </a>
                        <a
                            href="/sign-in"
                            className="px-4 py-1.5 text-xs font-medium text-black bg-white rounded-lg
                                       hover:bg-white/90 active:scale-[0.98] transition-all"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            Get Started
                        </a>
                    </div>
                </nav>
            </motion.header>

            {/* Main Content */}
            <main className="relative z-10">
                {/* Hero */}
                <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
                    {/* PixelBlast Background - Only on edges, not behind content */}
                    <div
                        className="absolute inset-0 z-0"
                        style={{
                            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.7) 85%, black 100%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, transparent 0%, transparent 40%, rgba(0,0,0,0.1) 55%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.7) 85%, black 100%)',
                        }}
                    >
                        <PixelBlast
                            color="#6b5a96"
                            pixelSize={4}
                            patternScale={2.5}
                            patternDensity={0.85}
                            edgeFade={0.3}
                            enableRipples={true}
                            rippleIntensityScale={1.2}
                            rippleThickness={0.12}
                            rippleSpeed={0.35}
                            speed={0.4}
                        />
                    </div>
                    <div className="max-w-3xl mx-auto text-center relative z-10">
                        {/* Main Headline - word by word */}
                        <h1 className="mb-6">
                            <span className="block text-[4.5rem] md:text-[6rem] leading-[0.95] tracking-[-0.03em] text-white"
                                style={{ fontFamily: 'var(--font-instrument)' }}>
                                <motion.span
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="inline-block"
                                >
                                    Your
                                </motion.span>
                                {" "}
                                <motion.span
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="inline-block"
                                >
                                    time,
                                </motion.span>
                            </span>
                            <span className="block text-[4.5rem] md:text-[6rem] leading-[0.95] tracking-[-0.03em]"
                                style={{ fontFamily: 'var(--font-instrument)' }}>
                                <motion.span
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="inline-block text-white/50"
                                >
                                    intelligently
                                </motion.span>
                                {" "}
                                <motion.span
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
                                    className="inline-block text-white"
                                >
                                    managed.
                                </motion.span>
                            </span>
                        </h1>

                        {/* Subtext */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                            className="text-base text-white/40 max-w-md mx-auto mb-12 leading-relaxed"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            A calendar that learns your habits and optimizes your schedule automatically.
                        </motion.p>

                        {/* CTA - optimized for conversion */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, delay: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
                            className="flex flex-col sm:flex-row items-center justify-center gap-3"
                        >
                            <a
                                href="/sign-in"
                                className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-[#08080a] bg-white rounded-lg
                                           hover:bg-gray-100 active:scale-[0.98] transition-all"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                Get started — it&apos;s free
                            </a>
                            <a
                                href="/sign-in"
                                className="w-full sm:w-auto px-8 py-3.5 text-sm font-medium text-white/60 
                                           border border-white/15 rounded-lg
                                           hover:bg-white/5 hover:text-white/80 hover:border-white/25
                                           active:scale-[0.98] transition-all"
                                style={{ fontFamily: 'var(--font-inter)' }}
                            >
                                Sign in
                            </a>
                        </motion.div>

                        {/* Trust signal */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
                            className="mt-8 text-xs text-white/25"
                            style={{ fontFamily: 'var(--font-inter)' }}
                        >
                            No credit card required
                        </motion.p>
                    </div>
                </section>

                {/* Features - WITH slanted lines */}
                <section className="relative py-32">
                    {/* Top border with margin */}
                    <div className="absolute top-0 left-20 right-20 h-px bg-white/[0.06]" />
                    {/* Left slanted lines */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none opacity-[0.06]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                 -55deg,
                                 transparent,
                                 transparent 8px,
                                 white 8px,
                                 white 9px
                             )`,
                        }}
                    />
                    {/* Right slanted lines */}
                    <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none opacity-[0.06]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                 55deg,
                                 transparent,
                                 transparent 8px,
                                 white 8px,
                                 white 9px
                             )`,
                        }}
                    />

                    <div className="mx-20 relative z-10">
                        <div className="text-center mb-20">
                            <p className="text-[11px] uppercase tracking-[0.3em] text-white/25 mb-5"
                                style={{ fontFamily: 'var(--font-inter)' }}>
                                Features
                            </p>
                            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-instrument)' }}>
                                Everything you need
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6 mx-auto
                                                border border-white/[0.06]">
                                    <Sparkle weight="regular" className="w-6 h-6 text-white/50" />
                                </div>
                                <h3 className="text-xl mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
                                    AI Optimization
                                </h3>
                                <p className="text-sm text-white/35 leading-relaxed max-w-xs mx-auto"
                                    style={{ fontFamily: 'var(--font-inter)' }}>
                                    Automatically reschedule tasks based on your energy levels and priorities.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6 mx-auto
                                                border border-white/[0.06]">
                                    <ChartLineUp weight="regular" className="w-6 h-6 text-white/50" />
                                </div>
                                <h3 className="text-xl mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Smart Insights
                                </h3>
                                <p className="text-sm text-white/35 leading-relaxed max-w-xs mx-auto"
                                    style={{ fontFamily: 'var(--font-inter)' }}>
                                    See exactly where your time goes with actionable analytics.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-6 mx-auto
                                                border border-white/[0.06]">
                                    <ShieldCheck weight="regular" className="w-6 h-6 text-white/50" />
                                </div>
                                <h3 className="text-xl mb-3" style={{ fontFamily: 'var(--font-inter)' }}>
                                    Burnout Prevention
                                </h3>
                                <p className="text-sm text-white/35 leading-relaxed max-w-xs mx-auto"
                                    style={{ fontFamily: 'var(--font-inter)' }}>
                                    Get alerts when your schedule is overloaded before it&apos;s too late.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats - WITH slanted lines */}
                <section className="relative py-24">
                    {/* Top border with margin */}
                    <div className="absolute top-0 left-20 right-20 h-px bg-white/[0.06]" />
                    {/* Left slanted lines */}
                    <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none opacity-[0.06]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                 -55deg,
                                 transparent,
                                 transparent 8px,
                                 white 8px,
                                 white 9px
                             )`,
                        }}
                    />
                    {/* Right slanted lines */}
                    <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none opacity-[0.06]"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                                 55deg,
                                 transparent,
                                 transparent 8px,
                                 white 8px,
                                 white 9px
                             )`,
                        }}
                    />

                    <div className="mx-20 relative z-10">
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-16">
                                <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'var(--font-instrument)' }}>
                                    Work smarter, <em className="text-white/50">not harder</em>
                                </h2>
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                <div className="text-center py-8 border border-white/[0.06] rounded-2xl bg-white/[0.02]">
                                    <div className="text-5xl font-light mb-2" style={{ fontFamily: 'var(--font-instrument)' }}>2×</div>
                                    <div className="text-xs text-white/30 uppercase tracking-wider"
                                        style={{ fontFamily: 'var(--font-inter)' }}>Focus time</div>
                                </div>
                                <div className="text-center py-8 border border-white/[0.06] rounded-2xl bg-white/[0.02]">
                                    <div className="text-5xl font-light mb-2" style={{ fontFamily: 'var(--font-instrument)' }}>45%</div>
                                    <div className="text-xs text-white/30 uppercase tracking-wider"
                                        style={{ fontFamily: 'var(--font-inter)' }}>Less switching</div>
                                </div>
                                <div className="text-center py-8 border border-white/[0.06] rounded-2xl bg-white/[0.02]">
                                    <div className="text-5xl font-light mb-2" style={{ fontFamily: 'var(--font-instrument)' }}>3h</div>
                                    <div className="text-xs text-white/30 uppercase tracking-wider"
                                        style={{ fontFamily: 'var(--font-inter)' }}>Saved weekly</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 border-t border-white/[0.06] text-center mx-20">
                    <h2 className="text-4xl md:text-6xl mb-6" style={{ fontFamily: 'var(--font-instrument)' }}>
                        Ready to start?
                    </h2>
                    <p className="text-[15px] text-white/35 mb-10 max-w-md mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>
                        Join thousands who&apos;ve transformed their productivity.
                    </p>
                    <a
                        href="/sign-in"
                        className="inline-flex px-6 py-3 text-[13px] font-medium text-black bg-white rounded-lg
                                   hover:bg-white/90 active:scale-[0.98] transition-all"
                        style={{ fontFamily: 'var(--font-inter)' }}
                    >
                        Get started free
                    </a>
                </section>

                {/* Footer */}
                <footer className="py-8 border-t border-white/[0.06] flex items-center justify-between mx-20">
                    <span className="text-xs text-white/20" style={{ fontFamily: 'var(--font-inter)' }}>
                        © 2026 Calendux
                    </span>
                    <div className="flex items-center gap-6">
                        <a href="/sign-in" className="text-xs text-white/20 hover:text-white/50 transition-colors"
                            style={{ fontFamily: 'var(--font-inter)' }}>Sign In</a>
                        <a href="/sign-in" className="text-xs text-white/20 hover:text-white/50 transition-colors"
                            style={{ fontFamily: 'var(--font-inter)' }}>Sign Up</a>
                    </div>
                </footer>
            </main>
        </div>
    )
}
