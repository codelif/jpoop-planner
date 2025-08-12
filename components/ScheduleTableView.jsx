
"use client"

import React from "react"
import { Dialog } from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTypeBadge } from "./ScheduleCard"

function parseHour(timeStr) {
  if (!timeStr) return null
  const [time, meridiem] = timeStr.split(" ")
  let [hours] = time.split(":").map(Number)
  if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours
}
// ...removed minute/rowSpan logic for simplified view...
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function ScheduleTableView({ allDaysClasses }) {
  const [open, setOpen] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState(null)
  let earliest = 24
  let latest = 0
  const dayClassMap = {}
  for (const day of DAYS) {
    const classes = allDaysClasses[day] || []
    dayClassMap[day] = classes
    classes.forEach(cls => {
      const s = parseHour(cls.start)
      const e = parseHour(cls.end)
      if (s != null && s < earliest) earliest = s
      if (e != null && e > latest) latest = e
    })
  }
  if (earliest === 24) earliest = 9
  const endBoundary = latest
  const hoursRange = []
  for (let h = earliest; h < endBoundary; h++) hoursRange.push(h)
  function openModal(cls) { setSelectedClass(cls); setOpen(true) }
  function closeModal() { setOpen(false); setSelectedClass(null) }
  function renderCell(day, hour) {
    const list = dayClassMap[day] || []
    const matches = list.filter(c => parseHour(c.start) === hour)
    if (!matches.length) return null
    return matches.map((cls, i) => (
      <div
        key={i}
        onClick={() => openModal(cls)}
        className="inline-block cursor-pointer mb-1 last:mb-0 bg-card border border-border rounded px-2 py-1 text-[10px] font-semibold hover:bg-muted transition-colors break-words max-w-[150px] leading-tight text-card-foreground"
        style={{ letterSpacing: '-0.25px' }}
      >
        {cls.subject}
      </div>
    ))
  }

  return (
    <div className="w-full overflow-auto border rounded-md bg-background/70 relative">
      <table className="w-full border-collapse text-sm min-w-[600px]">
        <thead>
          <tr className="bg-muted/30 sticky top-0 z-10">
            <th className="p-2 border-b border-muted text-left" style={{ minWidth: 60 }}>
              Time
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="p-2 border-b border-muted text-left"
                style={{ minWidth: 100 }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hoursRange.map(hour => (
            <tr key={hour} className="border-b border-muted hover:bg-muted/10 align-top">
              <td className="p-2 font-medium text-muted-foreground align-top">{hour}:00</td>
              {DAYS.map(day => (
                <td key={day} className="p-2 align-top">{renderCell(day, hour)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal with full class info */}
      <Dialog open={open} onOpenChange={setOpen}>
        {selectedClass && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-popover border border-muted rounded-md shadow-lg p-6">
              <Button variant="ghost" size="icon" onClick={closeModal} className="absolute top-2 right-2">
                <X className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold mb-2">{selectedClass.subject}</h2>
              <div className="text-sm text-muted-foreground mb-4">{selectedClass.start} - {selectedClass.end}</div>
              <div className="space-y-2 text-sm">
                <div><strong>Type:</strong> {getTypeBadge(selectedClass.type).label}</div>
                <div><strong>Teacher:</strong> {selectedClass.teacher}</div>
                <div><strong>Batches:</strong> {selectedClass.batches.join(", ")}</div>
                <div><strong>Venue:</strong> {selectedClass.venue}</div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
