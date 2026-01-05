"use client";

import { ArrowRightFromLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import GCalColorPickerModal from "./GCalColorPickerModal";

function getUniqueSubjects(allDayClasses) {
  const set = new Set();
  Object.values(allDayClasses).forEach((classes) =>
    classes.forEach((c) => set.add(c.subject))
  );
  return Array.from(set);
}

function nextDateForDay(day) {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = new Date();
  const target = days.indexOf(day.toLowerCase());
  const diff = (target - today.getDay() + 7) % 7 || 7;

  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
}

function toLocalIso(day, time) {
  const date = nextDateForDay(day);

  const [t, mer] = time.split(" ");
  let [h, m] = t.split(":").map(Number);

  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;

  date.setHours(h, m, 0, 0);

  const pad = (n) => String(n).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hh = pad(Math.floor(Math.abs(offset) / 60));
  const mm = pad(Math.abs(offset) % 60);

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00${sign}${hh}:${mm}`
  );
}

function dayToByDay(day) {
  return {
    monday: "MO",
    tuesday: "TU",
    wednesday: "WE",
    thursday: "TH",
    friday: "FR",
    saturday: "SA",
    sunday: "SU",
  }[day.toLowerCase()];
}

async function postGCalPrep(allDayClasses, batch, nameMap, colorMap) {
  const events = [];

  for (const [day, classes] of Object.entries(allDayClasses)) {
    for (const cls of classes) {
      const editedName = nameMap[cls.subject] ?? cls.subject;
      const typeMap = {
        P: "",
        L: "Lecture",
        T: "Tutorial",
      };
      const type = typeMap[cls.type] || "";

      events.push({
        summary: `${editedName} ${type ? `(${type})` : ""} — ${cls.venue} `,
        description: `Faculty: ${cls.teacher}`,
        start: toLocalIso(day, cls.start),
        end: toLocalIso(day, cls.end),
        rrule: `RRULE:FREQ=WEEKLY;BYDAY=${dayToByDay(day)}`,
        colorId: colorMap[cls.subject] ?? 1,
      });
    }
  }

  await fetch("/api/google/prepare_calandar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      events,
      returnTo: window.location.href,
      batch: batch.toUpperCase(),
    }),
  });

  window.location.href = "/api/google/auth";
}

export function ExportToGCal({ allDayClasses, batch }) {
  const [open, setOpen] = useState(false);

  const subjects = useMemo(
    () => getUniqueSubjects(allDayClasses),
    [allDayClasses]
  );

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="rounded-xl"
        aria-label="Export to google calandar"
        title="Export to google calandar"
      >
        <ArrowRightFromLine className="h-4 w-4" />
      </Button>

      <GCalColorPickerModal
        open={open}
        onClose={setOpen}
        subjects={subjects}
        onConfirm={(nameMap, colorMap) => {
          setOpen(false);
          postGCalPrep(allDayClasses, batch, nameMap, colorMap);
        }}
      />
    </>
  );
}
