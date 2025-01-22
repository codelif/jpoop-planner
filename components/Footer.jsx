import { Github } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto py-4 px-6 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Made with <span className="text-red-500 mx-1">💩</span> by JPoop™
        </div>
        <div>
          <a
            href="https://github.com/codelif/jpoop-planner"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Github className="h-5 w-5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
