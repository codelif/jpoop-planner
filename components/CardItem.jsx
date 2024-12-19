import { Calendar, User, Users, MapPin } from "lucide-react"

export function CardItem({ item, timeActive }) {
  let borderClasses = "border border-muted"
  if (timeActive) {
    borderClasses = "border-4 border-foreground"
  }

  return (
    <div 
      className={`relative p-4 rounded-md bg-gradient-to-br from-background to-accent/10 ${borderClasses} shadow-sm hover:scale-[1.01] transition-transform duration-300 ease-in-out`}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Calendar className="h-4 w-4" />
        <span>{item.start} - {item.end}</span>
        <div className="flex-1 border-t border-muted mx-2" />
      </div>

      <h2 className="text-2xl font-bold mb-3">{item.subject}</h2>

      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mb-4"></div>
      
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-muted bg-muted/20 text-sm">
          <User className="h-4 w-4" /> {item.teacher}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-muted bg-muted/20 text-sm">
          <Users className="h-4 w-4" /> {item.batches.join(", ")}
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-muted bg-muted/20 text-sm">
          <MapPin className="h-4 w-4" /> {item.venue}
        </div>
      </div>
    </div>
  )
}
