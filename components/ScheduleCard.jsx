"use client"

import { Calendar, User, Users, MapPin, BookOpen, FileText, FlaskConical, Tag } from "lucide-react"

/**
 * ScheduleCard - Renders details for a single class item.
 */

export const getTypeBadge = (type) => {
  switch (type) {
    case 'L':
      return { label: 'Lecture', icon: <BookOpen className="h-4 w-4" /> }
    case 'T':
      return { label: 'Tutorial', icon: <FileText className="h-4 w-4" /> }
    case 'P':
      return { label: 'Lab', icon: <FlaskConical className="h-4 w-4" /> }
    default:
      return { label: type, icon: <Tag className="h-4 w-4" /> }
  }
}

export function ScheduleCard({ item, timeActive }) {
  let borderClasses = "border border-border"
  if (timeActive) {
    borderClasses = "border-4 border-primary"
  }


  const { label, icon } = getTypeBadge(item.type)

  return (
    <div
      className={`relative p-4 rounded-xl bg-card ${borderClasses} shadow-lg hover:scale-[1.01] transition-transform duration-300 ease-in-out`}
      style={{ wordBreak: 'break-word' }}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Calendar className="h-4 w-4" />
        <span>{item.start} - {item.end}</span>
        <div className="flex-1 border-t border-border mx-2" />
      </div>

      <h2 className="text-2xl font-bold mb-3 text-card-foreground">{item.subject}</h2>

      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mb-4" />

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-accent text-sm text-accent-foreground">
          {icon} {label}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-accent text-sm text-accent-foreground">
          <User className="h-4 w-4" /> {item.teacher}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-accent text-sm text-accent-foreground">
          <Users className="h-4 w-4" /> {item.batches.join(", ")}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-accent text-sm text-accent-foreground">
          <MapPin className="h-4 w-4" /> {item.venue}
        </div>
      </div>
    </div>
  )
}
