"use client"

/**
 * NoScheduleResults - Simple placeholder if no schedule items found (or offline).
 */
export function NoScheduleResults({ offline }) {
  if (offline) {
    return (
      <div className="text-center text-muted-foreground">
        You are offline and no cached data is available for these filters.
      </div>
    )
  }
  return (
    <div className="text-center text-muted-foreground">
      No classes found for the selected filters.
    </div>
  )
}
