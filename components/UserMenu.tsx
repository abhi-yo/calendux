"use client"

import * as React from "react"
import { signOut, useSession } from "next-auth/react"
import { LogOut, User, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link"

export function UserMenu() {
    const { data: session } = useSession()
    const [open, setOpen] = React.useState(false)

    if (!session?.user) {
        return null
    }

    const initials = session.user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-full"
                >
                    {session.user.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
                        />
                    ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {initials}
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
                {/* User info */}
                <div className="flex items-center gap-3 p-3 border-b border-border mb-2">
                    {session.user.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {initials}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {session.user.name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {session.user.email}
                        </p>
                    </div>
                </div>

                {/* Menu items */}
                <div className="space-y-1">
                    <Link href="/settings" onClick={() => setOpen(false)}>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 h-9"
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </Button>
                    </Link>

                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 h-9 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => signOut({ callbackUrl: "/sign-in" })}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
