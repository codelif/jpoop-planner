
function timeToMinutes(timeStr) {
  const [time, meridiem] = timeStr.split(" ")
  let [hours, minutes] = time.split(":").map(Number)
  if (meridiem.toUpperCase() === "PM" && hours < 12) hours += 12
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
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

export { timelineItems, uniqueTimes, timeToMinutes }
