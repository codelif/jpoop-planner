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
