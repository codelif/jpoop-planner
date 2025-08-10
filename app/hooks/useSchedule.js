"use client"

import React from "react"
import { useSwipeable } from "react-swipeable"

function timeToMinutes(timeStr) {
  const [time, meridiem] = timeStr.split(" ")
  let [hours, minutes] = time.split(":").map(Number)
  if (meridiem?.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem?.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

function getCurrentTimeMin() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function useSchedule() {
  const cardRefs = React.useRef([])

  // For highlighting the current time slot
  const [currentTimeMin, setCurrentTimeMin] = React.useState(getCurrentTimeMin())

  // Service Worker update states
  const [serviceWorkerUpdated, setServiceWorkerUpdated] = React.useState(false)
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = React.useState(null)

  // Metadata and filters
  const [metadata, setMetadata] = React.useState(null)
  const [day, setDay] = React.useState(daysOfWeek[new Date().getDay()])
  const [course, setCourse] = React.useState("")
  const [semester, setSemester] = React.useState("")
  const [phase, setPhase] = React.useState("1")
  const [batch, setBatch] = React.useState("")

  // Classes data
  const [timelineItems, setTimelineItems] = React.useState([])
  const [uniqueTimes, setUniqueTimes] = React.useState([])
  const [breaks, setBreaks] = React.useState([])
  // Store the entire week's classes so we can display in Table Mode
  const [allDaysClasses, setAllDaysClasses] = React.useState({})

  // UI states
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [showSkeleton, setShowSkeleton] = React.useState(false)
  // Fix: Initialize offline state safely for SSR
  const [offline, setOffline] = React.useState(false)
  const [noScheduleResultsText, setNoScheduleResultsText] = React.useState("No classes found for the selected filters.")
  const [showSwipeHint, setShowSwipeHint] = React.useState(false)

  // A simple status string for "checking", "updating", "updated", "error", etc.
  const [updateStatus, setUpdateStatus] = React.useState("")

  // NEW: Table Mode
  const [tableMode, setTableMode] = React.useState(false)

  // Fix: Set initial offline state after component mounts
  React.useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setOffline(!navigator.onLine)
    }
  }, [])

  React.useEffect(() => {
    // On first mount, read tableMode from localStorage
    const stored = localStorage.getItem("tableMode")
    if (stored === "true") {
      setTableMode(true)
    }
  }, [])

  function handleToggleTableMode(value) {
    setTableMode(value)
    localStorage.setItem("tableMode", value ? "true" : "false")
  }

  // Keep current time updated every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMin(getCurrentTimeMin())
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Monitor online/offline changes - Fix: Check if navigator exists
  React.useEffect(() => {
    if (typeof navigator === 'undefined') return

    function handleOnline() {
      setOffline(false)
    }
    function handleOffline() {
      setOffline(true)
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // 1) Load/fetch metadata on mount or if offline changes
  React.useEffect(() => {
    if (offline) {
      setNoScheduleResultsText("You are offline and no cached data is available for these filters.");
    } else {
      setNoScheduleResultsText("No classes found for the selected filters.");
    }

    async function loadMetadata() {
      let localData = null
      const cached = localStorage.getItem("metadata")
      if (cached) {
        localData = JSON.parse(cached)
        setMetadata(localData)
      } else {
        setShowSkeleton(true)
      }

      if (offline) {
        setShowSkeleton(false)
        return
      }

      try {
        setUpdateStatus("checking-metadata")
        const res = await fetch("/api/metadata", {
          cache: 'no-store', // Force no caching
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        const freshData = await res.json()

        // If local is null or versions differ, update local
        if (!localData || freshData.cacheVersion !== localData.cacheVersion) {
          setUpdateStatus("updating-metadata")
          setMetadata(freshData)
          localStorage.setItem("metadata", JSON.stringify(freshData))
        }

        setUpdateStatus("") // done
      } catch (err) {
        console.error("Error fetching metadata", err)
        setUpdateStatus("error-metadata")
      } finally {
        setShowSkeleton(false)
      }
    }

    loadMetadata()
  }, [offline])

  // 2) Once metadata is loaded, set default filter values
  React.useEffect(() => {
    if (!metadata) return

    const savedCourse = localStorage.getItem("selectedCourse")
    const savedSemester = localStorage.getItem("selectedSemester")
    const savedPhase = localStorage.getItem("selectedPhase")
    const savedBatch = localStorage.getItem("selectedBatch")

    let defaultCourse = ""
    let defaultSemester = ""
    let defaultPhase = "1"
    let defaultBatch = ""

    // courses
    if (metadata.courses?.length > 0) {
      if (savedCourse && metadata.courses.some((c) => c.id === savedCourse)) {
        defaultCourse = savedCourse
      } else {
        defaultCourse = metadata.courses[0].id
      }
    }

    // semester
    const semestersForCourse = metadata.semesters[defaultCourse] || []
    if (semestersForCourse.length > 0) {
      if (
        savedSemester &&
        semestersForCourse.some((s) => s.id === savedSemester)
      ) {
        defaultSemester = savedSemester
      } else {
        defaultSemester = semestersForCourse[0].id
      }
    }

    // phase
    const phasesForCourseSem =
      metadata?.phases?.[defaultCourse]?.[defaultSemester] || []
    if (phasesForCourseSem.length > 0) {
      if (savedPhase && phasesForCourseSem.some((p) => p.id === savedPhase)) {
        defaultPhase = savedPhase
      } else {
        defaultPhase = phasesForCourseSem[0].id
      }
    }

    // batch
    const batchesForCourseSemPhase =
      metadata?.batches?.[defaultCourse]?.[defaultSemester]?.[defaultPhase] || []
    if (batchesForCourseSemPhase.length > 0) {
      if (
        savedBatch &&
        batchesForCourseSemPhase.some((b) => b.id === savedBatch)
      ) {
        defaultBatch = savedBatch
      } else {
        defaultBatch = batchesForCourseSemPhase[0].id
      }
    }

    setCourse(defaultCourse)
    setSemester(defaultSemester)
    setPhase(defaultPhase)
    setBatch(defaultBatch)
  }, [metadata])

  // 3) Load classes whenever filters or metadata or offline change
  React.useEffect(() => {
    if (!metadata || !course || !semester || !phase || !day) {
      return
    }

    async function loadAllClasses() {
      const cacheKey = `allClasses_${course}_${semester}_${phase}_${batch}`
      let localClasses = null
      const cached = localStorage.getItem(cacheKey)
      let cachedObj = null
      if (cached) {
        cachedObj = JSON.parse(cached)
        // We only set timeline for the *current day* here
        setDataForTimeline(cachedObj.classes[day] || [], cachedObj.classes)
      } else {
        setShowSkeleton(true)
      }

      if (offline) {
        setShowSkeleton(false)
        return
      }

      try {
        setUpdateStatus("checking-classes")
        const versionUrl = `/api/allclasses-version?course=${encodeURIComponent(
          course
        )}&semester=${encodeURIComponent(
          semester
        )}&phase=${encodeURIComponent(phase)}&batch=${encodeURIComponent(
          batch
        )}`
        
        const versionRes = await fetch(versionUrl, {
          cache: 'no-store', // Force no caching
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        const versionData = await versionRes.json()
        const currentServerVersion = versionData.cacheVersion

        let needUpdate = true
        if (cachedObj && cachedObj.cacheVersion === currentServerVersion) {
          needUpdate = false
        }

        if (needUpdate) {
          setUpdateStatus("updating-classes")
          // fetch new
          const urlAll = `/api/allclasses?course=${encodeURIComponent(
            course
          )}&semester=${encodeURIComponent(
            semester
          )}&phase=${encodeURIComponent(
            phase
          )}&batch=${encodeURIComponent(batch)}`
          
          const allRes = await fetch(urlAll, {
            cache: 'no-store', // Force no caching
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          const allData = await allRes.json()

          localStorage.setItem(cacheKey, JSON.stringify(allData))
          setDataForTimeline(allData.classes[day] || [], allData.classes)
        }

        setUpdateStatus("")
      } catch (err) {
        console.error("Error fetching classes", err)
        setUpdateStatus("error-classes")
      } finally {
        setShowSkeleton(false)
      }
    }

    loadAllClasses()
  }, [metadata, course, semester, phase, batch, day, offline])

  // Helper to set the timeline items and allDaysClasses
  function setDataForTimeline(classesForDay, allClassesForWeek) {
    setTimelineItems(classesForDay)
    // Also store the entire dictionary of { Sunday: [...], Monday: [...], ... }
    if (allClassesForWeek) {
      setAllDaysClasses(allClassesForWeek)
    }
    // Build unique times from the day's data
    const allTimes = []
    classesForDay.forEach((item) => {
      allTimes.push(item.start, item.end)
    })
    const unique = Array.from(new Set(allTimes))
    unique.sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
    setUniqueTimes(unique)
    cardRefs.current = classesForDay.map(() => React.createRef())

    const sorted = [...classesForDay].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
    const gaps = []
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEndMin = timeToMinutes(sorted[i].end)
      const nextStartMin = timeToMinutes(sorted[i + 1].start)
      if (nextStartMin > currentEndMin) {
        const durationMin = nextStartMin - currentEndMin
        if (durationMin >= 60) {
          const hr = Math.floor(durationMin / 60)
          const min = durationMin % 60
          const durationReadable = [
            hr ? `${hr} hr${hr > 1 ? 's' : ''}` : null,
            min ? `${min} min` : null,
          ].filter(Boolean).join(' ')
          gaps.push({
            start: sorted[i].end,
            end: sorted[i + 1].start,
            durationMinutes: durationMin,
            durationReadable: durationReadable || '0 min'
          })
        }
      }
    }
    setBreaks(gaps)
  }

  // Highlight the active card (if current time in range)
  function isCardTimeActive(item) {
    const startMin = timeToMinutes(item.start)
    const endMin = timeToMinutes(item.end)
    return (
      currentTimeMin >= startMin &&
      currentTimeMin <= endMin &&
      daysOfWeek[new Date().getDay()] === day
    )
  }

  // Filter-lists for dropdowns
  const courses = metadata?.courses || []
  const semestersForCourse = course ? metadata?.semesters[course] || [] : []
  const phasesForCourseSem = course && semester
    ? metadata?.phases?.[course]?.[semester] || []
    : []
  const batchesForCourseSemPhase =
    course && semester && phase
      ? metadata?.batches?.[course]?.[semester]?.[phase] || []
      : []

  // Handlers to update filters & localStorage
  function handleCourseChange(val) {
    setCourse(val)
    localStorage.setItem("selectedCourse", val)

    // Reset semester
    const firstSem = (metadata?.semesters[val] || [])[0]
    const newSem = firstSem ? firstSem.id : ""
    setSemester(newSem)
    if (newSem) localStorage.setItem("selectedSemester", newSem)
    else localStorage.removeItem("selectedSemester")

    // Reset phase
    let newPhase = "1"
    if (newSem) {
      const possiblePhases = metadata?.phases?.[val]?.[newSem] || []
      newPhase = possiblePhases[0]?.id ?? "1"
    }
    setPhase(newPhase)
    localStorage.setItem("selectedPhase", newPhase)

    // Reset batch
    let newBatch = ""
    if (newSem) {
      const possibleBatches =
        metadata?.batches?.[val]?.[newSem]?.[newPhase] || []
      if (possibleBatches.length > 0) newBatch = possibleBatches[0].id
    }
    setBatch(newBatch)
    if (newBatch) localStorage.setItem("selectedBatch", newBatch)
    else localStorage.removeItem("selectedBatch")
  }

  function handleSemesterChange(val) {
    setSemester(val)
    localStorage.setItem("selectedSemester", val)

    // Reset phase
    let newPhase = "1"
    const possiblePhases = metadata?.phases?.[course]?.[val] || []
    if (possiblePhases.length > 0) {
      newPhase = possiblePhases[0].id
    }
    setPhase(newPhase)
    localStorage.setItem("selectedPhase", newPhase)

    // Reset batch
    let newBatch = ""
    const possibleBatches =
      metadata?.batches?.[course]?.[val]?.[newPhase] || []
    if (possibleBatches.length > 0) {
      newBatch = possibleBatches[0].id
    }
    setBatch(newBatch)
    if (newBatch) localStorage.setItem("selectedBatch", newBatch)
    else localStorage.removeItem("selectedBatch")
  }

  function handlePhaseChange(val) {
    setPhase(val)
    localStorage.setItem("selectedPhase", val)

    // Reset batch
    let newBatch = ""
    const possibleBatches =
      metadata?.batches?.[course]?.[semester]?.[val] || []
    if (possibleBatches.length > 0) {
      newBatch = possibleBatches[0].id
    }
    setBatch(newBatch)
    if (newBatch) localStorage.setItem("selectedBatch", newBatch)
    else localStorage.removeItem("selectedBatch")
  }

  function handleBatchChange(val) {
    setBatch(val)
    localStorage.setItem("selectedBatch", val)
  }

  /**
   * Register the Service Worker and watch for updates.
   * If a new SW is installed and controlling the page, we set `serviceWorkerUpdated = true`.
   */
  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Listen for new Service Worker
        registration.onupdatefound = () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.onstatechange = () => {
              // If the new worker is installed and the page already has a controlling worker
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                setServiceWorkerUpdated(true)
                setServiceWorkerRegistration(registration)
              }
            }
          }
        }
      })
      .catch((err) => {
        console.error("SW registration failed:", err)
      })

    // Reload page when the new SW activates
    let refreshing = false
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    })
  }, [])

  const changeDay = (direction) => {
  const currentIndex = daysOfWeek.indexOf(day)
  const newIndex = (currentIndex + direction + daysOfWeek.length) % daysOfWeek.length
  setSlideDirection(direction)
  setDay(daysOfWeek[newIndex])
}

  // Add swipe handlers to change days (only if not in Table Mode)
  const [slideDirection, setSlideDirection] = React.useState(0)
  const swipeHandlers = useSwipeable({
  onSwipedLeft: () => {
    if (tableMode) return
    changeDay(1)
  },
  onSwipedRight: () => {
    if (tableMode) return
    changeDay(-1)
  },
  preventDefaultTouchmoveEvent: true,
  trackMouse: false,
})

