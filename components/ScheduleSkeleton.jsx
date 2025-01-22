"use client"

export function ScheduleSkeleton() {
  return (
    <div className="relative flex gap-16">
      {/* Timeline skeleton */}
      <div className="relative" style={{ minWidth: "50px" }}>
        <div
          className="relative w-[2px] bg-gray-300 dark:bg-gray-600 mx-auto transition-all"
          style={{ height: "500px" }}
        >
          {/* Some skeleton circles */}
          <div
            className="absolute w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700"
            style={{
              left: "50%",
              transform: "translateX(-50%)",
              top: "50%",
            }}
          />
          <div
            className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"
            style={{
              top: "20%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
          <div
            className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"
            style={{
              top: "40%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
          <div
            className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"
            style={{
              top: "60%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
          <div
            className="absolute w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"
            style={{
              top: "80%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          />
        </div>
      </div>

      {/* Card skeletons */}
      <div className="flex-1 space-y-10 text-foreground transition-all">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-md bg-gradient-to-br from-background to-accent/10 border border-muted shadow-sm animate-pulse"
          >
            <div className="h-4 bg-gray-300 dark:bg-gray-700 w-1/4 mb-2 rounded" />
            <div className="h-6 bg-gray-300 dark:bg-gray-700 w-1/3 mb-3 rounded" />
            <div className="h-[2px] bg-gray-300 dark:bg-gray-700 w-full mb-4" />
            <div className="flex flex-wrap gap-3">
              <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="w-20 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
