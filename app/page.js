"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useSchedule } from "@/app/hooks/useSchedule"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Timeline } from "@/components/Timeline"
import { ScheduleCard } from "@/components/ScheduleCard"
import { SwipeHint } from "@/components/SwipeHint"
import { UpdateIndicator } from "@/components/UpdateIndicator"
import { ScheduleFilters } from "@/components/ScheduleFilters"
import { ScheduleSkeleton } from "@/components/ScheduleSkeleton"
import { NoScheduleResults } from "@/components/NoScheduleResults"

import { slideVariants } from "@/app/lib/motion"

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
  } = useSchedule()

  return (
    <div className="min-h-screen flex flex-col" {...swipeHandlers}>
      <Navbar />

      {/* UpdateIndicator is absolutely positioned (see its CSS). */}
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
        />

        {/* Main content area (timeline + cards) */}
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
                <NoScheduleResults offline={offline} />
              ) : (
                // Actual timeline
                <div className="relative flex gap-16">
                  <Timeline
                    timelineItems={timelineItems}
                    uniqueTimes={uniqueTimes}
                    cardRefs={cardRefs.current}
                  />

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
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* small "swipe-hint" text. Alternatively remove if not needed. */}
        {!showSkeleton && timelineItems.length > 0 && (
          <div className="text-xs text-center text-muted-foreground mt-2 absolute bottom-4 left-0 right-0">
            Swipe left/right to change days
          </div>
        )}
      </main>

      {showSwipeHint && <SwipeHint onDismiss={dismissHint} />}
      <Footer />
    </div>
  )
}
