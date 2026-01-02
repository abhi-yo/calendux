import { Button } from "@/components/ui/button"
import { Calendar, Home } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
            <div className="flex flex-col items-center max-w-md text-center space-y-6">
                <div className="rounded-full bg-muted p-4">
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-6xl font-bold tracking-tighter text-foreground">404</h1>
                    <h2 className="text-xl font-semibold">Page not found</h2>
                    <p className="text-muted-foreground">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <Link href="/">
                    <Button className="gap-2">
                        <Home className="h-4 w-4" />
                        Back to Calendar
                    </Button>
                </Link>
            </div>
        </div>
    )
}
