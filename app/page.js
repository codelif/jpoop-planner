"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSchedule } from "@/app/hooks/useSchedule"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Timeline } from "@/components/Timeline"
import { ScheduleCard } from "@/components/ScheduleCard"
import { BreaksSection } from "@/components/BreaksSection"
import { SwipeHint } from "@/components/SwipeHint"
import { UpdateIndicator } from "@/components/UpdateIndicator"
import { ScheduleFilters } from "@/components/ScheduleFilters"
import { ScheduleSkeleton } from "@/components/ScheduleSkeleton"
import { NoScheduleResults } from "@/components/NoScheduleResults"
import { slideVariants } from "@/app/lib/motion"

// NEW: Import TableView
import { ScheduleTableView } from "@/components/ScheduleTableView"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function Page() {
  const {
    day,
    setDay,
    course,
    semester,
    phase,
    batch,
    offline,
    showSkeleton,
    timelineItems,
    uniqueTimes,
    filtersOpen,
    setFiltersOpen,
    updateStatus,
    isCardTimeActive,
    cardRefs,
    courses,
    semestersForCourse,
    phasesForCourseSem,
    batchesForCourseSemPhase,
    handleCourseChange,
    handleSemesterChange,
    handlePhaseChange,
    handleBatchChange,
    swipeHandlers,
    slideDirection,
    showSwipeHint,
    dismissHint,
    noScheduleResultsText,
    tableMode,
    handleToggleTableMode,
    allDaysClasses,
  breaks,
  } = useSchedule()

  const [showTimeline, setShowTimeline] = React.useState(true)
  const [showBreaks, setShowBreaks] = React.useState(true)
  const [scrollSwitch, setNaturalScroll] = React.useState(true);

  React.useEffect(() => {
    const currentVersion = 'jiit-planner-cache-v2025-08-06_21-30-34'
    const storedVersion = localStorage.getItem('app-version')

    if (!storedVersion || storedVersion !== currentVersion) {
      localStorage.clear()
    }

    localStorage.setItem('app-version', currentVersion)
  }, [])

  React.useEffect(() => {
    const stored = localStorage.getItem("showTimeline")
    if (stored === "false") {
      setShowTimeline(false)
    }
  }, [])

  function handleToggleTimeline(newVal) {
    setShowTimeline(newVal)
    localStorage.setItem("showTimeline", newVal ? "true" : "false")
  }

  React.useEffect(() => {
    const stored = localStorage.getItem("showBreaks")
    if (stored === "false") {
      setShowBreaks(false)
    }
  }, [])

  function handleToggleBreaks(newVal) {
    setShowBreaks(newVal)
    localStorage.setItem("showBreaks", newVal ? "true" : "false")
  }

  React.useEffect(() => {
    const stored = localStorage.getItem("scrollSwitch")
    if (stored === "false") {
      setNaturalScroll(false)
    }
  }, [])

  function handleToggleScroll(newVal) {
    setNaturalScroll(newVal)
    localStorage.setItem("scrollSwitch", newVal ? "true" : "false")
  }


  // If we are in tableMode, show the new table-based schedule
  if (tableMode) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden" {...swipeHandlers}>
        <Navbar
          showTimeline={showTimeline}
          scrollSwitch= {scrollSwitch}
          onScrollSwitch= {handleToggleScroll}
          onToggleTimeline={handleToggleTimeline}
          showBreaks={showBreaks}
          onToggleBreaks={handleToggleBreaks}
          tableMode={tableMode}
          onToggleTableMode={handleToggleTableMode}
        />

        <UpdateIndicator status={updateStatus} />

        {/* We hide the day-based filters in table mode, but still show the course/semester/batch/phase filters. 
            Feel free to remove "day" entirely. */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-4 relative overflow-auto">
          <ScheduleFilters
            day={day}
            daysOfWeek={daysOfWeek}
            setDay={setDay}
            courses={courses}
            course={course}
            handleCourseChange={handleCourseChange}
            semestersForCourse={semestersForCourse}
            semester={semester}
            handleSemesterChange={handleSemesterChange}
            phasesForCourseSem={phasesForCourseSem}
            phase={phase}
            handlePhaseChange={handlePhaseChange}
            batchesForCourseSemPhase={batchesForCourseSemPhase}
            batch={batch}
            handleBatchChange={handleBatchChange}
            filtersOpen={filtersOpen}
            setFiltersOpen={setFiltersOpen}
            // We'll pass a prop to hide the "Day" filter entirely
            hideDayFilter
          />

          {showSkeleton ? (
            <ScheduleSkeleton />
          ) : Object.keys(allDaysClasses).length === 0 ? (
            <NoScheduleResults text={noScheduleResultsText} />
          ) : (
            <ScheduleTableView allDaysClasses={allDaysClasses} />
          )}
        </main>

        <Footer />
      </div>
    )
  }

  // Normal “day/timeline” view
  return (
    <div className="min-h-screen flex flex-col" {...swipeHandlers}>
      <Navbar
        showTimeline={showTimeline}
        scrollSwitch= {scrollSwitch}
        onToggleTimeline={handleToggleTimeline}
        onScrollSwitch= {handleToggleScroll}
        showBreaks={showBreaks}
        onToggleBreaks={handleToggleBreaks}
        tableMode={tableMode}
        onToggleTableMode={handleToggleTableMode}
      />

      <UpdateIndicator status={updateStatus} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 relative">
        <ScheduleFilters
          day={day}
          daysOfWeek={daysOfWeek}
          setDay={setDay}
          courses={courses}
          course={course}
          handleCourseChange={handleCourseChange}
          semestersForCourse={semestersForCourse}
          semester={semester}
          handleSemesterChange={handleSemesterChange}
          phasesForCourseSem={phasesForCourseSem}
          phase={phase}
          handlePhaseChange={handlePhaseChange}
          batchesForCourseSemPhase={batchesForCourseSemPhase}
          batch={batch}
          handleBatchChange={handleBatchChange}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
        // not hiding day filter in normal mode
        />

        <div className="relative" style={{ minHeight: "500px" }}>
          <AnimatePresence initial={false} custom={slideDirection} mode="sync">
            <motion.div
              key={day}
              custom={slideDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "tween", duration: 0.3, ease: "easeInOut" },
                opacity: { duration: 0.2 },
              }}
            >
              {showSkeleton ? (
                <ScheduleSkeleton />
              ) : timelineItems.length === 0 ? (
                <NoScheduleResults text={noScheduleResultsText} />
              ) : (
                <div className="flex gap-4">
                  <div className="flex-1">
                    {showBreaks && (
                      <div className="md:hidden mb-8">
                        <BreaksSection breaks={breaks} />
                      </div>
                    )}
                    <div className="relative flex gap-16">
                      {showTimeline && (
                        <Timeline
                          timelineItems={timelineItems}
                          uniqueTimes={uniqueTimes}
                          cardRefs={cardRefs.current}
                        />
                      )}
                      <div className="flex-1 space-y-10 text-foreground transition-all">
                        {timelineItems.map((item, index) => {
                          const timeActive = isCardTimeActive(item)
                          return (
                            <div key={index} ref={cardRefs.current[index]}>
                              <ScheduleCard item={item} timeActive={timeActive} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  {showBreaks && (
                    <div className="w-80 hidden md:block">
                      <div className="sticky top-4">
                        <BreaksSection breaks={breaks} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {!showSkeleton && timelineItems.length > 0 && (
          <div className="text-xs text-center text-muted-foreground mt-2 absolute bottom-4 left-0 right-0">
             <span className="block md:hidden">Swipe left/right to change days</span>
             <span className="hidden md:block">Use arrow keys/double-finger swipe to change days</span>
          </div>
        )}
      </main>

      {showSwipeHint && <SwipeHint onDismiss={dismissHint} />}
      <Footer />
    </div>
  )
}

