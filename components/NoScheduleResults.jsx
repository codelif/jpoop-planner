"use client"

/**
 * NoScheduleResults - Simple placeholder if no schedule items found (or offline).
 */
export function NoScheduleResults({ text }) {
  return (
    <div className="text-center text-muted-foreground">
      {text}
    </div>
  )
}
