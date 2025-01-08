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
    zIndex: 1
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
  const [phase, setPhase] = React.useState("1")       // <-- phase added here
  const [batch, setBatch] = React.useState("")

  // Classes data
  const [timelineItems, setTimelineItems] = React.useState([])
  const [uniqueTimes, setUniqueTimes] = React.useState([])

  // UI state
  const [filtersOpen, setFiltersOpen] = React.useState(false) // For Collapsible
  const [loading, setLoading] = React.useState(true)
  const [offline, setOffline] = React.useState(!navigator.onLine)
  const [showSwipeHint, setShowSwipeHint] = React.useState(false)

  // Keeps current time updated every minute
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

  // Load metadata (cached in localStorage) or fetch
  React.useEffect(() => {
    async function loadMetadata() {
      let data
      const cachedMetadata = localStorage.getItem("metadata")
      if (cachedMetadata && offline) {
        // If we have cached metadata and are offline, use it
        data = JSON.parse(cachedMetadata)
      } else if (!offline) {
        // If online, fetch fresh metadata
        const res = await fetch("/api/metadata")
        data = await res.json()
        localStorage.setItem("metadata", JSON.stringify(data))
      } else {
        // Offline and no cached metadata
        data = null
      }

      setMetadata(data)

      // Retrieve saved filters
      const savedCourse = localStorage.getItem("selectedCourse")
      const savedSemester = localStorage.getItem("selectedSemester")
      const savedPhase = localStorage.getItem("selectedPhase") // <-- retrieve saved phase
      const savedBatch = localStorage.getItem("selectedBatch")

      let defaultCourse = ""
      let defaultSemester = ""
      let defaultPhase = "1"   // <-- default phase is 1
      let defaultBatch = ""

      if (data) {
        // COURSE
        if (savedCourse && data.courses.some(c => c.id === savedCourse)) {
          defaultCourse = savedCourse
        } else if (data.courses.length > 0) {
          defaultCourse = data.courses[0].id
        }

        // SEMESTER
        if (defaultCourse) {
          const semestersForCourse = data.semesters[defaultCourse] || []
          if (savedSemester && semestersForCourse.some(s => s.id === savedSemester)) {
            defaultSemester = savedSemester
          } else if (semestersForCourse.length > 0) {
            defaultSemester = semestersForCourse[0].id
          }
        }

        // PHASE
        // We assume metadata has a structure like metadata.phases[course][semester] = [ { id, name }, ... ]
        if (defaultCourse && defaultSemester) {
          const phasesForCourseSem = data?.phases?.[defaultCourse]?.[defaultSemester] || []
          if (
            savedPhase &&
            phasesForCourseSem.some(p => p.id === savedPhase)
          ) {
            defaultPhase = savedPhase
          } else if (phasesForCourseSem.length > 0) {
            defaultPhase = phasesForCourseSem[0].id
          }
        }

        // BATCH
        if (defaultCourse && defaultSemester && defaultPhase) {
          // We assume metadata.batches[course][semester][phase] = [ { id, name }, ... ]
          const batchesForCourseSemPhase =
            data?.batches?.[defaultCourse]?.[defaultSemester]?.[defaultPhase] || []
          if (
            savedBatch &&
            batchesForCourseSemPhase.some(b => b.id === savedBatch)
          ) {
            defaultBatch = savedBatch
          } else if (batchesForCourseSemPhase.length > 0) {
            defaultBatch = batchesForCourseSemPhase[0].id
          }
        }
      }

      setCourse(defaultCourse)
      setSemester(defaultSemester)
      setPhase(defaultPhase)      // <-- set default phase
      setBatch(defaultBatch)
    }
    loadMetadata().catch(console.error)
  }, [offline])

  // Load allclasses
  React.useEffect(() => {
    // We need all filters to be valid
    if (!metadata || !course || !semester || !phase || !day) {
      setLoading(false) // If we don't have enough info, just stop loading.
      return
    }

    let canceled = false
    setLoading(true)

    async function loadAllClasses() {
      // Construct a unique key including phase
      const cacheKey = `allClasses_${course}_${semester}_${phase}_${batch}`

      // Check version only if online
      let currentServerVersion = null
      if (!offline) {
        const versionUrl = `/api/allclasses-version?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&phase=${encodeURIComponent(phase)}&batch=${encodeURIComponent(batch)}`
        const versionRes = await fetch(versionUrl)
        const versionData = await versionRes.json()
        currentServerVersion = versionData.cacheVersion
      }

      // Check localStorage for cached version
      const cachedAll = localStorage.getItem(cacheKey)
      if (cachedAll) {
        const cachedData = JSON.parse(cachedAll)
        // If offline and have cached data, or if the version matches
        if (
          offline ||
          (currentServerVersion && cachedData.cacheVersion === currentServerVersion)
        ) {
          if (!canceled) {
            setDataForTimeline(cachedData.classes[day] || [])
            setLoading(false)
          }
          return
        } else {
          // version mismatch or no version on the server side
          localStorage.removeItem(cacheKey)
        }
      }

      // No valid cache or we need fresh data
      if (offline) {
        // Offline but no valid cache
        setDataForTimeline([]) // no data
        setLoading(false)
        return
      }

      // Fetch from allclasses including phase
      const urlAll = `/api/allclasses?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&phase=${encodeURIComponent(phase)}&batch=${encodeURIComponent(batch)}`
      const allRes = await fetch(urlAll)
      const allData = await allRes.json()
      if (canceled) return

      // Store in localStorage
      localStorage.setItem(cacheKey, JSON.stringify(allData))
      setDataForTimeline(allData.classes[day] || [])
      setLoading(false)
    }

    loadAllClasses().catch(e => {
      console.error(e)
      setLoading(false)
    })

    return () => {
      canceled = true
    }
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

  // To highlight active class
  function isCardTimeActive(item) {
    const startMin = timeToMinutes(item.start)
    const endMin = timeToMinutes(item.end)
    return currentTimeMin >= startMin && currentTimeMin <= endMin
  }

  // Prepare lists for filters
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

    // Reset semester when course changes
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

  // Add pull-to-refresh
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  // Add swipe handlers to change days
  const [slideDirection, setSlideDirection] = React.useState(0)

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = daysOfWeek.indexOf(day);
      const nextIndex = (currentIndex + 1) % daysOfWeek.length;
      setSlideDirection(1);
      setDay(daysOfWeek[nextIndex]);
    },
    onSwipedRight: () => {
      const currentIndex = daysOfWeek.indexOf(day);
      const prevIndex = (currentIndex - 1 + daysOfWeek.length) % daysOfWeek.length;
      setSlideDirection(-1);
      setDay(daysOfWeek[prevIndex]);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  React.useEffect(() => {
    // Show hint only if it hasn't been shown before
    const hasSeenHint = localStorage.getItem('hasSeenSwipeHint')
    if (!hasSeenHint && !loading && timelineItems.length > 0) {
      setShowSwipeHint(true)
    }
  }, [loading, timelineItems])

  function dismissHint() {
    setShowSwipeHint(false)
    localStorage.setItem('hasSeenSwipeHint', 'true')
  }

  return (
    <div className="min-h-screen flex flex-col" {...swipeHandlers}>
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 relative">
        {/* Header and Filters - Normal flow */}
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

              {/* Rest of your filter selects */}
              {/* Course Select */}
              <div className="flex items-center gap-2">
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

              </div>

              {/* Semester Select */}
              <div className="flex items-center gap-2">
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
              </div>

              {/* Phase Select */}
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

              {/* Batch Select */}
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

        {/* Main content */}
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
              {loading ? (
                <div className="relative flex gap-16">
                  {/* Timeline skeleton */}
                  <div className="relative" style={{ minWidth: '50px' }}>
                    <div
                      className="relative w-[2px] bg-gray-300 dark:bg-gray-600 mx-auto transition-all"
                      style={{ height: '500px' }}
                    >
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
                    You are offline and no cached data available for these filters.
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No classes found for the selected filters.
                  </div>
                )
              ) : (
                <div className="relative flex gap-16">
                  <Timeline
                    timelineItems={timelineItems}
                    uniqueTimes={uniqueTimes}
                    cardRefs={cardRefs.current}
                  />

                  <div className="flex-1 space-y-10 text-foreground transition-all">
                    {timelineItems.map((item, index) => {

                      const timeActive = isCardTimeActive(item) && daysOfWeek[new Date().getDay()] == day
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
        {!loading && timelineItems.length > 0 && (
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
