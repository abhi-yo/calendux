"use client"

import { Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { KEYBOARD_SHORTCUTS } from "@/hooks/useKeyboardShortcuts"

export function KeyboardShortcutsHelp() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Keyboard shortcuts">
                    <Keyboard className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Keyboard Shortcuts</h4>
                    <div className="space-y-1.5">
                        {KEYBOARD_SHORTCUTS.map((shortcut) => (
                            <div
                                key={shortcut.key}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="text-muted-foreground">{shortcut.description}</span>
                                <kbd className="px-2 py-0.5 text-xs font-mono bg-muted rounded border border-border">
                                    {shortcut.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
