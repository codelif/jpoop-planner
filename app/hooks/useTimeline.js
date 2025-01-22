"use client"

import * as React from "react"

/**
 * Convert "HH:MM AM/PM" → total minutes from midnight.
 */
function timeToMinutes(timeStr) {
  const [time, meridiem] = timeStr.split(" ")
  let [hours, minutes] = time.split(":").map(Number)
  if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

/**
 * Hook to measure schedule card positions and animate a timeline dot.
 * 
 * @param {Array} timelineItems - The schedule items (each with start/end).
 * @param {Array} cardRefs - Refs to each schedule card element.
 * 
 * @returns {Object} 
 *   { lineRef, dotPosition, activeIndex, isTimeWithinActiveCard }
 */
export function useTimeline(timelineItems, cardRefs) {
  // The timeline line
  const lineRef = React.useRef(null)

  // Instead of storing in state, store measured positions & lineHeight in refs:
  const positionsRef = React.useRef({})
  const lineHeightRef = React.useRef(500)

  // We'll keep only the data we want to re-render on in React state:
  const [dotPosition, setDotPosition] = React.useState(0)
  const [activeIndex, setActiveIndex] = React.useState(null)

  // This ref holds the "target" y-value for the dot, used in the animation loop.
  const targetDotPosition = React.useRef(0)

  // -- HELPER: figure out which class is "active" for the dot's position
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

  // -- HELPER: measure all card positions relative to the timeline line
  const measurePositions = React.useCallback(() => {
    if (!lineRef.current) return

    const lineRect = lineRef.current.getBoundingClientRect()
    const map = {}
    timelineItems.forEach((item, index) => {
      const cardEl = cardRefs[index]?.current
      if (!cardEl) return
      const cardRect = cardEl.getBoundingClientRect()
      // measure top/bottom relative to timeline line's top
      const topOffset = cardRect.top - lineRect.top
      const bottomOffset = cardRect.bottom - lineRect.top

      if (map[item.start] == null) map[item.start] = topOffset
      if (map[item.end] == null) map[item.end] = bottomOffset
    })

    // Store in a ref (does NOT trigger re‐render)
    positionsRef.current = map

    // Also figure out how long the timeline line should be
    const allOffsets = Object.values(map)
    if (allOffsets.length) {
      const maxPos = Math.max(...allOffsets)
      lineHeightRef.current = maxPos + 50
    }
  }, [timelineItems, cardRefs])

  // -- HELPER: update the dot's target position & figure out the active class
  const updateDotAndActive = React.useCallback(() => {
    // positionsRef + lineHeightRef are in refs, not state
    const { current: posMap } = positionsRef
    const lineHeight = lineHeightRef.current

    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    if (docHeight <= 0) {
      // No scrolling space
      targetDotPosition.current = 0
    } else {
      const scrollTop = window.scrollY || window.pageYOffset
      const scrollProgress = Math.min(1, Math.max(0, scrollTop / docHeight))
      const usableHeight = lineHeight - 20
      const newTop = 10 + scrollProgress * usableHeight
      targetDotPosition.current = newTop
    }

    // Which item is active, based on the new target position?
    const newActive = findActiveClassByPosition(targetDotPosition.current, posMap)
    setActiveIndex(newActive)
  }, [timelineItems])

  // On mount/whenever timelineItems or cardRefs change, measure once, then update positions
  React.useEffect(() => {
    measurePositions()   // measure
    updateDotAndActive() // then set dot position & active item
    // we do NOT add "positionsRef" or "lineHeightRef" as dependencies,
    // because they are stable refs and won't cause re-renders
  }, [measurePositions, updateDotAndActive])

  // On scroll or resize, re-measure or re-check the dot
  React.useEffect(() => {
    function onScroll() {
      updateDotAndActive()
    }
    function onResize() {
      // re-measure because card positions might shift
      measurePositions()
      updateDotAndActive()
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
    }
  }, [measurePositions, updateDotAndActive])

  // Animate the dot towards the target position
  React.useEffect(() => {
    let animationFrameId

    const animate = () => {
      setDotPosition((currentPos) => {
        const diff = targetDotPosition.current - currentPos
        if (Math.abs(diff) < 0.5) {
          return targetDotPosition.current // done
        }
        return currentPos + diff * 0.1 // approach target
      })
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  // For bolding times that fall within the active card's time range
  function isTimeWithinActiveCard(timeStr) {
    if (activeIndex == null) return false
    const activeItem = timelineItems[activeIndex]
    if (!activeItem) return false
    const tMin = timeToMinutes(timeStr)
    const startMin = timeToMinutes(activeItem.start)
    const endMin = timeToMinutes(activeItem.end)
    return tMin >= startMin && tMin <= endMin
  }

  // Return the minimal set that your Timeline component needs:
  return {
    lineRef,
    dotPosition,
    activeIndex,
    isTimeWithinActiveCard,
    // If your <Timeline> needs the final numeric line height:
    get lineHeight() {
      return lineHeightRef.current
    },
    // If your <Timeline> needs positions, could expose them similarly.
    get positions() {
      return positionsRef.current
    },
  }
}
