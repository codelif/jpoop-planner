"use client"

import React from 'react'

export function BreaksSection({ breaks }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Breaks in the Day</h3>
      {!breaks?.length ? (
        <div className="p-3 rounded-md bg-black border border-gray-700 text-center">
          <span className="text-gray-400 text-sm">No breaks today</span>
        </div>
      ) : (
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
      )}
    </div>
  )
}
