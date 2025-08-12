"use client"

import React from 'react'

export function BreaksSection({ breaks }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Breaks in the Day</h3>
      {!breaks?.length ? (
        <div className="p-3 rounded-md bg-card border border-border text-center">
          <span className="text-muted-foreground text-sm">No breaks today</span>
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {breaks.map((b, i) => (
            <li key={i} className="p-3 rounded-md bg-card border border-border flex flex-col gap-1">
              <span className="text-card-foreground">
                {b.start} - {b.end}
              </span>
              <span className="text-muted-foreground">{b.durationReadable}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
