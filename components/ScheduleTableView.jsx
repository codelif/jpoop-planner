
"use client"

import React from "react"
import { Dialog } from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTypeBadge } from "./ScheduleCard"

// Utility to parse "HH:MM AM/PM" → hour (0-23)
function parseHour(timeStr) {
  if (!timeStr) return null
  const [time, meridiem] = timeStr.split(" ")
  let [hours] = time.split(":").map(Number)
  if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/**
 * ScheduleTableView
 * @param {Object} props
 * @param {Object} props.allDaysClasses - { Sunday: [ {start,end,subject,...}, ...], Monday: [...], ... }
 */
export function ScheduleTableView({ allDaysClasses }) {
  const [open, setOpen] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState(null)

  // 1) Gather all classes from all days, find earliest hour and latest hour.
  //    For simplicity, we only care about the *start* hour to place them in the row.
  let earliest = 24
  let latest = 0
  const dayClassMap = {} // day -> array of classes

  for (const day of DAYS) {
    const classes = allDaysClasses[day] || []
    dayClassMap[day] = classes
    classes.forEach((cls) => {
      const startHour = parseHour(cls.start)
      const endHour = parseHour(cls.end) || 0
      if (startHour !== null && startHour < earliest) earliest = startHour
      if (endHour !== null && endHour + 1 > latest) latest = endHour + 1
    })
  }

  if (earliest > latest) {
    // No classes
    earliest = 9
    latest = 17
  }

  // We'll create an array of hours from earliest..latest
  const hoursRange = []
  for (let h = earliest; h < latest; h++) {
    hoursRange.push(h)
  }

  function openModal(cls) {
    setSelectedClass(cls)
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setSelectedClass(null)
  }

  // Minimal info in the cell
  function renderCell(day, hour) {
    const classes = dayClassMap[day] || []
    // find any class that starts at 'hour'
    const matching = classes.filter((cls) => {
      const startHour = parseHour(cls.start)
      return startHour === hour
    })

    if (matching.length === 0) {
      return null
    }

    return matching.map((cls, idx) => {
      return (
        <div
          key={idx}
          onClick={() => openModal(cls)}
          className="cursor-pointer mb-1 last:mb-0 bg-accent/20 border border-muted/50 rounded-md p-1 text-xs hover:bg-accent/40 transition-colors"
        >
          <div className="font-semibold">{cls.subject}</div>
        </div>
      )
    })
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
          {hoursRange.map((hour) => (
            <tr key={hour} className="border-b border-muted hover:bg-muted/10">
              <td className="p-2 font-medium text-muted-foreground">
                {hour}:00
              </td>
              {DAYS.map((day) => (
                <td key={day} className="p-2 align-top">
                  {renderCell(day, hour)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal with full class info */}
      <Dialog open={open} onOpenChange={setOpen}>
        {selectedClass && (
          <div
            className="
              fixed inset-0 z-[9999] flex items-center justify-center
              bg-black/50 backdrop-blur-sm p-4
            "
          >
            <div className="relative w-full max-w-md bg-popover border border-muted rounded-md shadow-lg p-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-bold mb-2">{selectedClass.subject}</h2>
              <div className="text-sm text-muted-foreground mb-4">
                {selectedClass.start} - {selectedClass.end}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Type:</strong> {getTypeBadge(selectedClass.type).label}
                </div>
                <div>
                  <strong>Teacher:</strong> {selectedClass.teacher}
                </div>
                <div>
                  <strong>Batches:</strong> {selectedClass.batches.join(", ")}
                </div>
                <div>
                  <strong>Venue:</strong> {selectedClass.venue}
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
