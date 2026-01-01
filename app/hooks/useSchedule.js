"use client";

import React from "react";
import { useSwipeable } from "react-swipeable";
import {
  ELECTIVE_NONE,
  buildDefaultElectiveSelection,
  normalizeElectiveSelection,
  filterWeekByElectives,
  electivesDefStorageKey,
  electivesSelStorageKey,
} from "@/app/lib/electives";

function timeToMinutes(timeStr) {
  const [time, meridiem] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12;
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// NEW: stable sort for classes
function sortClassesByTime(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  arr.sort((a, b) => {
    const s = timeToMinutes(a.start) - timeToMinutes(b.start);
    if (s !== 0) return s;

    const e = timeToMinutes(a.end) - timeToMinutes(b.end);
    if (e !== 0) return e;

    // Stable tie-breakers so duplicates don’t “jump” around
    const sub = (a.subject || "").localeCompare(b.subject || "");
    if (sub !== 0) return sub;
    const code = (a.subjectcode || "").localeCompare(b.subjectcode || "");
    if (code !== 0) return code;
    const teacher = (a.teacher || "").localeCompare(b.teacher || "");
    if (teacher !== 0) return teacher;
    return (a.venue || "").localeCompare(b.venue || "");
  });
  return arr;
}

function getCurrentTimeMin() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

async function fetchJsonNoCache(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  return res.json();
}

export function useSchedule() {
  const cardRefs = React.useRef([]);

  const [currentTimeMin, setCurrentTimeMin] =
    React.useState(getCurrentTimeMin());

  const [serviceWorkerUpdated, setServiceWorkerUpdated] = React.useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] =
    React.useState(null);

  const [metadata, setMetadata] = React.useState(null);
  const [day, setDay] = React.useState(daysOfWeek[new Date().getDay()]);
  const [course, setCourse] = React.useState("");
  const [semester, setSemester] = React.useState("");
  const [phase, setPhase] = React.useState("1");
  const [batch, setBatch] = React.useState("");

  // Raw classes from API/cache (unfiltered)
  const [rawAllDaysClasses, setRawAllDaysClasses] = React.useState({});

  // Filtered view (applies elective selection)
  const [timelineItems, setTimelineItems] = React.useState([]);
  const [uniqueTimes, setUniqueTimes] = React.useState([]);
  const [breaks, setBreaks] = React.useState([]);
  const [allDaysClasses, setAllDaysClasses] = React.useState({});

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [showSkeleton, setShowSkeleton] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const [noScheduleResultsText, setNoScheduleResultsText] = React.useState(
    "No classes found for the selected filters.",
  );
  const [showSwipeHint, setShowSwipeHint] = React.useState(false);
  const [updateStatus, setUpdateStatus] = React.useState("");
  const [tableMode, setTableMode] = React.useState(false);

  // NEW: electives state
  const [electivesByCategory, setElectivesByCategory] = React.useState({});
  const [hasElectives, setHasElectives] = React.useState(false);
  const [selectedElectives, setSelectedElectives] = React.useState({});
  const [electiveModalOpen, setElectiveModalOpen] = React.useState(false);
  const lastElectiveComboRef = React.useRef("");

  React.useEffect(() => {
    if (typeof navigator !== "undefined") {
      setOffline(!navigator.onLine);
    }
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem("tableMode");
    if (stored === "true") {
      setTableMode(true);
    }
  }, []);

  function handleToggleTableMode(value) {
    setTableMode(value);
    localStorage.setItem("tableMode", value ? "true" : "false");
  }

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMin(getCurrentTimeMin());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (typeof navigator === "undefined") return;

    function handleOnline() {
      setOffline(false);
    }
    function handleOffline() {
      setOffline(true);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 1) Load metadata
  React.useEffect(() => {
    if (offline) {
      setNoScheduleResultsText(
        "You are offline and no cached data is available for these filters.",
      );
    } else {
      setNoScheduleResultsText("No classes found for the selected filters.");
    }

    async function loadMetadata() {
      let localData = null;
      const cached = localStorage.getItem("metadata");
      if (cached) {
        localData = JSON.parse(cached);
        setMetadata(localData);
      } else {
        setShowSkeleton(true);
      }

      if (offline) {
        setShowSkeleton(false);
        return;
      }

      try {
        setUpdateStatus("checking-metadata");
        const freshData = await fetchJsonNoCache("/api/metadata");

        if (!localData || freshData.cacheVersion !== localData.cacheVersion) {
          setUpdateStatus("updating-metadata");
          setMetadata(freshData);
          localStorage.setItem("metadata", JSON.stringify(freshData));
        }

        setUpdateStatus("");
      } catch (err) {
        console.error("Error fetching metadata", err);
        setUpdateStatus("error-metadata");
      } finally {
        setShowSkeleton(false);
      }
    }

    loadMetadata();
  }, [offline]);

  // 2) Defaults for filters
  React.useEffect(() => {
    if (!metadata) return;

    const savedCourse = localStorage.getItem("selectedCourse");
    const savedSemester = localStorage.getItem("selectedSemester");
    const savedPhase = localStorage.getItem("selectedPhase");
    const savedBatch = localStorage.getItem("selectedBatch");

    let defaultCourse = "";
    let defaultSemester = "";
    let defaultPhase = "1";
    let defaultBatch = "";

    if (metadata.courses?.length > 0) {
      if (savedCourse && metadata.courses.some((c) => c.id === savedCourse)) {
        defaultCourse = savedCourse;
      } else {
        defaultCourse = metadata.courses[0].id;
      }
    }

    const semestersForCourse = metadata.semesters[defaultCourse] || [];
    if (semestersForCourse.length > 0) {
      if (
        savedSemester &&
        semestersForCourse.some((s) => s.id === savedSemester)
      ) {
        defaultSemester = savedSemester;
      } else {
        defaultSemester = semestersForCourse[0].id;
      }
    }

    const phasesForCourseSem =
      metadata?.phases?.[defaultCourse]?.[defaultSemester] || [];
    if (phasesForCourseSem.length > 0) {
      if (savedPhase && phasesForCourseSem.some((p) => p.id === savedPhase)) {
        defaultPhase = savedPhase;
      } else {
        defaultPhase = phasesForCourseSem[0].id;
      }
    }

    const batchesForCourseSemPhase =
      metadata?.batches?.[defaultCourse]?.[defaultSemester]?.[defaultPhase] ||
      [];
    if (batchesForCourseSemPhase.length > 0) {
      if (
        savedBatch &&
        batchesForCourseSemPhase.some((b) => b.id === savedBatch)
      ) {
        defaultBatch = savedBatch;
      } else {
        defaultBatch = batchesForCourseSemPhase[0].id;
      }
    }

    setCourse(defaultCourse);
    setSemester(defaultSemester);
    setPhase(defaultPhase);
    setBatch(defaultBatch);
  }, [metadata]);

  // NEW: Load electives when (course, semester, phase) changes.
  React.useEffect(() => {
    if (!metadata || !course || !semester || !phase) return;

    const comboKey = `${course}_${semester}_${phase}`;
    const defKey = electivesDefStorageKey(course, semester, phase);
    const selKey = electivesSelStorageKey(course, semester, phase);

    async function loadElectives() {
      // Load cached definition first (useful offline or for instant UI)
      let cachedDef = null;
      const defStr = localStorage.getItem(defKey);
      if (defStr) {
        try {
          cachedDef = JSON.parse(defStr);
        } catch {
          cachedDef = null;
        }
      }

      let cachedSel = null;
      const selStr = localStorage.getItem(selKey);
      if (selStr) {
        try {
          cachedSel = JSON.parse(selStr);
        } catch {
          cachedSel = null;
        }
      }

      // Apply cachedDef immediately if present
      if (
        cachedDef?.electivesByCategory &&
        typeof cachedDef.electivesByCategory === "object"
      ) {
        const cats = cachedDef.electivesByCategory;
        const has = Object.keys(cats).length > 0;
        setElectivesByCategory(cats);
        setHasElectives(has);

        if (has) {
          const normalized = normalizeElectiveSelection(
            cachedSel?.selectedElectives,
            cats,
          );
          const hasStoredSelection = !!cachedSel?.selectedElectives;
          if (hasStoredSelection) {
            setSelectedElectives(normalized);
          } else {
            const defaults = buildDefaultElectiveSelection(cats);
            setSelectedElectives(defaults);
          }
        } else {
          setSelectedElectives({});
        }
      } else {
        // No cached def
        setElectivesByCategory({});
        setHasElectives(false);
        setSelectedElectives({});
      }

      if (offline) {
        // Can't verify with server; do NOT auto-open modal offline
        return;
      }

      try {
        const url = `/api/electives?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(
          semester,
        )}&phase=${encodeURIComponent(phase)}`;
        const serverData = await fetchJsonNoCache(url);

        const { cacheVersion, ...cats } = serverData || {};
        const electivesCats = cats && typeof cats === "object" ? cats : {};
        const has = Object.keys(electivesCats).length > 0;

        setElectivesByCategory(electivesCats);
        setHasElectives(has);

        // Cache the definition
        localStorage.setItem(
          defKey,
          JSON.stringify({
            cacheVersion: cacheVersion || "0",
            electivesByCategory: electivesCats,
          }),
        );

        if (!has) {
          setSelectedElectives({});
          setElectiveModalOpen(false);
          return;
        }

        // Determine selection: prefer cachedSel if valid; else defaults.
        const normalizedFromCache = normalizeElectiveSelection(
          cachedSel?.selectedElectives,
          electivesCats,
        );

        const hadStoredSelection = !!cachedSel?.selectedElectives;
        const nextSelection = hadStoredSelection
          ? normalizedFromCache
          : buildDefaultElectiveSelection(electivesCats);

        setSelectedElectives(nextSelection);

        // Cache selection (also ensures “new combo” won’t re-prompt after first init)
        localStorage.setItem(
          selKey,
          JSON.stringify({
            cacheVersion: cacheVersion || "0",
            selectedElectives: nextSelection,
          }),
        );

        // Auto-prompt only when:
        // - electives exist
        // - and this is a new (course,semester,phase) combo OR there was no stored selection
        const isNewCombo = lastElectiveComboRef.current !== comboKey;
        lastElectiveComboRef.current = comboKey;

        if (has && isNewCombo && !hadStoredSelection) {
          setElectiveModalOpen(true);
        }
      } catch (err) {
        console.error("Error fetching electives", err);
        // If server fails, keep whatever cached state we already applied.
      }
    }

    loadElectives();
  }, [metadata, course, semester, phase, offline]);

  function persistElectiveSelection(nextSelection) {
    if (!course || !semester || !phase) return;
    const selKey = electivesSelStorageKey(course, semester, phase);

    let cacheVersion = "0";
    const existing = localStorage.getItem(selKey);
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        cacheVersion = parsed?.cacheVersion || "0";
      } catch {
        cacheVersion = "0";
      }
    }

    localStorage.setItem(
      selKey,
      JSON.stringify({
        cacheVersion,
        selectedElectives: nextSelection,
      }),
    );
  }

  function handleElectiveSelect(category, val) {
    setSelectedElectives((prev) => {
      const next = { ...(prev || {}), [category]: val };
      persistElectiveSelection(next);
      return next;
    });
  }

  function openElectiveSelector() {
    if (!hasElectives) return;
    setElectiveModalOpen(true);
  }

  // 3) Load classes whenever filters or metadata or offline change
  React.useEffect(() => {
    if (!metadata || !course || !semester || !phase || !day) return;

    async function loadAllClasses() {
      const cacheKey = `allClasses_${course}_${semester}_${phase}_${batch}`;

      let cachedObj = null;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        cachedObj = JSON.parse(cached);
        setRawAllDaysClasses(cachedObj.classes || {});
      } else {
        setShowSkeleton(true);
      }

      if (offline) {
        setShowSkeleton(false);
        return;
      }

      try {
        setUpdateStatus("checking-classes");
        const versionUrl = `/api/allclasses-version?course=${encodeURIComponent(
          course,
        )}&semester=${encodeURIComponent(semester)}&phase=${encodeURIComponent(
          phase,
        )}&batch=${encodeURIComponent(batch)}`;

        const versionData = await fetchJsonNoCache(versionUrl);
        const currentServerVersion = versionData.cacheVersion;

        let needUpdate = true;
        if (cachedObj && cachedObj.cacheVersion === currentServerVersion) {
          needUpdate = false;
        }

        if (needUpdate) {
          setUpdateStatus("updating-classes");
          const urlAll = `/api/allclasses?course=${encodeURIComponent(
            course,
          )}&semester=${encodeURIComponent(semester)}&phase=${encodeURIComponent(
            phase,
          )}&batch=${encodeURIComponent(batch)}`;

          const allData = await fetchJsonNoCache(urlAll);

          localStorage.setItem(cacheKey, JSON.stringify(allData));
          setRawAllDaysClasses(allData.classes || {});
        }

        setUpdateStatus("");
      } catch (err) {
        console.error("Error fetching classes", err);
        setUpdateStatus("error-classes");
      } finally {
        setShowSkeleton(false);
      }
    }

    loadAllClasses();
  }, [metadata, course, semester, phase, batch, day, offline]);

  // NEW: Build filtered day/week view whenever raw data OR elective selection OR day changes
  React.useEffect(() => {
    const rawWeek = rawAllDaysClasses || {};

    // 1) Apply electives filtering
    const filteredWeek = filterWeekByElectives(
      rawWeek,
      selectedElectives || {},
    );

    // 2) NEW: sort each day AFTER filtering
    const sortedWeek = {};
    for (const [d, list] of Object.entries(filteredWeek || {})) {
      sortedWeek[d] = sortClassesByTime(list);
    }

    setAllDaysClasses(sortedWeek);

    const classesForDay = sortedWeek?.[day] || [];
    setTimelineItems(classesForDay);

    // Unique times for timeline
    const allTimes = [];
    classesForDay.forEach((item) => {
      if (item?.start) allTimes.push(item.start);
      if (item?.end) allTimes.push(item.end);
    });
    const unique = Array.from(new Set(allTimes));
    unique.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    setUniqueTimes(unique);

    // Card refs (must match sorted order)
    cardRefs.current = classesForDay.map(() => React.createRef());

    // Breaks (based on visible classes) — classesForDay is already sorted now
    const gaps = [];
    for (let i = 0; i < classesForDay.length - 1; i++) {
      const currentEndMin = timeToMinutes(classesForDay[i].end);
      const nextStartMin = timeToMinutes(classesForDay[i + 1].start);
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
          gaps.push({
            start: classesForDay[i].end,
            end: classesForDay[i + 1].start,
            durationMinutes: durationMin,
            durationReadable: durationReadable || "0 min",
          });
        }
      }
    }
    setBreaks(gaps);
  }, [rawAllDaysClasses, selectedElectives, day]);

  function isCardTimeActive(item) {
    const startMin = timeToMinutes(item.start);
    const endMin = timeToMinutes(item.end);
    return (
      currentTimeMin >= startMin &&
      currentTimeMin <= endMin &&
      daysOfWeek[new Date().getDay()] === day
    );
  }

  const courses = metadata?.courses || [];
  const semestersForCourse = course ? metadata?.semesters[course] || [] : [];
  const phasesForCourseSem =
    course && semester ? metadata?.phases?.[course]?.[semester] || [] : [];
  const batchesForCourseSemPhase =
    course && semester && phase
      ? metadata?.batches?.[course]?.[semester]?.[phase] || []
      : [];

  function handleCourseChange(val) {
    setCourse(val);
    localStorage.setItem("selectedCourse", val);

    const firstSem = (metadata?.semesters[val] || [])[0];
    const newSem = firstSem ? firstSem.id : "";
    setSemester(newSem);
    if (newSem) localStorage.setItem("selectedSemester", newSem);
    else localStorage.removeItem("selectedSemester");

    let newPhase = "1";
    if (newSem) {
      const possiblePhases = metadata?.phases?.[val]?.[newSem] || [];
      newPhase = possiblePhases[0]?.id ?? "1";
    }
    setPhase(newPhase);
    localStorage.setItem("selectedPhase", newPhase);

    let newBatch = "";
    if (newSem) {
      const possibleBatches =
        metadata?.batches?.[val]?.[newSem]?.[newPhase] || [];
      if (possibleBatches.length > 0) newBatch = possibleBatches[0].id;
    }
    setBatch(newBatch);
    if (newBatch) localStorage.setItem("selectedBatch", newBatch);
    else localStorage.removeItem("selectedBatch");
  }

  function handleSemesterChange(val) {
    setSemester(val);
    localStorage.setItem("selectedSemester", val);

    let newPhase = "1";
    const possiblePhases = metadata?.phases?.[course]?.[val] || [];
    if (possiblePhases.length > 0) {
      newPhase = possiblePhases[0].id;
    }
    setPhase(newPhase);
    localStorage.setItem("selectedPhase", newPhase);

    let newBatch = "";
    const possibleBatches =
      metadata?.batches?.[course]?.[val]?.[newPhase] || [];
    if (possibleBatches.length > 0) {
      newBatch = possibleBatches[0].id;
    }
    setBatch(newBatch);
    if (newBatch) localStorage.setItem("selectedBatch", newBatch);
    else localStorage.removeItem("selectedBatch");
  }

  function handlePhaseChange(val) {
    setPhase(val);
    localStorage.setItem("selectedPhase", val);

    let newBatch = "";
    const possibleBatches =
      metadata?.batches?.[course]?.[semester]?.[val] || [];
    if (possibleBatches.length > 0) {
      newBatch = possibleBatches[0].id;
    }
    setBatch(newBatch);
    if (newBatch) localStorage.setItem("selectedBatch", newBatch);
    else localStorage.removeItem("selectedBatch");
  }

  function handleBatchChange(val) {
    setBatch(val);
    localStorage.setItem("selectedBatch", val);
  }

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.onstatechange = () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setServiceWorkerUpdated(true);
                setServiceWorkerRegistration(registration);
              }
            };
          }
        };
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const changeDay = (direction) => {
    const currentIndex = daysOfWeek.indexOf(day);
    const newIndex =
      (currentIndex + direction + daysOfWeek.length) % daysOfWeek.length;
    setSlideDirection(direction);
    setDay(daysOfWeek[newIndex]);
  };

  const [slideDirection, setSlideDirection] = React.useState(0);
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (tableMode) return;
      changeDay(1);
    },
    onSwipedRight: () => {
      if (tableMode) return;
      changeDay(-1);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false,
  });

  React.useEffect(() => {
    if (tableMode) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        changeDay(-1);
      } else if (e.key === "ArrowRight") {
        changeDay(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [day, tableMode]);

  React.useEffect(() => {
    if (tableMode) return;
    let lastSwipeTime = 0;
    const MIN_SWIPE_DISTANCE = 50;
    const SWIPE_COOLDOWN_MS = 500;

    const handleWheel = (e) => {
      const now = Date.now();
      if (now - lastSwipeTime < SWIPE_COOLDOWN_MS) return;

      const absX = Math.abs(e.deltaX);
      if (absX > Math.abs(e.deltaY) && absX > MIN_SWIPE_DISTANCE) {
        lastSwipeTime = now;

        const flip = localStorage.getItem("scrollSwitch") === "true";
        const base = e.deltaX > 0 ? 1 : -1;
        const direction = flip ? -base : base;

        setSlideDirection(direction);
        setDay((prevDay) => {
          const currentIndex = daysOfWeek.indexOf(prevDay);
          const nextIndex =
            (currentIndex + direction + daysOfWeek.length) % daysOfWeek.length;
          return daysOfWeek[nextIndex];
        });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [tableMode]);

  React.useEffect(() => {
    const hasSeenHint = localStorage.getItem("hasSeenSwipeHint");
    if (
      !hasSeenHint &&
      !showSkeleton &&
      timelineItems.length > 0 &&
      !tableMode
    ) {
      setShowSwipeHint(true);
    }
  }, [showSkeleton, timelineItems, tableMode]);

  function dismissHint() {
    setShowSwipeHint(false);
    localStorage.setItem("hasSeenSwipeHint", "true");
  }

  return {
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
    metadata,

    // electives API + UI hooks
    hasElectives,
    electivesByCategory,
    selectedElectives,
    electiveModalOpen,
    setElectiveModalOpen,
    handleElectiveSelect,
    openElectiveSelector,
  };
}
