"use client"

import { Button } from "@/components/ui/button"
import { AlertOctagon, RefreshCw } from "lucide-react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en">
            <body className="antialiased">
                <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white px-4">
                    <div className="flex flex-col items-center max-w-md text-center space-y-6">
                        <div className="rounded-full bg-red-500/20 p-4">
                            <AlertOctagon className="h-12 w-12 text-red-500" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Critical Error</h1>
                            <p className="text-zinc-400">
                                Something went seriously wrong. We're sorry for the inconvenience.
                            </p>
                        </div>

                        <Button
                            onClick={reset}
                            className="gap-2 bg-white text-black hover:bg-zinc-200"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reload Application
                        </Button>

                        {error.digest && (
                            <p className="text-xs text-zinc-600">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                </div>
            </body>
        </html>
    )
}
