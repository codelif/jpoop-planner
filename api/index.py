from flask import Flask, jsonify, request, redirect
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

import os
import requests
from dotenv import load_dotenv
from urllib.parse import urlencode

from gcal import create_gcal_events


app = Flask(__name__)
load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/calendar"]

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")


def fetch_cache():
    CDN = "https://raw.githubusercontent.com/codelif/jiit-planner-cdn/refs/heads/main/{file}"
    metadata = requests.get(CDN.format(file="metadata.json")).json()
    classes = requests.get(CDN.format(file="classes.json")).json()
    return metadata, classes


def subjectcodes_by_category(data):
    result = {}

    for item in data:
        category = item.get("category")
        subjectcode = item.get("subject")

        if not category or not subjectcode:
            continue

        if category not in result:
            result[category] = set()

        result[category].add(subjectcode)

    return {k: list(v) for k, v in result.items()}


def build_electives(classes: dict, cacheVersion: str):
    electives = {"cacheVersion": cacheVersion}
    for k, v in classes["electives"].items():
        electives[k] = subjectcodes_by_category(v)

    return electives


METADATA, CLASSES = fetch_cache()
ELECTIVES = build_electives(CLASSES, METADATA["cacheVersion"])


@app.after_request
def after_request(response):
    # Add no-cache headers to API responses
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.get("/api/metadata")
def metadata():
    return jsonify(METADATA)


@app.get("/api/allclasses")
def classes():
    course = request.args.get("course") or ""
    semester = request.args.get("semester") or ""
    phase = request.args.get("phase") or ""
    batch = request.args.get("batch") or ""

    key = "_".join((course, semester, phase, batch))

    if CLASSES.get(key):
        return jsonify(CLASSES[key])

    # Return empty response with default cacheVersion
    return jsonify({"cacheVersion": "0", "classes": {}})


@app.get("/api/allclasses-version")
def classes_version():
    course = request.args.get("course") or ""
    semester = request.args.get("semester") or ""
    phase = request.args.get("phase") or ""
    batch = request.args.get("batch") or ""

    key = "_".join((course, semester, phase, batch))

    if CLASSES.get(key):
        return jsonify({"cacheVersion": CLASSES[key].get("cacheVersion", "0")})

    return jsonify({"cacheVersion": "0"})


@app.get("/api/electives")
def electives():
    course = request.args.get("course") or ""
    semester = request.args.get("semester") or ""
    phase = request.args.get("phase") or ""
    key = "_".join((course, semester, phase))
    print(key)

    if ELECTIVES.get(key):
        return jsonify(ELECTIVES[key])

    return jsonify({"cacheVersion": "0"})


TEMP_GCAL_EVENT_DATA = None


@app.post("/api/google/prepare_calandar")
def google_prepare():
    global TEMP_GCAL_EVENT_DATA
    TEMP_GCAL_EVENT_DATA = request.json
    return jsonify({"ok": True})


@app.get("/api/google/auth")
def google_auth():
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI,
    )

    auth_url, _ = flow.authorization_url(prompt="select_account consent")

    return redirect(auth_url)


@app.get("/api/google/callback")
def google_callback():
    global TEMP_GCAL_EVENT_DATA

    if not TEMP_GCAL_EVENT_DATA:
        return "No data", 400

    print(TEMP_GCAL_EVENT_DATA)
    success = True

    try:
        create_gcal_events(
            client_id=GOOGLE_CLIENT_ID,
            client_secret=GOOGLE_CLIENT_SECRET,
            redirect_uri=REDIRECT_URI,
            auth_code=request.args.get("code"),
            payload=TEMP_GCAL_EVENT_DATA,
        )
    except Exception as e:
        print(e)
        success = False

    return_to = TEMP_GCAL_EVENT_DATA["returnTo"]
    TEMP_GCAL_EVENT_DATA = None

    q = urlencode({"gcal": "success"})
    return redirect(f"{return_to}?{q}" if success else return_to)


if __name__ == "__main__":
    app.run()
