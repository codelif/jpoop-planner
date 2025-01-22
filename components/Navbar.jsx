import { SettingsModal } from "@/components/SettingsModal"

export function Navbar({ showTimeline, onToggleTimeline }) {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-6">
          <div className="flex gap-2 items-end">
            <h1 className="text-2xl font-bold">JIIT</h1>
            <h1 className="text-lg font-normal">Planner</h1>
          </div>
        </div>

        {/* Only a button that opens the Settings Modal */}
        <div className="flex items-center gap-4">
          <SettingsModal
            showTimeline={showTimeline}
            onToggleTimeline={onToggleTimeline}
          />
        </div>
      </div>
    </header>
  )
}
