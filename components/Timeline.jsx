"use client"

import * as React from 'react'
import { useTimeline } from '@/app/hooks/useTimeline'

/**
 * Timeline - A purely “render” component.
 * The logic is all in `useTimeline`. We pass in timelineItems + cardRefs,
 * and the hook returns the necessary data to position the timeline & dot.
 */
export function Timeline({ timelineItems, uniqueTimes, cardRefs }) {
  const {
    lineRef,
    positions,
    dotPosition,
    lineHeight,
    isTimeWithinActiveCard
  } = useTimeline(timelineItems, cardRefs)

  return (
    <div className="relative" style={{ minWidth: '40px' }}>
      <div
        ref={lineRef}
        className="relative w-[2px] bg-border mx-auto transition-all"
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
            <div
              key={t}
              className="absolute transition-all"
              style={{ top: pos, left: '50%', transform: 'translateX(-50%)' }}
            >
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
