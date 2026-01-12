"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log to error reporting service in production

    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
            <div className="flex flex-col items-center max-w-md text-center space-y-6">
                <div className="rounded-full bg-destructive/10 p-4">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                    <p className="text-muted-foreground">
                        We encountered an unexpected error. Please try again or contact support if the problem persists.
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button onClick={reset} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Try again
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = "/"}>
                        Go home
                    </Button>
                </div>

                {error.digest && (
                    <p className="text-xs text-muted-foreground">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    )
}
