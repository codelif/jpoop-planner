from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

def fetch_cache():
    CDN = "https://raw.githubusercontent.com/codelif/jiit-planner-cdn/main/{file}"
    metadata = requests.get(CDN.format(file="metadata.json")).json()
    classes = requests.get(CDN.format(file="classes.json")).json()
    return metadata,classes

METADATA, CLASSES = fetch_cache()

@app.get("/api/metadata")
def metadata():
    return jsonify(METADATA)


@app.get("/api/allclasses")
def classes():
    course = request.args.get("course") or ''
    semester = request.args.get("semester") or ''
    phase = request.args.get("phase") or ''
    batch = request.args.get("batch") or ''
    
    key = '_'.join((course, semester, phase, batch))
    

    if CLASSES.get(key):
        return jsonify(CLASSES[key])

    return jsonify({})

@app.get("/api/allclasses-version")
def classes_version():
    course = request.args.get("course") or ''
    semester = request.args.get("semester") or ''
    phase = request.args.get("phase") or ''
    batch = request.args.get("batch") or ''
    
    key = '_'.join((course, semester, phase, batch))
    

    if CLASSES.get(key):
        return jsonify({"cacheVersion": CLASSES[key]["cacheVersion"]})

    return {"cacheVersion": "0"}
