"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, ChevronsUpDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function shortDay(d) {
  const map = {
    Sunday: "Sun",
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
  };
  return map[d] ?? d;
}

function PillRail({ label, value, onValueChange, items, disabled }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>

      <div
        className={cn(
          "flex gap-2 overflow-x-auto no-scrollbar",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        {items.map((it) => {
          const active = it.id === value;
          return (
            <Button
              key={it.id}
              type="button"
              variant={active ? "default" : "secondary"}
              onClick={() => onValueChange(it.id)}
              className={cn(
                "h-10 min-w-10 shrink-0 px-3 rounded-xl",
                "max-w-[12.5rem] truncate",
                active && "shadow-sm",
              )}
              title={it.name}
            >
              <span className="truncate">{it.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Searchable combobox (for Batch mainly)
 * items: [{ id, name }]
 */
function FilterCombobox({
  label,
  value,
  onValueChange,
  items,
  placeholder,
  searchPlaceholder,
  disabled,
  emptyText = "No options",
}) {
  const selected = items.find((x) => x.id === value) || null;
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-11 px-3 rounded-xl",
              disabled && "opacity-60",
              open && "ring-2 ring-ring ring-offset-2 ring-offset-background",
            )}
          >
            <span
              className={cn("truncate", !selected && "text-muted-foreground")}
            >
              {selected ? selected.name : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-60 shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)]"
          align="start"
          sideOffset={8}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className="max-h-64">
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {items.map((it) => {
                  const active = it.id === value;
                  return (
                    <CommandItem
                      key={it.id}
                      value={it.name}
                      onSelect={() => {
                        onValueChange(it.id);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          active ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{it.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * ScheduleFilters (updated to match your grievances)
 */
export function ScheduleFilters({
  day,
  daysOfWeek,
  setDay,
  courses,
  course,
  handleCourseChange,
  semestersForCourse,
  semester,
  handleSemesterChange,
  phasesForCourseSem,
  phase,
  handlePhaseChange,
  batchesForCourseSemPhase,
  batch,
  handleBatchChange,
  filtersOpen,
  setFiltersOpen,

  hideDayFilter = false,

  showElectivesButton = false,
  onOpenElectives,
}) {
  const courseItems = React.useMemo(
    () => (courses || []).map((c) => ({ id: c.id, name: c.name })),
    [courses],
  );

  const semesterItems = React.useMemo(
    () => (semestersForCourse || []).map((s) => ({ id: s.id, name: s.name })),
    [semestersForCourse],
  );

  const phaseItems = React.useMemo(
    () => (phasesForCourseSem || []).map((p) => ({ id: p.id, name: p.name })),
    [phasesForCourseSem],
  );

  const batchItems = React.useMemo(
    () =>
      (batchesForCourseSemPhase || []).map((b) => ({ id: b.id, name: b.name })),
    [batchesForCourseSemPhase],
  );

  return (
    <div className="bg-background/80 backdrop-blur-sm mb-4">
      {/* Top bar (keep day/batch label behavior exactly) */}
      <div className="flex items-center pl-[10px] justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-sm font-semibold truncate">
            {!hideDayFilter ? day : "Filters"}
          </div>

          {batch ? (
            <Badge variant="secondary" className="shrink-0">
              {batch.toUpperCase()}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {showElectivesButton && (
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenElectives?.()}
            >
              Electives
            </Button>
          )}

          <Button
            type="button"
            variant={filtersOpen ? "default" : "outline"}
            size="icon"
            className="rounded-xl"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-pressed={filtersOpen}
            aria-label={filtersOpen ? "Close filters" : "Open filters"}
            title={filtersOpen ? "Close filters" : "Open filters"}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{
          height: filtersOpen ? "auto" : 0,
          opacity: filtersOpen ? 1 : 0,
        }}
        transition={{
          duration: 0.22,
          ease: "easeInOut",
        }}
        className="overflow-hidden"
      >
        <div className="pb-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Day pills */}
            {!hideDayFilter && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Day
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {daysOfWeek.map((d) => {
                    const active = d === day;
                    return (
                      <Button
                        key={d}
                        type="button"
                        variant={active ? "default" : "secondary"}
                        onClick={() => setDay(d)}
                        className={cn(
                          "h-10 min-w-10 shrink-0 px-3 rounded-xl",
                          active && "shadow-sm",
                        )}
                      >
                        <span className="md:hidden">{shortDay(d)}</span>
                        <span className="hidden md:inline">{d}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Course as pills */}
            <PillRail
              label="Course"
              value={course}
              onValueChange={handleCourseChange}
              items={courseItems}
              disabled={courseItems.length === 0}
            />

            {/* Semester + Phase inline */}
            <div className="grid grid-cols-2 gap-3">
              <PillRail
                label="Semester"
                value={semester}
                onValueChange={handleSemesterChange}
                items={semesterItems}
                disabled={semesterItems.length === 0}
              />

              <PillRail
                label="Phase"
                value={phase}
                onValueChange={handlePhaseChange}
                items={phaseItems}
                disabled={phaseItems.length === 0}
              />
            </div>

            {/* Batch stays searchable */}
            <FilterCombobox
              label="Batch"
              value={batch}
              onValueChange={handleBatchChange}
              items={batchItems}
              placeholder={phase ? "Select batch" : "Pick phase first"}
              searchPlaceholder="Search batch (ex: A1, B2, 12...)"
              disabled={batchItems.length === 0}
              emptyText={phase ? "No batches found" : "Pick a phase first"}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
