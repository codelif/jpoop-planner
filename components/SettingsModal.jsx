"use client"

import React from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Button } from "@/components/ui/button"
import { X, Settings } from "lucide-react"
import { useTheme } from "next-themes"
import * as SwitchPrimitive from "@radix-ui/react-switch"

export function SettingsModal({
  showTimeline,
  onToggleTimeline,
  tableMode,
  onToggleTableMode,
}) {
  const [open, setOpen] = React.useState(false)

  // Dark Mode integration
  const { theme, setTheme } = useTheme()

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay with high z-index */}
        <Dialog.Overlay
          className="
            fixed inset-0
            bg-black/50 backdrop-blur-sm
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            z-[9999]
          "
        />
        {/* Modal Content */}
        <Dialog.Content
          className="
            fixed top-1/2 left-1/2 w-full max-w-md
            -translate-x-1/2 -translate-y-1/2
            rounded-md border bg-popover p-6 shadow-lg
            focus:outline-none
            data-[state=open]:animate-in
            data-[state=closed]:animate-out
            z-[9999]
          "
        >
          <Dialog.Title className="text-lg font-bold mb-4">Settings</Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mb-4">
            Customize your JIIT Planner experience
          </Dialog.Description>

          {/* THEME TOGGLE */}
          <div className="mb-6 space-y-1">
            <label className="text-sm font-medium block">Theme</label>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
              >
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
              >
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                onClick={() => setTheme("system")}
              >
                System
              </Button>
            </div>
          </div>

          {/* SHOW TIMELINE SWITCH */}
          <div className="flex items-center justify-between mb-6">
            <label className="text-sm font-medium" htmlFor="timelineSwitch">
              Show Timeline
            </label>
            <SwitchPrimitive.Root
              id="timelineSwitch"
              checked={showTimeline}
              onCheckedChange={onToggleTimeline}
              className="
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent
                bg-input transition-colors
                data-[state=checked]:bg-primary
                focus:outline-none focus-visible:ring-2
                focus-visible:ring-ring focus-visible:ring-offset-2
              "
            >
              <SwitchPrimitive.Thumb
                className="
                  pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform
                  data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0
                "
              />
            </SwitchPrimitive.Root>
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="text-sm font-medium" htmlFor="tableModeSwitch">
              Compact Mode (BETA)
            </label>
            <SwitchPrimitive.Root
              id="tableModeSwitch"
              checked={tableMode}
              onCheckedChange={onToggleTableMode}
              className="
                relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent
                bg-input transition-colors
                data-[state=checked]:bg-primary
                focus:outline-none focus-visible:ring-2
                focus-visible:ring-ring focus-visible:ring-offset-2
              "
            >
              <SwitchPrimitive.Thumb
                className="
                  pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform
                  data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0
                "
              />
            </SwitchPrimitive.Root>
          </div>

          {/* Close Button (X) */}
          <Dialog.Close asChild>
            <Button variant="secondary" className="absolute top-4 right-4 rounded-full h-8 w-8 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