React.useEffect(() => {
  if (tableMode) return

  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      changeDay(-1)
    } else if (e.key === "ArrowRight") {
      changeDay(1)
    }
  }

  window.addEventListener("keydown", handleKeyDown)
  return () => window.removeEventListener("keydown", handleKeyDown)
}, [day, tableMode])

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
      setDay(prevDay => {
        const currentIndex = daysOfWeek.indexOf(prevDay);
        const nextIndex = (currentIndex + direction + daysOfWeek.length) % daysOfWeek.length;
        return daysOfWeek[nextIndex];
      });
    }
  };

  window.addEventListener("wheel", handleWheel, { passive: true });
  return () => window.removeEventListener("wheel", handleWheel);
}, [tableMode]);

  // Possibly show "swipe hint" once if not in Table Mode
  React.useEffect(() => {
    const hasSeenHint = localStorage.getItem("hasSeenSwipeHint")
    if (!hasSeenHint && !showSkeleton && timelineItems.length > 0 && !tableMode) {
      setShowSwipeHint(true)
    }
  }, [showSkeleton, timelineItems, tableMode])

  function dismissHint() {
    setShowSwipeHint(false)
    localStorage.setItem("hasSeenSwipeHint", "true")
  }

  return {
    // Expose existing states and handlers
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

    // New Table Mode states
    tableMode,
    handleToggleTableMode,
    allDaysClasses,
  breaks,
  }
}
