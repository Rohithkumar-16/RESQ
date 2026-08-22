from flask import Flask, jsonify

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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)