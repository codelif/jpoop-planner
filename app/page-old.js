"use client"

import * as React from 'react'
import { Timeline } from "@/components/Timeline"
import { CardItem } from "@/components/CardItem"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

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

const timelineItems = [
  {
    start: "9:00 AM",
    end: "10:00 AM",
    subject: "Mathematics",
    teacher: "Dr. A Sharma",
    batches: ["Batch A", "Batch C"],
    venue: "Room 101"
  },
  {
    start: "10:15 AM",
    end: "11:15 AM",
    subject: "Physics",
    teacher: "Prof. K Gupta",
    batches: ["Batch B"],
    venue: "Room 202"
  },
  {
    start: "11:30 AM",
    end: "12:30 PM",
    subject: "Chemistry",
    teacher: "Dr. P Singh",
    batches: ["Batch A", "Batch B"],
    venue: "Room 303"
  },
  {
    start: "1:00 PM",
    end: "2:00 PM",
    subject: "Biology",
    teacher: "Dr. R Mehta",
    batches: ["Batch C"],
    venue: "Room 404"
  },
  {
    start: "2:15 PM",
    end: "3:15 PM",
    subject: "English Literature",
    teacher: "Prof. M Verma",
    batches: ["Batch A", "Batch B", "Batch C"],
    venue: "Room 505"
  },
]

const allTimes = []
timelineItems.forEach(item => {
  allTimes.push(item.start, item.end)
})
const uniqueTimes = Array.from(new Set(allTimes))
uniqueTimes.sort((a, b) => timeToMinutes(a) - timeToMinutes(b))

export default function Page() {
  const lineRef = React.useRef(null)
  const cardRefs = React.useRef([])

  const [positions, setPositions] = React.useState({})
  const [dotPosition, setDotPosition] = React.useState(0)
  const [lineHeight, setLineHeight] = React.useState(500)
  const targetDotPosition = React.useRef(0)

  const [currentTimeMin, setCurrentTimeMin] = React.useState(getCurrentTimeMin())
  const [activeIndex, setActiveIndex] = React.useState(null) // Card active by scroll

  cardRefs.current = timelineItems.map((_, i) => cardRefs.current[i] || React.createRef())

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMin(getCurrentTimeMin())
    }, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  function isCardTimeActive(item) {
    const startMin = timeToMinutes(item.start)
    const endMin = timeToMinutes(item.end)
    return currentTimeMin >= startMin && currentTimeMin <= endMin
  }

  function findActiveClassByPosition(dotPos) {
    for (let i = 0; i < timelineItems.length; i++) {
      const item = timelineItems[i]
      const startPos = positions[item.start]
      const endPos = positions[item.end]
      if (startPos != null && endPos != null) {
        if (dotPos >= startPos && dotPos <= endPos) {
          return i
        }
      }
    }
    return null
  }

  function measureAndUpdate() {
    if (!lineRef.current) return
    const lineRect = lineRef.current.getBoundingClientRect()
    const timePositionMap = {}

    timelineItems.forEach((item, index) => {
      const cardEl = cardRefs.current[index].current
      if (!cardEl) return
      const cardRect = cardEl.getBoundingClientRect()
      const topOffset = cardRect.top - lineRect.top
      const bottomOffset = cardRect.bottom - lineRect.top
      if (!timePositionMap[item.start]) timePositionMap[item.start] = topOffset
      if (!timePositionMap[item.end]) timePositionMap[item.end] = bottomOffset
    })

    setPositions(timePositionMap)

    const timeValues = Object.values(timePositionMap)
    if (timeValues.length > 0) {
      const maxPos = Math.max(...timeValues)
      setLineHeight(maxPos + 50)
    }

    updateDotAndActive()
  }

  function updateDotAndActive() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) {
      targetDotPosition.current = 0
    } else {
      const scrollTop = window.scrollY || window.pageYOffset
      const scrollProgress = Math.min(1, Math.max(0, scrollTop / docHeight))
      const usableHeight = lineHeight - 20
      const newTop = 10 + scrollProgress * usableHeight
      targetDotPosition.current = newTop
    }

    const activeIdx = findActiveClassByPosition(targetDotPosition.current)
    setActiveIndex(activeIdx)
  }

  React.useEffect(() => {
    function onScroll() {
      updateDotAndActive()
    }
    function onResize() {
      measureAndUpdate()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    measureAndUpdate()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [lineHeight])

  React.useEffect(() => {
    let animationFrameId
    const animate = () => {
      setDotPosition(pos => {
        const diff = targetDotPosition.current - pos
        if (Math.abs(diff) < 0.5) {
          return targetDotPosition.current
        }
        return pos + diff * 0.1
      })
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  // Bold the checkpoint times that are within the active card's time range
  function isTimeWithinActiveCard(t) {
    if (activeIndex == null) return false
    const activeItem = timelineItems[activeIndex]
    const tMin = timeToMinutes(t)
    const startMin = timeToMinutes(activeItem.start)
    const endMin = timeToMinutes(activeItem.end)
    return tMin >= startMin && tMin <= endMin
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar/>
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10 relative">
        <div className="relative flex gap-16">
          <div ref={lineRef}></div>
          <Timeline 
            positions={positions}
            lineHeight={lineHeight}
            dotPosition={dotPosition}
            uniqueTimes={uniqueTimes}
            isTimeWithinActiveCard={isTimeWithinActiveCard}
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
      </main>
      
      <Footer/>
    </div>
  )
}
