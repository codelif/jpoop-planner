"use client"

import React from "react"
import { Dialog } from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTypeBadge } from "./ScheduleCard"

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null
  const [time, meridiem] = timeStr.split(" ")
  let [hours, minutes = 0] = time.split(":").map(Number)
  if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

function getRowSpan(startStr, endStr) {
  const startMins = parseTimeToMinutes(startStr)
  const endMins = parseTimeToMinutes(endStr)
  if (startMins === null || endMins === null) return 1
  // Calculate exact duration in hours, don't round up
  const durationHours = (endMins - startMins) / 60
  return durationHours
}

function parseHour(timeStr) {
  if (!timeStr) return null
  const [time, meridiem] = timeStr.split(" ")
  let [hours, minutes = 0] = time.split(":").map(Number)
  if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours + (minutes / 60)
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function ScheduleTableView({ allDaysClasses }) {
  const [open, setOpen] = React.useState(false)
  const [selectedClass, setSelectedClass] = React.useState(null)

  let earliest = 24
  let latest = 0
  const dayClassMap = {}

  for (const day of DAYS) {
    const classes = allDaysClasses[day] || []
    dayClassMap[day] = classes
    classes.forEach((cls) => {
      const startHour = Math.floor(parseHour(cls.start))
      const endHour = Math.ceil(parseHour(cls.end))
      if (startHour !== null && startHour < earliest) earliest = startHour
      if (endHour !== null && endHour > latest) latest = endHour
    })
  }

  if (earliest > latest) {
    earliest = 9
    latest = 17
  }

  const hoursRange = []
  for (let h = earliest; h <= latest; h++) {
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

  function renderCell(day, hour) {
    const classes = dayClassMap[day] || []
    const startingClasses = classes.filter((cls) => {
      const startHour = parseHour(cls.start)
      return Math.floor(startHour) === hour
    })
    
    const hasOngoingClass = classes.some((cls) => {
      const startHour = parseHour(cls.start)
      const endHour = parseHour(cls.end)
      return startHour < hour && endHour > hour
    })
    
    if (hasOngoingClass) {
      return null
    }

    return startingClasses.map((cls, idx) => {
      const rowSpan = getRowSpan(cls.start, cls.end)
      const startHour = parseHour(cls.start)
      const startOffset = (startHour - Math.floor(startHour)) * 100
      const isMultiHour = rowSpan > 0
      
      return (
        <div
          key={idx}
          onClick={() => openModal(cls)}
          className={`
            cursor-pointer bg-accent/20 border border-muted/50 rounded-sm p-1
            hover:bg-accent/40 transition-colors
            ${isMultiHour ? 'absolute inset-x-1' : 'h-full'}
          `}
          style={{
            ...(isMultiHour && {
              top: `${startOffset}%`,
              height: `${rowSpan * 100}%`,
              zIndex: 10
            })
          }}
        >
          <div className="font-semibold text-xs leading-tight">{cls.subject}</div>
          <div className="text-muted-foreground text-[10px] leading-tight">
            {cls.start} - {cls.end}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="w-full overflow-auto border rounded-md bg-background/70 relative">
      <table className="w-full border-collapse text-xs min-w-[800px]">
        <thead>
          <tr className="bg-muted/30 sticky top-0 z-20">
            <th className="px-2 py-1 border-r border-muted text-left font-medium" style={{ width: '60px' }}>
              Time
            </th>
            {DAYS.map((day, index) => (
              <th
                key={day}
                className={`
                  px-2 py-1 text-left font-medium
                  ${index < DAYS.length - 1 ? 'border-r border-muted' : ''}
                `}
                style={{ width: '1fr' }}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hoursRange.map((hour) => (
            <tr key={hour}>
              <td className="px-2 py-1 font-medium text-muted-foreground whitespace-nowrap border-r border-muted">
                {hour}:00
              </td>
              {DAYS.map((day, index) => (
                <td 
                  key={day} 
                  className={`
                    px-1 py-1 relative
                    ${index < DAYS.length - 1 ? 'border-r border-muted' : ''}
                  `}
                  style={{ height: '3.5rem' }}
                >
                  {renderCell(day, hour)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

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
