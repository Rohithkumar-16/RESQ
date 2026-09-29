from flask import Flask, jsonify
from flask import send_from_directory
import os

app = Flask(__name__)

hospitals = [
    {
        "name": "Rajkot Emergency Hospital",
        "available": True,
        "emergency": True,
        "trauma": True,
        "distance_km": 3.2
    },
    {
        "name": "City General Hospital",
        "available": True,
        "emergency": True,
        "trauma": False,
        "distance_km": 1.8
    },
    {
        "name": "Apex Trauma Center",
        "available": True,
        "emergency": True,
        "trauma": True,
        "distance_km": 5.1
    }
]

@app.route("/hospitals", methods=["GET"])
def get_hospitals():
    return jsonify(hospitals)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

# Serve your React frontend build files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # This looks inside your frontend build folder
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
    if path != "" and os.path.exists(os.path.join(frontend_dir, path)):
        return send_from_directory(frontend_dir, path)
    else:
        return send_from_directory(frontend_dir, 'index.html')

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)