"use client"

import React from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function UpdateIndicator({ status }) {
  // No status => no indicator
  if (!status) return null

  let content = null
  // You can define more states as needed:
  // "checking-metadata", "updating-metadata", "checking-classes", "updating-classes", etc.
  if (status.startsWith("checking")) {
    content = (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking for updates...</span>
      </>
    )
  } else if (status.startsWith("updating")) {
    content = (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Updating data...</span>
      </>
    )
  } else if (status === "") {
    return null
  } else if (status.startsWith("error")) {
    content = (
      <>
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-red-500">Error updating data</span>
      </>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm rounded-md border bg-background shadow-md">
      {content}
    </div>
  )
}
