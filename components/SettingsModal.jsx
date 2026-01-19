"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { X, Settings, ArrowLeftRight } from "lucide-react";
import { useTheme } from "next-themes";
import * as SwitchPrimitive from "@radix-ui/react-switch";

// ——— Reusable bits ———
function SettingSwitch({ id, label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
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
  );
}

function ThemeButtons() {
  const { theme, setTheme } = useTheme();
  const options = ["light", "dark", "system"];

  return (
    <div className="mb-6 space-y-1">
      <label className="text-sm font-medium block">Theme</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <Button
            key={opt}
            variant={theme === opt ? "default" : "outline"}
            onClick={() => setTheme(opt)}
          >
            {opt[0].toUpperCase() + opt.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ——— Main component ———
export function SettingsModal({
  showTimeline,
  onToggleTimeline,
  tableMode,
  onToggleTableMode,
  scrollSwitch,
  onScrollSwitch,
  showBreaks,
  onToggleBreaks,
  onOpenComparison,
}) {
  const [open, setOpen] = React.useState(false);
  const [appVersion, setAppVersion] = React.useState(null);
  const [cacheVersion, setCacheVersion] = React.useState(null);

  React.useEffect(() => {
    const raw = localStorage.getItem("app-version");
    if (!raw) return;

    const match = raw.match(/v(\d{4}\.\d{2}\.\d{2})_(\d{2})\.(\d{2})\.(\d{2})/);
    if (!match) {
      setAppVersion(raw);
      return;
    }

    const [, date, hh, mm, ss] = match;
    setAppVersion(`App Version: ${date} • ${hh}:${mm}:${ss}`);
  }, []);

  React.useEffect(() => {
    const raw = JSON.parse(localStorage.getItem("metadata"))["cacheVersion"];
    if (!raw) return;

    const match = raw.match(
      /v(\d{4}\.\d{2}\.\d{2})\.(\d{2})\.(\d{2})\.(\d{2})/,
    );
    if (!match) {
      setCacheVersion(raw);
      return;
    }

    const [, date, hh, mm, ss] = match;
    setCacheVersion(`Time Table Version: ${date} • ${hh}:${mm}:${ss}`);
  }, []);

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
          <Dialog.Title className="text-lg font-bold mb-4">
            Settings
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mb-4">
            Customize your JIIT Planner experience
          </Dialog.Description>

          {/* THEME TOGGLE */}
          <ThemeButtons />

          {/* TIMETABLE COMPARISON BUTTON */}
          <div className="mb-6">
            <label className="text-sm font-medium block mb-2">Tools</label>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                onOpenComparison?.();
              }}
              className="w-full justify-start"
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Compare Timetables
            </Button>
          </div>

          {/* SWITCHES */}
          <SettingSwitch
            id="timelineSwitch"
            label="Show Timeline"
            checked={showTimeline}
            onChange={onToggleTimeline}
          />
          <SettingSwitch
            id="breaksSwitch"
            label="Show Breaks"
            checked={showBreaks}
            onChange={onToggleBreaks}
          />
          <SettingSwitch
            id="scrollSwitch"
            label="Natural Scroll"
            checked={scrollSwitch}
            onChange={onScrollSwitch}
          />
          <SettingSwitch
            id="tableModeSwitch"
            label="Compact Mode (BETA)"
            checked={tableMode}
            onChange={onToggleTableMode}
          />

          {/* Close Button (X) */}
          <Dialog.Close asChild>
            <Button
              variant="secondary"
              className="absolute top-4 right-4 rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </Dialog.Close>

          {appVersion && (
            <div className="mt-6 text-center text-xs text-muted-foreground select-none">
              {appVersion}
            </div>
          )}

          {cacheVersion && (
            <div className="mt-1 text-center text-xs text-muted-foreground select-none">
              {cacheVersion}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
