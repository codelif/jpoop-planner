import * as React from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SwipeHint({ onDismiss }) {
    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-4 bg-popover/80 backdrop-blur-sm rounded-lg shadow-lg border flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ChevronLeft className="w-4 h-4 text-muted-foreground animate-pulse-x" />
            <div className="text-sm">
                Swipe to change days
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground animate-pulse-x" />
            <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={onDismiss}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}
