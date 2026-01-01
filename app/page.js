"use client";

import React from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  animate,
} from "framer-motion";
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
import { slideVariants } from "@/app/lib/motion";
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

function DaySwipeMotion({
  disabled,
  onSwipeLeft,
  onSwipeRight,
  children,
  style,
  ...motionProps
}) {
  const x = useMotionValue(0);

  const ptr = React.useRef({
    id: null,
    mode: null, // null | "h" | "v"
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    dxRaw: 0,
  });

  const MIN_LOCK_PX = 8;
  const LOCK_RATIO = 1.2;
  const FLICK_VX = 0.75; // px/ms (~750px/s)

  const clampRubber = (dx, w) => {
    // 1:1 until ~35% screen, then rubber-band
    const max = w * 0.35;
    if (dx > max) return max + (dx - max) * 0.2;
    if (dx < -max) return -max + (dx + max) * 0.2;
    return dx;
  };

  const resetPointer = () => {
    ptr.current.id = null;
    ptr.current.mode = null;
    ptr.current.dxRaw = 0;
  };

  const onPointerDown = (e) => {
    if (disabled) return;
    if (ptr.current.id != null) return;

    // Only treat touch/pen as "touch gesture"
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;

    ptr.current.id = e.pointerId;
    ptr.current.mode = null;
    ptr.current.startX = e.clientX;
    ptr.current.startY = e.clientY;
    ptr.current.lastX = e.clientX;
    ptr.current.lastT = performance.now();
    ptr.current.dxRaw = 0;

    // stop any snap-back animation currently running
    x.stop?.();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e) => {
    if (ptr.current.id !== e.pointerId) return;

    const now = performance.now();
    const dx = e.clientX - ptr.current.startX;
    const dy = e.clientY - ptr.current.startY;

    // Update velocity basis
    ptr.current.lastX = e.clientX;
    ptr.current.lastT = now;
    ptr.current.dxRaw = dx;

    // Decide if this gesture is horizontal or vertical (once)
    if (!ptr.current.mode) {
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);

      if (ax < MIN_LOCK_PX && ay < MIN_LOCK_PX) return;

      if (ax > ay * LOCK_RATIO) ptr.current.mode = "h";
      else ptr.current.mode = "v";
    }

    // If horizontal, we own it: prevent default + update x (1:1)
    if (ptr.current.mode === "h") {
      if (e.cancelable) e.preventDefault();

      const w = window.innerWidth || 360;
      x.set(clampRubber(dx, w));
    }
  };

  const onPointerUp = (e) => {
    if (ptr.current.id !== e.pointerId) return;

    const mode = ptr.current.mode;
    const dxRaw = ptr.current.dxRaw;

    // If it wasn't horizontal, do nothing (let scroll be scroll)
    if (mode !== "h") {
      resetPointer();
      return;
    }

    const w = window.innerWidth || 360;
    const threshold = w * 0.22;

    // Approximate release velocity using last segment
    const now = performance.now();
    const dt = Math.max(1, now - ptr.current.lastT);
    const vx = (e.clientX - ptr.current.lastX) / dt;

    const flick = Math.abs(vx) > FLICK_VX;

    const goNext = dxRaw < -threshold || (flick && vx < 0);
    const goPrev = dxRaw > threshold || (flick && vx > 0);

    if (goNext) {
      onSwipeLeft?.();
      // do NOT snap x back — exit variant will take over
    } else if (goPrev) {
      onSwipeRight?.();
    } else {
      animate(x, 0, { type: "tween", duration: 0.18, ease: "easeOut" });
    }

    resetPointer();
  };

  const onPointerCancel = (e) => {
    if (ptr.current.id !== e.pointerId) return;
    animate(x, 0, { type: "tween", duration: 0.18, ease: "easeOut" });
    resetPointer();
  };

  return (
    <motion.div
      {...motionProps}
      style={{
        ...style,
        x,
        // Key part: keep vertical scrolling working; we only preventDefault when we lock horizontal
        touchAction: "pan-y",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {children}
    </motion.div>
  );
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
    const currentVersion = "jiit-planner-cache-v2025-08-10_00-57-55";
    const storedVersion = localStorage.getItem("app-version");

    if (!storedVersion || storedVersion !== currentVersion) {
      localStorage.clear();
    }

    localStorage.setItem("app-version", currentVersion);
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

        <div className="relative" style={{ minHeight: "500px" }}>
          <AnimatePresence
            initial={false}
            custom={{ direction: slideDirection, width: viewportW }}
            mode="sync"
          >
            <DaySwipeMotion
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
            </DaySwipeMotion>
          </AnimatePresence>
        </div>

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
