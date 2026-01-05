from datetime import datetime, timedelta

DAY_MAP = {
    "monday": "MO",
    "tuesday": "TU",
    "wednesday": "WE",
    "thursday": "TH",
    "friday": "FR",
    "saturday": "SA",
    "sunday": "SU",
}


def next_weekday_date(day_name):
    today = datetime.now()
    target = list(DAY_MAP.keys()).index(day_name.lower())
    days_ahead = (target - today.weekday() + 7) % 7
    days_ahead = 7 if days_ahead == 0 else days_ahead
    return today + timedelta(days=days_ahead)


def parse_time(base_date, time_str):
    t = datetime.strptime(time_str, "%I:%M %p")
    return base_date.replace(hour=t.hour, minute=t.minute, second=0)


a = {
    "events": [
        {
            "summary": "Universal Human Values (UHV)",
            "description": "Shweta Verma | 116",
            "start": "2026-01-12T03:30:00.000Z",
            "end": "2026-01-12T04:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=MO",
            "colorId": 1,
        },
        {
            "summary": "Software Development Fundamentals-II",
            "description": "NMD | SR05",
            "start": "2026-01-12T04:30:00.000Z",
            "end": "2026-01-12T05:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=MO",
            "colorId": 2,
        },
        {
            "summary": "Universal Human Values (UHV)",
            "description": "Nilu Chaudhary | SR05",
            "start": "2026-01-12T05:30:00.000Z",
            "end": "2026-01-12T06:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=MO",
            "colorId": 1,
        },
        {
            "summary": "Physics-2",
            "description": "SHALU | 118",
            "start": "2026-01-12T07:30:00.000Z",
            "end": "2026-01-12T08:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=MO",
            "colorId": 3,
        },
        {
            "summary": "Mathematics-2",
            "description": "Pankaj Kumar Srivastava | 118",
            "start": "2026-01-12T08:30:00.000Z",
            "end": "2026-01-12T09:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=MO",
            "colorId": 4,
        },
        {
            "summary": "Universal Human Values (UHV)",
            "description": "Priyanka Kwatra | 3084",
            "start": "2026-01-08T03:30:00.000Z",
            "end": "2026-01-08T04:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TH",
            "colorId": 1,
        },
        {
            "summary": "Physics-2",
            "description": "SHALU | 3084",
            "start": "2026-01-08T04:30:00.000Z",
            "end": "2026-01-08T05:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TH",
            "colorId": 3,
        },
        {
            "summary": "Mathematics-2",
            "description": "Pankaj Kumar Srivastava | 3084",
            "start": "2026-01-08T05:30:00.000Z",
            "end": "2026-01-08T06:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TH",
            "colorId": 4,
        },
        {
            "summary": "Workshop",
            "description": "Niraj Kumar | WS04",
            "start": "2026-01-08T07:30:00.000Z",
            "end": "2026-01-08T10:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TH",
            "colorId": 5,
        },
        {
            "summary": "Mathematics-2",
            "description": "AMB | 118",
            "start": "2026-01-08T10:30:00.000Z",
            "end": "2026-01-08T11:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TH",
            "colorId": 4,
        },
        {
            "summary": "Universal Human Values (UHV)",
            "description": "Nilu Chaudhary | 3045",
            "start": "2026-01-08T10:30:00.000Z",
            "end": "2026-01-08T11:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TH",
            "colorId": 1,
        },
        {
            "summary": "Physics Lab-2",
            "description": "Bharti Arora | 41",
            "start": "2026-01-06T05:30:00.000Z",
            "end": "2026-01-06T07:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TU",
            "colorId": 6,
        },
        {
            "summary": "Universal Human Values (UHV)",
            "description": "Priyanka Kwatra | 228",
            "start": "2026-01-06T08:30:00.000Z",
            "end": "2026-01-06T09:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TU",
            "colorId": 1,
        },
        {
            "summary": "Software Development Fundamentals-II",
            "description": "NMD | 228",
            "start": "2026-01-06T09:30:00.000Z",
            "end": "2026-01-06T10:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TU",
            "colorId": 2,
        },
        {
            "summary": "Software Development Fundamentals-II",
            "description": "Baibhav | 3045",
            "start": "2026-01-06T10:30:00.000Z",
            "end": "2026-01-06T11:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=TU",
            "colorId": 2,
        },
        {
            "summary": "Physics-2",
            "description": "SHALU | 3023",
            "start": "2026-01-07T03:30:00.000Z",
            "end": "2026-01-07T04:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=WE",
            "colorId": 3,
        },
        {
            "summary": "Mathematics-2",
            "description": "Pankaj Kumar Srivastava | 3023",
            "start": "2026-01-07T04:30:00.000Z",
            "end": "2026-01-07T05:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=WE",
            "colorId": 4,
        },
        {
            "summary": "Software Development Fundamentals-II",
            "description": "NMD | 3023",
            "start": "2026-01-07T05:30:00.000Z",
            "end": "2026-01-07T06:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=WE",
            "colorId": 2,
        },
        {
            "summary": "Physics-2",
            "description": "SHALU | 121",
            "start": "2026-01-07T07:30:00.000Z",
            "end": "2026-01-07T08:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=WE",
            "colorId": 3,
        },
        {
            "summary": "Life Skills & Professional Communication Lab",
            "description": "MEENAKSHI | 240",
            "start": "2026-01-07T09:30:00.000Z",
            "end": "2026-01-07T11:20:00.000Z",
            "rrule": "RRULE:FREQ=WEEKLY;BYDAY=WE",
            "colorId": 7,
        },
    ],
    "returnTo": "http://localhost:3000/",
    "batch": "e1",
}
