"use client"

import * as React from 'react'
import { Timeline } from "@/components/Timeline"
import { CardItem } from "@/components/CardItem"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"

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
  const [currentTimeMin, setCurrentTimeMin] = React.useState(getCurrentTimeMin())

  // Metadata and filters
  const [metadata, setMetadata] = React.useState(null)
  const [day, setDay] = React.useState(daysOfWeek[new Date().getDay()])
  const [course, setCourse] = React.useState("")
  const [semester, setSemester] = React.useState("")
  const [batch, setBatch] = React.useState("")

  // Classes data
  const [timelineItems, setTimelineItems] = React.useState([])
  const [uniqueTimes, setUniqueTimes] = React.useState([])

  const [filtersOpen, setFiltersOpen] = React.useState(false) // For Collapsible
  const [loading, setLoading] = React.useState(true)
  const [offline, setOffline] = React.useState(!navigator.onLine)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMin(getCurrentTimeMin())
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

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
      if (cachedMetadata) {
        data = JSON.parse(cachedMetadata)
      } else if (!offline) {
        // Fetch only if online
        const res = await fetch("/api/metadata")
        data = await res.json()
        localStorage.setItem("metadata", JSON.stringify(data))
      } else {
        // Offline and no cached metadata
        data = null
      }
      setMetadata(data)

      const savedCourse = localStorage.getItem("selectedCourse")
      const savedSemester = localStorage.getItem("selectedSemester")
      const savedBatch = localStorage.getItem("selectedBatch")

      let defaultCourse = ""
      let defaultSemester = ""
      let defaultBatch = ""

      if (data) {
        if (savedCourse && data.courses.some(c => c.id === savedCourse)) {
          defaultCourse = savedCourse
        } else if (data.courses.length > 0) {
          defaultCourse = data.courses[0].id
        }

        if (defaultCourse) {
          const semestersForCourse = data.semesters[defaultCourse] || []
          if (savedSemester && semestersForCourse.some(s => s.id === savedSemester)) {
            defaultSemester = savedSemester
          } else if (semestersForCourse.length > 0) {
            defaultSemester = semestersForCourse[0].id
          }

          if (defaultSemester) {
            const batchesForCourseSem = data.batches[defaultCourse]?.[defaultSemester] || []
            if (savedBatch && batchesForCourseSem.some(b => b.id === savedBatch)) {
              defaultBatch = savedBatch
            } else if (batchesForCourseSem.length > 0) {
              defaultBatch = batchesForCourseSem[0].id
            }
          }
        }
      }

      setCourse(defaultCourse)
      setSemester(defaultSemester)
      setBatch(defaultBatch)
    }
    loadMetadata().catch(console.error)
  }, [offline])

  // Load allclasses
  React.useEffect(() => {
    if (!metadata || !course || !semester || !batch || !day) {
      setLoading(false) // If we don't have enough info, just stop loading.
      return
    }

    let canceled = false
    setLoading(true)

    async function loadAllClasses() {
      const cacheKey = `allClasses_${course}_${semester}_${batch}`

      // Check version only if online
      let currentServerVersion = null
      if (!offline) {
        const versionUrl = `/api/allclasses-version?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&batch=${encodeURIComponent(batch)}`
        const versionRes = await fetch(versionUrl)
        const versionData = await versionRes.json()
        currentServerVersion = versionData.cacheVersion
      }

      const cachedAll = localStorage.getItem(cacheKey)
      if (cachedAll) {
        const cachedData = JSON.parse(cachedAll)
        // If offline and have cachedData, use it even if we can't verify version
        if (offline || (currentServerVersion && cachedData.cacheVersion === currentServerVersion)) {
          if (!canceled) {
            setDataForTimeline(cachedData.classes[day] || [])
            setLoading(false)
          }
          return
        } else {
          // version mismatch and we are online, or no version match
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

      // Fetch from allclasses
      const urlAll = `/api/allclasses?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&batch=${encodeURIComponent(batch)}`
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
  }, [metadata, course, semester, batch, day, offline])

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

  function isCardTimeActive(item) {
    const startMin = timeToMinutes(item.start)
    const endMin = timeToMinutes(item.end)
    return currentTimeMin >= startMin && currentTimeMin <= endMin
  }

  const courses = metadata?.courses || []
  const semestersForCourse = course ? (metadata?.semesters[course] || []) : []
  const batchesForCourseSem = (course && semester) ? (metadata?.batches[course]?.[semester] || []) : []

  function handleCourseChange(val) {
    setCourse(val)
    localStorage.setItem("selectedCourse", val)
    const firstSem = (metadata?.semesters[val] || [])[0]
    const newSem = firstSem ? firstSem.id : ""
    setSemester(newSem)
    if (newSem) localStorage.setItem("selectedSemester", newSem)
    else localStorage.removeItem("selectedSemester")

    if (newSem) {
      const firstBatch = (metadata?.batches[val]?.[newSem] || [])[0]
      const newBatch = firstBatch ? firstBatch.id : ""
      setBatch(newBatch)
      if (newBatch) localStorage.setItem("selectedBatch", newBatch)
      else localStorage.removeItem("selectedBatch")
    } else {
      setBatch("")
      localStorage.removeItem("selectedBatch")
    }
  }

  function handleSemesterChange(val) {
    setSemester(val)
    localStorage.setItem("selectedSemester", val)
    const firstBatch = (metadata?.batches[course]?.[val] || [])[0]
    const newBatch = firstBatch ? firstBatch.id : ""
    setBatch(newBatch)
    if (newBatch) localStorage.setItem("selectedBatch", newBatch)
    else localStorage.removeItem("selectedBatch")
  }

  function handleBatchChange(val) {
    setBatch(val)
    localStorage.setItem("selectedBatch", val)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 relative space-y-6">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Filters</h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost">{filtersOpen ? "Hide" : "Show"}</Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Day Select */}
              <div className="flex items-center gap-2">
                <span>Day:</span>
                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Course */}
              <div className="flex items-center gap-2">
                <span>Course:</span>
                <Select value={course} onValueChange={handleCourseChange} disabled={courses.length === 0}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Semester */}
              <div className="flex items-center gap-2">
                <span>Semester:</span>
                <Select value={semester} onValueChange={handleSemesterChange} disabled={semestersForCourse.length === 0}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semestersForCourse.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Batch */}
              <div className="flex items-center gap-2">
                <span>Batch:</span>
                <Select value={batch} onValueChange={handleBatchChange} disabled={batchesForCourseSem.length === 0}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batchesForCourseSem.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {loading ? (
          <div className="relative flex gap-16">
            {/* Timeline skeleton */}
            <div className="relative" style={{ minWidth: '50px' }}>
              <div className="relative w-[2px] bg-gray-300 dark:bg-gray-600 mx-auto transition-all" style={{ height: '500px' }}>
                <div className="absolute w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700" style={{ left: '50%', transform: 'translateX(-50%)', top: '50%' }}></div>
                <div className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full" style={{ top: '20%', left: '50%', transform: 'translateX(-50%)' }}></div>
                <div className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full" style={{ top: '40%', left: '50%', transform: 'translateX(-50%)' }}></div>
                <div className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full" style={{ top: '60%', left: '50%', transform: 'translateX(-50%)' }}></div>
                <div className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full" style={{ top: '80%', left: '50%', transform: 'translateX(-50%)' }}></div>
              </div>
            </div>

            {/* Card skeletons */}
            <div className="flex-1 space-y-10 text-foreground transition-all">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 rounded-md bg-gradient-to-br from-background to-accent/10 border border-muted shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/4 mb-2 rounded"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-700 w-1/3 mb-3 rounded"></div>
                  <div className="h-[2px] bg-gray-300 dark:bg-gray-700 w-full mb-4"></div>
                  <div className="flex flex-wrap gap-3">
                    <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded"></div>
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
                const timeActive = isCardTimeActive(item)
                return (
                  <div key={index} ref={cardRefs.current[index]}>
                    <CardItem item={item} timeActive={timeActive} />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
