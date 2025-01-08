import * as React from 'react'

function timeToMinutes(timeStr) {
  const [time, meridiem] = timeStr.split(" ")
  let [hours, minutes] = time.split(":").map(Number)
  if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

/**
 * Timeline component handles all timeline logic:
 * - Measures card positions relative to line
 * - Handles scroll and resize events
 * - Moves the dot according to scroll
 * - Determines activeIndex (scroll-active card)
 * - Boldens checkpoint times within the active card's time range
 *
 * Props:
 * - timelineItems: array of item objects {start, end, ...}
 * - uniqueTimes: sorted array of all start/end times
 * - cardRefs: array of refs corresponding to each card
 */
export function Timeline({ timelineItems, uniqueTimes, cardRefs }) {
  const lineRef = React.useRef(null)

  const [positions, setPositions] = React.useState({})
  const [dotPosition, setDotPosition] = React.useState(0)
  const [lineHeight, setLineHeight] = React.useState(500)
  const targetDotPosition = React.useRef(0)
  const [activeIndex, setActiveIndex] = React.useState(null)

  React.useEffect(() => {
    function measureAndUpdate() {
      if (!lineRef.current) return
      const lineRect = lineRef.current.getBoundingClientRect()
      const timePositionMap = {}

      timelineItems.forEach((item, index) => {
        const cardEl = cardRefs[index]?.current
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

      updateDotAndActive(timePositionMap)
    }

    function updateDotAndActive(posMap) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) {
        targetDotPosition.current = 0
      } else {
        const scrollTop = window.scrollY || window.pageYOffset
        const scrollProgress = Math.min(1, Math.max(0, scrollTop / docHeight))
        const usableHeight = (lineHeight) - 20
        const newTop = 10 + scrollProgress * usableHeight
        targetDotPosition.current = newTop
      }

      setActiveIndex(findActiveClassByPosition(targetDotPosition.current, posMap || positions))
    }

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
  }, [timelineItems, cardRefs, lineHeight])

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

  function findActiveClassByPosition(dotPos, posMap) {
    for (let i = 0; i < timelineItems.length; i++) {
      const item = timelineItems[i]
      const startPos = posMap[item.start]
      const endPos = posMap[item.end]
      if (startPos != null && endPos != null) {
        if (dotPos >= startPos && dotPos <= endPos) {
          return i
        }
      }
    }
    return null
  }

  function isTimeWithinActiveCard(t) {
    if (activeIndex == null) return false
    const activeItem = timelineItems[activeIndex]
    const tMin = timeToMinutes(t)
    const startMin = timeToMinutes(activeItem.start)
    const endMin = timeToMinutes(activeItem.end)
    return tMin >= startMin && tMin <= endMin
  }

  return (
    <div className="relative" style={{ minWidth: '40px' }}>
      <div
        ref={lineRef}
        className="relative w-[2px] bg-gray-300 dark:bg-gray-600 mx-auto transition-all"
        style={{ height: lineHeight }}
      >
        <div
          className="absolute w-4 h-4 rounded-full bg-primary shadow"
          style={{ left: '50%', transform: 'translateX(-50%)', top: dotPosition }}
        ></div>

        {uniqueTimes.map((t) => {
          const pos = positions[t]
          if (pos == null) return null
          const active = isTimeWithinActiveCard(t)

          return (
            <div key={t} className="absolute transition-all" style={{ top: pos, left: '50%', transform: 'translateX(-50%)' }}>
              <div className="w-2 h-2 rounded-full bg-foreground"></div>
              <span
                className={
                  `absolute text-xs whitespace-nowrap ` +
                  (active ? "text-foreground font-bold" : "text-muted-foreground")
                }
                style={{ left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' }}
              >
                {t}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
