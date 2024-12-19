"use client"

import React, { useEffect, useRef, useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const LOOPED_DAYS = [...DAYS, ...DAYS, ...DAYS]

const BATCHES = ["Batch A", "Batch B", "Batch C"]
const COURSES = ["Course 101", "Course 202", "Course 303"]

export default function OptionsPanel() {
  const [dayIndex, setDayIndex] = useState(0)
  const [batch, setBatch] = useState(BATCHES[0])
  const [showMore, setShowMore] = useState(false) // controls expanding for course selection
  const [course, setCourse] = useState(COURSES[0])

  const scrollContainerRef = useRef(null)

  // Load preferences
  useEffect(() => {
    const savedDay = localStorage.getItem("selectedDay")
    const savedBatch = localStorage.getItem("selectedBatch")
    const savedCourse = localStorage.getItem("selectedCourse")
    const savedShowMore = localStorage.getItem("showMore")

    if (savedDay && DAYS.includes(savedDay)) {
      setDayIndex(DAYS.indexOf(savedDay))
    }
    if (savedBatch && BATCHES.includes(savedBatch)) {
      setBatch(savedBatch)
    }
    if (savedCourse && COURSES.includes(savedCourse)) {
      setCourse(savedCourse)
    }
    if (savedShowMore) {
      setShowMore(savedShowMore === "true")
    }
  }, [])

  // Save preferences
  useEffect(() => {
    localStorage.setItem("selectedDay", DAYS[dayIndex % DAYS.length])
  }, [dayIndex])
  useEffect(() => {
    localStorage.setItem("selectedBatch", batch)
  }, [batch])
  useEffect(() => {
    localStorage.setItem("selectedCourse", course)
  }, [course])
  useEffect(() => {
    localStorage.setItem("showMore", showMore.toString())
  }, [showMore])

  // On mount, scroll to center day
  useEffect(() => {
    if (scrollContainerRef.current) {
      const centerIndex = DAYS.length + dayIndex
      scrollToIndex(centerIndex, false)
    }
  }, [scrollContainerRef, dayIndex])

  function scrollToIndex(index, smooth = true) {
    const container = scrollContainerRef.current
    if (container) {
      const totalItems = LOOPED_DAYS.length
      const itemHeight = container.scrollHeight / totalItems
      const centerScroll = (index + 0.5) * itemHeight - container.clientHeight / 2
      container.scrollTo({ top: centerScroll, behavior: smooth ? "smooth" : "auto" })
    }
  }

  function shiftDay(delta) {
    const newIndex = (dayIndex + delta + DAYS.length) % DAYS.length
    setDayIndex(newIndex)
    const centerIndex = DAYS.length + newIndex
    scrollToIndex(centerIndex)
  }

  return (
    <div className="border-b border-muted bg-gradient-to-b from-background to-accent/10 px-4 py-6 max-w-sm mx-auto mt-8 rounded-md shadow-sm space-y-6">
      {/* Day Selector (Vertical) */}
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-lg font-semibold">Select Day</h2>
        <div className="flex flex-col items-center gap-2 relative">
          <button
            className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            onClick={() => shiftDay(-1)}
          >
            <ChevronUp className="h-5 w-5" />
          </button>

          <div className="relative h-48 w-full max-w-[150px] overflow-y-scroll no-scrollbar">
            <div
              ref={scrollContainerRef}
              className="flex flex-col items-center gap-6 py-8 no-scrollbar"
              style={{ scrollSnapType: "y mandatory" }}
            >
              {LOOPED_DAYS.map((d, i) => {
                const actualDay = DAYS.indexOf(d) % DAYS.length
                const isSelected = actualDay === dayIndex
                return (
                  <div
                    key={i}
                    className={`scrollSnapAlign-center text-base font-medium ${
                      isSelected ? "text-foreground font-bold" : "text-muted-foreground"
                    }`}
                    style={{ scrollSnapAlign: "center" }}
                  >
                    {d}
                  </div>
                )
              })}
            </div>
            {/* Center line indicator */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 w-2 h-8 bg-primary rounded-full" />
          </div>

          <button
            className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors"
            onClick={() => shiftDay(1)}
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Selected: <span className="font-semibold text-foreground">{DAYS[dayIndex]}</span>
        </p>
      </div>

      {/* Batch Selection */}
      <div className="space-y-2">
        <h3 className="text-md font-semibold">Select Batch</h3>
        <div className="relative">
          <select
            className="border border-muted rounded-md p-2 bg-background text-foreground w-full appearance-none pr-8"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          >
            {BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
            ▼
          </div>
        </div>
      </div>

      {/* Show More Bar */}
      <div>
        <button
          onClick={() => setShowMore(!showMore)}
          className="w-full text-sm font-medium text-primary hover:underline flex items-center justify-center gap-1"
        >
          {showMore ? "Show Less" : "Show More"}
        </button>
      </div>

      {/* Course Selection (Shown on Show More) */}
      {showMore && (
        <div className="space-y-2 mt-4">
          <h3 className="text-md font-semibold">Select Course</h3>
          <div className="relative">
            <select
              className="border border-muted rounded-md p-2 bg-background text-foreground w-full appearance-none pr-8"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
              ▼
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
