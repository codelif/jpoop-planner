"use client";

import React from "react";
import { Calendar, Users, Clock, ArrowLeftRight, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function timeToMinutes(timeStr) {
  const [time, meridiem] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function calculateBreaks(classes) {
  const sorted = [...classes].sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
  );
  const breaks = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEndMin = timeToMinutes(sorted[i].end);
    const nextStartMin = timeToMinutes(sorted[i + 1].start);
    if (nextStartMin > currentEndMin) {
      const durationMin = nextStartMin - currentEndMin;
      if (durationMin >= 60) {
        const hr = Math.floor(durationMin / 60);
        const min = durationMin % 60;
        const durationReadable = [
          hr ? `${hr} hr${hr > 1 ? "s" : ""}` : null,
          min ? `${min} min` : null,
        ]
          .filter(Boolean)
          .join(" ");
        breaks.push({
          start: sorted[i].end,
          end: sorted[i + 1].start,
          durationMinutes: durationMin,
          durationReadable: durationReadable || "0 min",
        });
      }
    }
  }
  return breaks;
}

function findCoincidingBreaks(allBatchBreaks) {
  if (allBatchBreaks.length < 2) return [];

  const coinciding = [];

  const allTimeRanges = [];
  allBatchBreaks.forEach((breaks, batchIndex) => {
    breaks.forEach((brk) => {
      const start = timeToMinutes(brk.start);
      const end = timeToMinutes(brk.end);
      allTimeRanges.push({ start, end, batchIndex });
    });
  });

  allTimeRanges.forEach((range, index) => {
    const overlaps = [];

    for (let batchIndex = 0; batchIndex < allBatchBreaks.length; batchIndex++) {
      const batchBreaks = allBatchBreaks[batchIndex];
      const hasOverlap = batchBreaks.some((brk) => {
        const brkStart = timeToMinutes(brk.start);
        const brkEnd = timeToMinutes(brk.end);
        return range.start < brkEnd && brkStart < range.end;
      });

      if (hasOverlap) {
        const batchOverlaps = batchBreaks
          .filter((brk) => {
            const brkStart = timeToMinutes(brk.start);
            const brkEnd = timeToMinutes(brk.end);
            return range.start < brkEnd && brkStart < range.end;
          })
          .map((brk) => ({
            start: Math.max(range.start, timeToMinutes(brk.start)),
            end: Math.min(range.end, timeToMinutes(brk.end)),
          }));

        overlaps.push(...batchOverlaps);
      }
    }

    if (overlaps.length >= allBatchBreaks.length) {
      const commonStart = Math.max(...overlaps.map((o) => o.start));
      const commonEnd = Math.min(...overlaps.map((o) => o.end));

      if (commonStart < commonEnd) {
        const duration = commonEnd - commonStart;

        if (duration >= 60) {
          const formatTime = (minutes) => {
            const hour = Math.floor(minutes / 60);
            const min = minutes % 60;
            const period = hour >= 12 ? "PM" : "AM";
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            return `${displayHour}:${min.toString().padStart(2, "0")} ${period}`;
          };

          const hr = Math.floor(duration / 60);
          const min = duration % 60;
          const durationReadable = [
            hr ? `${hr} hr${hr > 1 ? "s" : ""}` : null,
            min ? `${min} min` : null,
          ]
            .filter(Boolean)
            .join(" ");

          const newBreak = {
            start: formatTime(commonStart),
            end: formatTime(commonEnd),
            durationMinutes: duration,
            durationReadable: durationReadable || "0 min",
          };

          const exists = coinciding.some(
            (existing) =>
              existing.start === newBreak.start &&
              existing.end === newBreak.end,
          );

          if (!exists) {
            coinciding.push(newBreak);
          }
        }
      }
    }
  });

  return coinciding.sort(
    (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start),
  );
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function BatchSelector({
  label,
  course,
  semester,
  phase,
  batch,
  metadata,
  onCourseChange,
  onSemesterChange,
  onPhaseChange,
  onBatchChange,
  colorScheme = "primary",
  onRemove,
  canRemove = false,
  index,
}) {
  const courses = metadata?.courses || [];
  const semestersForCourse = course ? metadata?.semesters[course] || [] : [];
  const phasesForCourseSem =
    course && semester ? metadata?.phases?.[course]?.[semester] || [] : [];
  const batchesForCourseSemPhase =
    course && semester && phase
      ? metadata?.batches?.[course]?.[semester]?.[phase] || []
      : [];

  const bgColorClass =
    colorScheme === "primary"
      ? "bg-primary/10"
      : colorScheme === "secondary"
        ? "bg-secondary/10"
        : "bg-accent/10";

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card relative">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
          <Users className="h-5 w-5" />
          {label}
        </h3>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove?.(index)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Course
          </label>
          <Select value={course} onValueChange={onCourseChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Semester
          </label>
          <Select value={semester} onValueChange={onSemesterChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {semestersForCourse.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Phase
          </label>
          <Select value={phase} onValueChange={onPhaseChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select phase" />
            </SelectTrigger>
            <SelectContent>
              {phasesForCourseSem.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Batch
          </label>
          <Select value={batch} onValueChange={onBatchChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {batchesForCourseSemPhase.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function DayComparisonView({ day, batchesData, batchLabels }) {
  const allBatchBreaks = batchesData.map((data) =>
    calculateBreaks(data[day] || []),
  );
  const coincidingBreaks = findCoincidingBreaks(allBatchBreaks);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-3 p-4 bg-muted/30 rounded-lg">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold text-foreground">{day}</h3>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-semibold text-card-foreground bg-accent/20 p-3 rounded-lg flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          Coinciding Breaks
        </h4>
        {coincidingBreaks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic p-4 bg-muted/20 rounded-md text-center">
            No coinciding breaks between all selected batches
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {coincidingBreaks.map((brk, i) => (
              <div
                key={i}
                className="p-4 bg-accent/30 border border-accent/40 rounded-lg text-center"
              >
                <div className="text-lg font-bold text-accent-foreground">
                  {brk.start} - {brk.end}
                </div>
                <div className="text-sm text-muted-foreground">
                  {brk.durationReadable}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  All batches free
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className={`grid gap-6 ${
          batchesData.length === 1
            ? "grid-cols-1"
            : batchesData.length === 2
              ? "grid-cols-1 lg:grid-cols-2"
              : batchesData.length === 3
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }`}
      >
        {batchesData.map((data, index) => {
          const classes = data[day] || [];

          return (
            <div key={index} className="space-y-4">
              <h4 className="text-lg font-semibold text-card-foreground bg-accent/20 p-3 rounded-lg">
                {batchLabels[index]}
              </h4>

              <div className="space-y-3">
                <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Classes
                </h5>
                {classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No classes
                  </p>
                ) : (
                  classes.map((cls, i) => (
                    <div
                      key={i}
                      className="p-3 bg-card border border-border rounded-md"
                    >
                      <div className="font-semibold text-card-foreground">
                        {cls.subject}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {cls.start} - {cls.end}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cls.teacher} • {cls.venue} • {cls.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TimetableComparison({ metadata, onClose }) {
  const [batches, setBatches] = React.useState([
    {
      course: "",
      semester: "",
      phase: "",
      batch: "",
      data: {},
      loading: false,
    },
    {
      course: "",
      semester: "",
      phase: "",
      batch: "",
      data: {},
      loading: false,
    },
  ]);

  const [selectedDay, setSelectedDay] = React.useState("Monday");

  React.useEffect(() => {
    const savedCourse = localStorage.getItem("selectedCourse");
    const savedSemester = localStorage.getItem("selectedSemester");
    const savedPhase = localStorage.getItem("selectedPhase");
    const savedBatch = localStorage.getItem("selectedBatch");

    if (savedCourse || savedSemester || savedPhase || savedBatch) {
      setBatches((prevBatches) => {
        const newBatches = [...prevBatches];
        if (savedCourse) newBatches[0].course = savedCourse;
        if (savedSemester) newBatches[0].semester = savedSemester;
        if (savedPhase) newBatches[0].phase = savedPhase;
        if (savedBatch) newBatches[0].batch = savedBatch;
        return newBatches;
      });
    }
  }, []);

  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const scrollY = window.scrollY;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const addBatch = () => {
    setBatches((prevBatches) => [
      ...prevBatches,
      {
        course: "",
        semester: "",
        phase: "",
        batch: "",
        data: {},
        loading: false,
      },
    ]);
  };

  const removeBatch = (index) => {
    if (batches.length <= 2) return;
    setBatches((prevBatches) => prevBatches.filter((_, i) => i !== index));
  };

  const updateBatch = (index, field, value) => {
    setBatches((prevBatches) => {
      const newBatches = [...prevBatches];
      newBatches[index] = { ...newBatches[index], [field]: value };

      if (field === "course") {
        newBatches[index].semester = "";
        newBatches[index].phase = "";
        newBatches[index].batch = "";
        newBatches[index].data = {};
      } else if (field === "semester") {
        newBatches[index].phase = "";
        newBatches[index].batch = "";
        newBatches[index].data = {};
      } else if (field === "phase") {
        newBatches[index].batch = "";
        newBatches[index].data = {};
      }

      return newBatches;
    });
  };

  const setBatchLoading = (index, loading) => {
    setBatches((prevBatches) => {
      const newBatches = [...prevBatches];
      newBatches[index] = { ...newBatches[index], loading };
      return newBatches;
    });
  };

  const setBatchData = (index, data) => {
    setBatches((prevBatches) => {
      const newBatches = [...prevBatches];
      newBatches[index] = { ...newBatches[index], data };
      return newBatches;
    });
  };

  React.useEffect(() => {
    batches.forEach(async (batch, index) => {
      const { course, semester, phase, batch: batchId } = batch;

      if (!course || !semester || !phase || !batchId) {
        setBatchData(index, {});
        return;
      }

      setBatchLoading(index, true);
      try {
        const url = `/api/allclasses?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&phase=${encodeURIComponent(phase)}&batch=${encodeURIComponent(batchId)}`;
        const res = await fetch(url);
        const data = await res.json();
        setBatchData(index, data.classes || {});
      } catch (err) {
        console.error(`Error fetching batch ${index + 1} data:`, err);
        setBatchData(index, {});
      } finally {
        setBatchLoading(index, false);
      }
    });
  }, [
    batches
      .map((b) => `${b.course}-${b.semester}-${b.phase}-${b.batch}`)
      .join(","),
  ]);

  const getBatchLabel = (course, semester, phase, batch) => {
    const batchData = metadata?.batches?.[course]?.[semester]?.[phase]?.find(
      (b) => b.id === batch,
    );
    const courseCode = course?.replace("btech-", "B.Tech ");
    const semesterNum = semester?.replace("sem", "");
    const phaseNum = phase?.replace("phase", "");

    return `${courseCode} - ${semesterNum} - ${phaseNum} - ${batchData?.name || batch}`;
  };

  const validBatches = batches.filter(
    (batch) =>
      batch.course &&
      batch.semester &&
      batch.phase &&
      batch.batch &&
      Object.keys(batch.data).length > 0,
  );
  const canCompare = validBatches.length >= 2;
  const isAnyLoading = batches.some((batch) => batch.loading);

  const colorSchemes = ["primary", "secondary", "accent", "muted"];

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-7xl max-h-[90vh] bg-background border border-border rounded-lg shadow-lg overflow-hidden"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <ArrowLeftRight className="h-6 w-6" />
            Timetable Comparison
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  Select Batches to Compare
                </h3>
                <Button
                  onClick={addBatch}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Batch
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {batches.map((batch, index) => (
                  <BatchSelector
                    key={index}
                    index={index}
                    label={`Batch ${index + 1}`}
                    course={batch.course}
                    semester={batch.semester}
                    phase={batch.phase}
                    batch={batch.batch}
                    metadata={metadata}
                    colorScheme={colorSchemes[index % colorSchemes.length]}
                    canRemove={batches.length > 2}
                    onRemove={removeBatch}
                    onCourseChange={(val) => {
                      updateBatch(index, "course", val);
                      const firstSem = (metadata?.semesters[val] || [])[0];
                      if (firstSem) {
                        updateBatch(index, "semester", firstSem.id);
                        const firstPhase = (metadata?.phases?.[val]?.[
                          firstSem.id
                        ] || [])[0];
                        if (firstPhase) {
                          updateBatch(index, "phase", firstPhase.id);
                          const firstBatch = (metadata?.batches?.[val]?.[
                            firstSem.id
                          ]?.[firstPhase.id] || [])[0];
                          if (firstBatch)
                            updateBatch(index, "batch", firstBatch.id);
                        }
                      }
                    }}
                    onSemesterChange={(val) => {
                      updateBatch(index, "semester", val);
                      const firstPhase = (metadata?.phases?.[batch.course]?.[
                        val
                      ] || [])[0];
                      if (firstPhase) {
                        updateBatch(index, "phase", firstPhase.id);
                        const firstBatch = (metadata?.batches?.[batch.course]?.[
                          val
                        ]?.[firstPhase.id] || [])[0];
                        if (firstBatch)
                          updateBatch(index, "batch", firstBatch.id);
                      }
                    }}
                    onPhaseChange={(val) => {
                      updateBatch(index, "phase", val);
                      const firstBatch = (metadata?.batches?.[batch.course]?.[
                        batch.semester
                      ]?.[val] || [])[0];
                      if (firstBatch)
                        updateBatch(index, "batch", firstBatch.id);
                    }}
                    onBatchChange={(val) => updateBatch(index, "batch", val)}
                  />
                ))}
              </div>
            </div>

            {isAnyLoading && (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">
                  Loading timetable data...
                </p>
              </div>
            )}

            {canCompare && (
              <div className="flex flex-wrap gap-2 justify-center">
                {DAYS.map((day) => (
                  <Button
                    key={day}
                    variant={selectedDay === day ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            )}

            {canCompare && (
              <DayComparisonView
                day={selectedDay}
                batchesData={validBatches.map((batch) => batch.data)}
                batchLabels={validBatches.map((batch) =>
                  getBatchLabel(
                    batch.course,
                    batch.semester,
                    batch.phase,
                    batch.batch,
                  ),
                )}
              />
            )}

            {!canCompare && !isAnyLoading && (
              <div className="text-center py-12">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select At Least Two Batches to Compare
                </h3>
                <p className="text-muted-foreground">
                  Choose course, semester, phase, and batch for multiple sides
                  to start comparing timetables.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
