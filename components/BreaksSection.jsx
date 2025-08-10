"use client"

import React from 'react'

export function BreaksSection({ breaks }) {
  if (!breaks?.length) return null
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Breaks in the Day</h3>
      <ul className="space-y-2 text-sm">
        {breaks.map((b, i) => (
          <li key={i} className="p-3 rounded-md bg-black border border-gray-700 flex flex-col gap-1">
            <span className="text-white">
              {b.start} - {b.end}
            </span>
            <span className="text-gray-400">{b.durationReadable}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
