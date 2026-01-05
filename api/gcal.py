from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from utils import DAY_MAP, next_weekday_date, parse_time

SCOPES = ["https://www.googleapis.com/auth/calendar"]


def create_calendar(service, batch_name):
    calendar = {
        "summary": f"JIIT Timetable - {batch_name}",
        "timeZone": "Asia/Kolkata",
    }

    created = service.calendars().insert(body=calendar).execute()
    return created["id"]


def create_gcal_events(
    *,
    client_id,
    client_secret,
    redirect_uri,
    auth_code,
    payload,
):
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=redirect_uri,
    )

    flow.fetch_token(code=auth_code)
    creds = flow.credentials

    service = build("calendar", "v3", credentials=creds)

    batch_name = payload.get("batch", "Unknown Batch")
    calendar_id = create_calendar(service, batch_name)

    for ev in payload["events"]:
        service.events().insert(
            calendarId=calendar_id,
            body={
                "summary": ev["summary"],
                "description": ev["description"],
                "start": {
                    "dateTime": ev["start"],
                    "timeZone": "Asia/Kolkata",
                },
                "end": {
                    "dateTime": ev["end"],
                    "timeZone": "Asia/Kolkata",
                },
                "recurrence": [ev["rrule"]],
                "colorId": ev["colorId"],
            },
        ).execute()
