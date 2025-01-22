"use client"

import * as React from 'react'
import { Timeline } from "@/components/Timeline"
import { CardItem } from "@/components/CardItem"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { useSwipeable } from "react-swipeable";
import { SwipeHint } from "@/components/SwipeHint"
import { motion, AnimatePresence } from "framer-motion"
import { UpdateIndicator } from "@/components/UpdateIndicator" // NEW COMPONENT FOR NOTIFICATION

const slideVariants = {
  enter: (direction) => ({
    position: 'absolute',
    width: '100%',
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    position: 'relative',
    width: '100%',
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    position: 'absolute',
    width: '100%',
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
}

function timeToMinutes(timeStr) {
  const [time, meridiem] = timeStr.split(" ")
  let [hours, minutes] = time.split(":").map(Number)
  if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

function getCurrentTimeMin() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function Page() {
  const cardRefs = React.useRef([])

  // For highlighting the current time slot
  const [currentTimeMin, setCurrentTimeMin] = React.useState(getCurrentTimeMin())

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

  // UI states
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const [showSkeleton, setShowSkeleton] = React.useState(false) // replaced old "loading" usage
  const [offline, setOffline] = React.useState(!navigator.onLine)
  const [showSwipeHint, setShowSwipeHint] = React.useState(false)

  // A simple status string for “checking”, “updating”, “updated”, “error”, etc.
  const [updateStatus, setUpdateStatus] = React.useState("")

  // Keep current time updated every minute
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMin(getCurrentTimeMin())
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Monitor online/offline changes
  React.useEffect(() => {
    function handleOnline() { setOffline(false) }
    function handleOffline() { setOffline(true) }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 1) Load/fetch metadata on mount or if offline changes
  React.useEffect(() => {
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
        const res = await fetch("/api/metadata")
        const freshData = await res.json()

        // If local is null or versions differ, update local
        if (!localData || freshData.version !== localData.version) {
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
      if (savedCourse && metadata.courses.some(c => c.id === savedCourse)) {
        defaultCourse = savedCourse
      } else {
        defaultCourse = metadata.courses[0].id
      }
    }

    // semester
    const semestersForCourse = metadata.semesters[defaultCourse] || []
    if (semestersForCourse.length > 0) {
      if (savedSemester && semestersForCourse.some(s => s.id === savedSemester)) {
        defaultSemester = savedSemester
      } else {
        defaultSemester = semestersForCourse[0].id
      }
    }

    // phase
    const phasesForCourseSem = metadata?.phases?.[defaultCourse]?.[defaultSemester] || []
    if (phasesForCourseSem.length > 0) {
      if (savedPhase && phasesForCourseSem.some(p => p.id === savedPhase)) {
        defaultPhase = savedPhase
      } else {
        defaultPhase = phasesForCourseSem[0].id
      }
    }

    // batch
    const batchesForCourseSemPhase = metadata?.batches?.[defaultCourse]?.[defaultSemester]?.[defaultPhase] || []
    if (batchesForCourseSemPhase.length > 0) {
      if (savedBatch && batchesForCourseSemPhase.some(b => b.id === savedBatch)) {
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

  React.useEffect(() => {
    // If we haven’t loaded metadata yet, or missing required filters, skip
    if (!metadata || !course || !semester || !phase || !day) {
      return
    }

    async function loadAllClasses() {
      const cacheKey = `allClasses_${course}_${semester}_${phase}_${batch}`
      let localClasses = null
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const cachedJSON = JSON.parse(cached)
        setDataForTimeline(cachedJSON.classes[day] || [])
      } else {
        setShowSkeleton(true)
      }

      if (offline) {
        setShowSkeleton(false)
        return
      }

      try {
        setUpdateStatus("checking-classes")
        const versionUrl = `/api/allclasses-version?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&phase=${encodeURIComponent(phase)}&batch=${encodeURIComponent(batch)}`
        const versionRes = await fetch(versionUrl)
        const versionData = await versionRes.json()
        const currentServerVersion = versionData.cacheVersion

        let needUpdate = true
        if (cached) {
          const cachedObj = JSON.parse(cached)
          if (cachedObj.cacheVersion && cachedObj.cacheVersion === currentServerVersion) {
            needUpdate = false
          }
        }

        if (needUpdate) {
          setUpdateStatus("updating-classes")
          // fetch new
          const urlAll = `/api/allclasses?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&phase=${encodeURIComponent(phase)}&batch=${encodeURIComponent(batch)}`
          const allRes = await fetch(urlAll)
          const allData = await allRes.json()

          localStorage.setItem(cacheKey, JSON.stringify(allData))
          setDataForTimeline(allData.classes[day] || [])
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

  // Helper to set the timeline items and unique times
  function setDataForTimeline(classesData) {
    setTimelineItems(classesData)
    const allTimes = []
    classesData.forEach(item => {
      allTimes.push(item.start, item.end)
    })
    const unique = Array.from(new Set(allTimes))
    unique.sort((a, b) => timeToMinutes(a) - timeToMinutes(b))
    setUniqueTimes(unique)
    cardRefs.current = classesData.map(() => React.createRef())
  }

  // Highlight the active card (if current time in range)
  function isCardTimeActive(item) {
    const startMin = timeToMinutes(item.start)
    const endMin = timeToMinutes(item.end)
    return currentTimeMin >= startMin && currentTimeMin <= endMin
      && daysOfWeek[new Date().getDay()] === day
  }

  // Filter-lists for dropdowns
  const courses = metadata?.courses || []
  const semestersForCourse = course ? (metadata?.semesters[course] || []) : []
  const phasesForCourseSem = (course && semester)
    ? (metadata?.phases?.[course]?.[semester] || [])
    : []
  const batchesForCourseSemPhase = (course && semester && phase)
    ? (metadata?.batches?.[course]?.[semester]?.[phase] || [])
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
      const possibleBatches = metadata?.batches?.[val]?.[newSem]?.[newPhase] || []
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
    const possibleBatches = metadata?.batches?.[course]?.[val]?.[newPhase] || []
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
    const possibleBatches = metadata?.batches?.[course]?.[semester]?.[val] || []
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

  // Register Service Worker (pull-to-refresh on mobile, etc.)
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  // Add swipe handlers to change days
  const [slideDirection, setSlideDirection] = React.useState(0)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = daysOfWeek.indexOf(day)
      const nextIndex = (currentIndex + 1) % daysOfWeek.length
      setSlideDirection(1)
      setDay(daysOfWeek[nextIndex])
    },
    onSwipedRight: () => {
      const currentIndex = daysOfWeek.indexOf(day)
      const prevIndex = (currentIndex - 1 + daysOfWeek.length) % daysOfWeek.length
      setSlideDirection(-1)
      setDay(daysOfWeek[prevIndex])
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  })

  // Possibly show “swipe hint” once
  React.useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint')
    if (!hasSeenHint && !showSkeleton && timelineItems.length > 0) {
      setShowSwipeHint(true)
    }
  }, [showSkeleton, timelineItems])

  function dismissHint() {
    setShowSwipeHint(false)
    localStorage.setItem('hasSeenSwipeHint', 'true')
  }

  // Render
  return (
    <div className="min-h-screen flex flex-col" {...swipeHandlers}>
      <Navbar />

      {/* UpdateIndicator is absolutely positioned (see its CSS). */}
      <UpdateIndicator status={updateStatus} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 relative">
        {/* Header and Filters */}
        <div className="bg-background/80 backdrop-blur-sm mb-4">
          <div className="flex items-center pl-[10px] justify-between mb-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{day}</span>
              {batch && <><span>•</span><span>{batch.toUpperCase()}</span></>}
            </div>
            <Button
              variant="outline"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="relative"
            >
              {filtersOpen ? "Hide Filters" : "Filters"}
            </Button>
          </div>

          <motion.div
            initial={false}
            animate={{
              height: filtersOpen ? "auto" : 0,
              opacity: filtersOpen ? 1 : 0
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut"
            }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-4 pb-4">
              {/* Day Select */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-right">Day:</span>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map(d => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Course */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-right">Course:</span>
                <Select
                  value={course}
                  onValueChange={handleCourseChange}
                  disabled={courses.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Semester */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-right">Semester:</span>
                <Select
                  value={semester}
                  onValueChange={handleSemesterChange}
                  disabled={semestersForCourse.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semestersForCourse.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phase */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-right">Phase:</span>
                <Select
                  value={phase}
                  onValueChange={handlePhaseChange}
                  disabled={phasesForCourseSem.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phasesForCourseSem.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch */}
              <div className="flex items-center gap-2">
                <span className="w-24 text-right">Batch:</span>
                <Select
                  value={batch}
                  onValueChange={handleBatchChange}
                  disabled={batchesForCourseSemPhase.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchesForCourseSemPhase.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main content area (timeline + cards) */}
        <div className="relative" style={{ minHeight: '500px' }}>
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
                opacity: { duration: 0.2 }
              }}
            >
              {showSkeleton ? (
                // Skeleton
                <div className="relative flex gap-16">
                  {/* Timeline skeleton */}
                  <div className="relative" style={{ minWidth: '50px' }}>
                    <div
                      className="relative w-[2px] bg-gray-300 dark:bg-gray-600 mx-auto transition-all"
                      style={{ height: '500px' }}
                    >
                      {/* Some skeleton circles */}
                      <div
                        className="absolute w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700"
                        style={{
                          left: '50%',
                          transform: 'translateX(-50%)',
                          top: '50%',
                        }}
                      />
                      <div
                        className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"
                        style={{
                          top: '20%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                      <div
                        className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"
                        style={{
                          top: '40%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                      <div
                        className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"
                        style={{
                          top: '60%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                      <div
                        className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"
                        style={{
                          top: '80%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Card skeletons */}
                  <div className="flex-1 space-y-10 text-foreground transition-all">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-md bg-gradient-to-br from-background to-accent/10 border border-muted shadow-sm animate-pulse"
                      >
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/4 mb-2 rounded" />
                        <div className="h-6 bg-gray-300 dark:bg-gray-700 w-1/3 mb-3 rounded" />
                        <div className="h-[2px] bg-gray-300 dark:bg-gray-700 w-full mb-4" />
                        <div className="flex flex-wrap gap-3">
                          <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
                          <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
                          <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : timelineItems.length === 0 ? (
                offline ? (
                  <div className="text-center text-muted-foreground">
                    You are offline and no cached data is available for these filters.
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No classes found for the selected filters.
                  </div>
                )
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
                          <CardItem item={item} timeActive={timeActive} className="card" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* small swipe-hint text or arrow */}
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
