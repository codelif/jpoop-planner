from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

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
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

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

    # Return empty response with default cacheVersion
    return jsonify({
        "cacheVersion": "0",
        "classes": {}
    })

@app.get("/api/allclasses-version")
def classes_version():
    course = request.args.get("course") or ''
    semester = request.args.get("semester") or ''
    phase = request.args.get("phase") or ''
    batch = request.args.get("batch") or ''
    
    key = '_'.join((course, semester, phase, batch))
    
    if CLASSES.get(key):
        return jsonify({"cacheVersion": CLASSES[key].get("cacheVersion", "0")})

    return jsonify({"cacheVersion": "0"})

@app.get("/api/electives")
def electives():
    course = request.args.get("course") or ''
    semester = request.args.get("semester") or ''
    phase = request.args.get("phase") or ''
    key = '_'.join((course, semester, phase))
    print(key)

    if ELECTIVES.get(key):
        return jsonify(ELECTIVES[key])

    return jsonify({"cacheVersion": "0"})

if __name__ == "__main__":
    app.run()
