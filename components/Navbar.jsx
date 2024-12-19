import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"


export function Navbar() {
  return <header className="border-b bg-background sticky top-0 z-50">
    <div className="container mx-auto flex items-center justify-between py-4 px-6">
      <div className="flex items-center gap-6">
        <div className='flex gap-2 items-end'>
          <h1 className="text-2xl font-bold">JIIT </h1>
          <h1 className="text-lg font-normal">Planner</h1>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <a href="https://github.com/codelif/jpoop-planner" target="_blank" rel="noopener noreferrer">
            <Github className="h-5 w-5" />
          </a>
        </Button>
        <ThemeToggle />
      </div>
    </div>
  </header>
}