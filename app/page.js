"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { useSchedule } from "@/app/hooks/useSchedule";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Timeline } from "@/components/Timeline";
import { ScheduleCard } from "@/components/ScheduleCard";
import { BreaksSection } from "@/components/BreaksSection";
import { SwipeHint } from "@/components/SwipeHint";
import { UpdateIndicator } from "@/components/UpdateIndicator";
import { ScheduleFilters } from "@/components/ScheduleFilters";
import { ScheduleSkeleton } from "@/components/ScheduleSkeleton";
import { NoScheduleResults } from "@/components/NoScheduleResults";
import { TimetableComparison } from "@/components/TimetableComparison";
import { slideVariants, HorizontalSwipeMotion } from "@/app/lib/motion";
import { ScheduleTableView } from "@/components/ScheduleTableView";

// NEW
import { ElectiveSelectorModal } from "@/components/ElectiveSelectorModal";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function useViewportWidth() {
  const [w, setW] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 360,
  );

  React.useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return w;
}

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
    slideDirection,
    showSwipeHint,
    dismissHint,
    noScheduleResultsText,
    tableMode,
    handleToggleTableMode,
    allDaysClasses,
    breaks,
    metadata,

    // NEW: electives
    hasElectives,
    electivesByCategory,
    selectedElectives,
    electiveModalOpen,
    setElectiveModalOpen,
    handleElectiveSelect,
    openElectiveSelector,
    changeDay,
  } = useSchedule();

  const viewportW = useViewportWidth();
  const [showTimeline, setShowTimeline] = React.useState(true);
  const [showBreaks, setShowBreaks] = React.useState(true);
  const [scrollSwitch, setNaturalScroll] = React.useState(true);
  const [showComparison, setShowComparison] = React.useState(false);

  React.useEffect(() => {
    // so 2 different version strings:
    // appVersion: for label; updated by script; same as service worker
    // clearVersion: used for nuking the localStorage; updated manually; if localStorage is corrupted irrepairably
    const appVersion = "jiit-planner-v2026.01.02_21.54.34";
    const clearVersion = "v2026.01.02";
    const storedClearVersion = localStorage.getItem("clear-version");

    if (!storedClearVersion || storedClearVersion !== clearVersion) {
      localStorage.clear();
    }

    localStorage.setItem("app-version", appVersion);
    localStorage.setItem("clear-version", clearVersion);
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem("showTimeline");
    if (stored === "false") {
      setShowTimeline(false);
    }
  }, []);

  function handleToggleTimeline(newVal) {
    setShowTimeline(newVal);
    localStorage.setItem("showTimeline", newVal ? "true" : "false");
  }

  React.useEffect(() => {
    const stored = localStorage.getItem("showBreaks");
    if (stored === "false") {
      setShowBreaks(false);
    }
  }, []);

  function handleToggleBreaks(newVal) {
    setShowBreaks(newVal);
    localStorage.setItem("showBreaks", newVal ? "true" : "false");
  }

  React.useEffect(() => {
    const stored = localStorage.getItem("scrollSwitch");
    if (stored === "false") {
      setNaturalScroll(false);
    }
  }, []);

  function handleToggleScroll(newVal) {
    setNaturalScroll(newVal);
    localStorage.setItem("scrollSwitch", newVal ? "true" : "false");
  }

  // Table mode
  if (tableMode) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Navbar
          showTimeline={showTimeline}
          scrollSwitch={scrollSwitch}
          onScrollSwitch={handleToggleScroll}
          onToggleTimeline={handleToggleTimeline}
          showBreaks={showBreaks}
          onToggleBreaks={handleToggleBreaks}
          tableMode={tableMode}
          onToggleTableMode={handleToggleTableMode}
          onOpenComparison={() => setShowComparison(true)}
        />

        <UpdateIndicator status={updateStatus} />

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
            hideDayFilter
            // NEW
            showElectivesButton={hasElectives}
            onOpenElectives={openElectiveSelector}
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

        {/* Electives modal */}
        <ElectiveSelectorModal
          open={electiveModalOpen}
          onOpenChange={setElectiveModalOpen}
          electivesByCategory={electivesByCategory}
          selected={selectedElectives}
          onSelect={handleElectiveSelect}
        />

        {/* Timetable Comparison Modal */}
        {showComparison && metadata && (
          <TimetableComparison
            metadata={metadata}
            onClose={() => setShowComparison(false)}
          />
        )}
      </div>
    );
  }

  // Normal view
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        showTimeline={showTimeline}
        scrollSwitch={scrollSwitch}
        onToggleTimeline={handleToggleTimeline}
        onScrollSwitch={handleToggleScroll}
        showBreaks={showBreaks}
        onToggleBreaks={handleToggleBreaks}
        tableMode={tableMode}
        onToggleTableMode={handleToggleTableMode}
        onOpenComparison={() => setShowComparison(true)}
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
          // NEW
          showElectivesButton={hasElectives}
          onOpenElectives={openElectiveSelector}
        />

        <AnimatePresence
          initial={false}
          custom={{ direction: slideDirection, width: viewportW }}
          mode="wait"
        >
          <HorizontalSwipeMotion
            key={day}
            disabled={showSkeleton || tableMode}
            custom={{ direction: slideDirection, width: viewportW }}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.2 },
            }}
            onSwipeLeft={() => changeDay(1)}
            onSwipeRight={() => changeDay(-1)}
          >
            <div className="relative" style={{ minHeight: "500px" }}>
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
                          const timeActive = isCardTimeActive(item);
                          return (
                            <div key={index} ref={cardRefs.current[index]}>
                              <ScheduleCard
                                item={item}
                                timeActive={timeActive}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {showBreaks && (
                    <div className="w-80 hidden md:block">
                      <div className="sticky top-20">
                        <BreaksSection breaks={breaks} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </HorizontalSwipeMotion>
        </AnimatePresence>
        {!showSkeleton && timelineItems.length > 0 && (
          <div className="text-xs text-center text-muted-foreground mt-2 absolute bottom-4 left-0 right-0">
            <span className="block md:hidden">
              Swipe left/right to change days
            </span>
            <span className="hidden md:block">
              Use arrow keys/double-finger swipe to change days
            </span>
          </div>
        )}
      </main>
      {showSwipeHint && <SwipeHint onDismiss={dismissHint} />}
      <Footer />

      {/* Electives modal */}
      <ElectiveSelectorModal
        open={electiveModalOpen}
        onOpenChange={setElectiveModalOpen}
        electivesByCategory={electivesByCategory}
        selected={selectedElectives}
        onSelect={handleElectiveSelect}
      />

      {/* Timetable Comparison Modal */}
      {showComparison && metadata && (
        <TimetableComparison
          metadata={metadata}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
