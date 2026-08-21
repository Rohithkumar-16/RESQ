import os
import random
import string
import math
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash

from database import db, User, Hospital, HospitalAvailability, OTPVerification, SOSRequest

BASE_DIR = Path(__file__).resolve().parent
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(exist_ok=True)
DATABASE_PATH = INSTANCE_DIR / "resq.db"

app = Flask(__name__, static_folder="static", static_url_path="/static")
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "resq-dev-secret-change-me")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DATABASE_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

ALLOWED_ROLES = {"patient", "hospital", "admin"}
ALLOWED_SOS_STATUSES = {"pending", "accepted", "rejected", "in progress", "resolved"}


def get_json():
    return request.get_json(silent=True) or {}


def iso(value):
    return value.isoformat() if value else None


def current_user():
    user_id = session.get("user_id")
    return db.session.get(User, user_id) if user_id else None


def require_role(*roles):
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            user = current_user()
            if not user:
                return jsonify({"error": "Login required"}), 401
            if user.role not in roles:
                return jsonify({"error": "Access denied"}), 403
            return function(*args, **kwargs)
        return wrapper
    return decorator


def get_resources(hospital_id):
    rows = HospitalAvailability.query.filter_by(hospital_id=hospital_id).all()
    return {
        row.resource_name: {
            "id": row.id,
            "resource_type": row.resource_type,
            "resource_name": row.resource_name,
            "total": row.total_count,
            "available": row.available_count,
            "updated_at": iso(row.updated_at),
        }
        for row in rows
    }


def hospital_response(hospital):
    resources = get_resources(hospital.id)

    def available(name):
        return resources.get(name, {}).get("available", 0)

    timestamps = [
        row.updated_at
        for row in HospitalAvailability.query.filter_by(hospital_id=hospital.id).all()
        if row.updated_at
    ]
    return {
        "id": hospital.id,
        "name": hospital.name,
        "address": hospital.address,
        "city": hospital.city,
        "state": hospital.state,
        "latitude": hospital.latitude,
        "longitude": hospital.longitude,
        "phone": hospital.phone,
        "resources": resources,
        "icu_available": available("ICU"),
        "blood_available": available("Blood") > 0,
        "oxygen_available": available("Oxygen") > 0,
        "emergency_service": available("Emergency Service") > 0,
        "ambulance_available": available("Ambulance") > 0,
        "last_updated": iso(max(timestamps)) if timestamps else None,
    }


def request_response(req):
    return {
        "id": req.id,
        "user_id": req.user_id,
        "hospital_id": req.hospital_id,
        "patient_name": req.patient_name,
        "phone": req.phone,
        "emergency_type": req.emergency_type,
        "age": req.age,
        "gender": req.gender,
        "notes": req.notes,
        "status": req.status,
        "created_at": iso(req.created_at),
        "updated_at": iso(req.updated_at),
    }


def seed_demo_data():
    if Hospital.query.count() == 0:
        hospitals = [
            Hospital(
                name="RESQ Demo Hospital",
                address="Rajkot, Gujarat",
                city="Rajkot",
                state="Gujarat",
                latitude=22.3039,
                longitude=70.8022,
                phone="+91 9876543210",
            ),
            Hospital(
                name="Civil Hospital",
                address="Station Road",
                city="Surat",
                state="Gujarat",
                latitude=21.1702,
                longitude=72.8311,
                phone="0261-123456",
            ),
            Hospital(
                name="City Hospital",
                address="MG Road",
                city="Surat",
                state="Gujarat",
                latitude=21.1600,
                longitude=72.8200,
                phone="0261-234567",
            ),
        ]
        db.session.add_all(hospitals)
        db.session.commit()

    for hospital in Hospital.query.all():
        defaults = [
            ("bed", "ICU", 20, 5),
            ("blood", "Blood", 10, 4),
            ("oxygen", "Oxygen", 30, 12),
            ("service", "Emergency Service", 1, 1),
            ("service", "Ambulance", 2, 1),
        ]
        for resource_type, resource_name, total, available in defaults:
            existing = HospitalAvailability.query.filter_by(
                hospital_id=hospital.id,
                resource_name=resource_name,
            ).first()
            if not existing:
                db.session.add(
                    HospitalAvailability(
                        hospital_id=hospital.id,
                        resource_type=resource_type,
                        resource_name=resource_name,
                        total_count=total,
                        available_count=available,
                    )
                )

    if not User.query.filter_by(email="hospital@resq.com").first():
        city_hospital = Hospital.query.filter_by(name="City Hospital").first()
        db.session.add(
            User(
                name="Demo Hospital Admin",
                email="hospital@resq.com",
                password_hash=generate_password_hash("resq123"),
                phone="9999999999",
                role="hospital",
                hospital_id=city_hospital.id if city_hospital else None,
            )
        )

    if not User.query.filter_by(email="admin@resq.com").first():
        db.session.add(
            User(
                name="Admin",
                email="admin@resq.com",
                password_hash=generate_password_hash("admin123"),
                phone="8888888888",
                role="admin",
            )
        )

    db.session.commit()


@app.get("/")
def home():
    patient_dir = BASE_DIR / "static" / "patient"
    if (patient_dir / "index.html").exists():
        return send_from_directory(patient_dir, "index.html")
    return jsonify({"message": "RESQ backend is running"})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/signup")
def signup():
    data = get_json()
    required = ["name", "email", "password", "phone"]
    if any(not data.get(k) for k in required):
        return jsonify({"error": "name, email, password, and phone are required"}), 400

    email = str(data["email"]).strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    role = data.get("role", "patient")
    if role not in ALLOWED_ROLES:
        return jsonify({"error": "Invalid role"}), 400

    user = User(
        name=str(data["name"]).strip(),
        email=email,
        password_hash=generate_password_hash(data["password"]),
        phone=str(data["phone"]).strip(),
        role=role,
        hospital_id=data.get("hospital_id"),
        age=data.get("age"),
        gender=data.get("gender"),
        blood_group=data.get("blood_group"),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Signup successful", "user_id": user.id}), 201


@app.post("/api/login")
def login():
    data = get_json()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    if user.role in {"hospital", "admin"}:
        otp_code = "".join(random.choices(string.digits, k=6))
        otp = OTPVerification(
            user_id=user.id,
            otp_code=otp_code,
            phone=user.phone or "",
            purpose="login",
            expires_at=datetime.utcnow() + timedelta(minutes=5),
        )
        db.session.add(otp)
        db.session.commit()
        print(f"OTP for {user.phone}: {otp_code}")
        return jsonify(
            {
                "message": "OTP sent to your phone",
                "requires_2fa": True,
                "user_id": user.id,
                "phone_last_4": user.phone[-4:] if user.phone and len(user.phone) > 4 else user.phone,
            }
        )

    session["user_id"] = user.id
    return jsonify(
        {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "hospital_id": user.hospital_id,
            },
        }
    )


@app.post("/api/verify-otp")
def verify_otp_endpoint():
    data = get_json()
    user_id = data.get("user_id")
    otp_code = data.get("otp")
    if not user_id or not otp_code:
        return jsonify({"error": "user_id and otp are required"}), 400

    otp = OTPVerification.query.filter_by(
        user_id=user_id,
        otp_code=otp_code,
        is_used=False,
    ).first()
    if not otp:
        return jsonify({"error": "Invalid OTP"}), 400
    if datetime.utcnow() > otp.expires_at:
        return jsonify({"error": "OTP expired"}), 400

    otp.is_used = True
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    session["user_id"] = user.id
    db.session.commit()
    return jsonify(
        {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "hospital_id": user.hospital_id,
            },
        }
    )


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.get("/api/me")
def me():
    user = current_user()
    if not user:
        return jsonify({"error": "Login required"}), 401
    return jsonify(
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "hospital_id": user.hospital_id,
        }
    )


@app.get("/api/hospitals")
def get_hospitals():
    city = request.args.get("city")
    state = request.args.get("state")
    query = Hospital.query
    if city:
        query = query.filter(db.func.lower(Hospital.city) == city.lower())
    if state:
        query = query.filter(db.func.lower(Hospital.state) == state.lower())

    hospitals = query.order_by(Hospital.name).all()
    return jsonify(
        [
            {
                "id": h.id,
                "name": h.name,
                "address": h.address,
                "city": h.city,
                "state": h.state,
                "latitude": h.latitude,
                "longitude": h.longitude,
                "phone": h.phone,
                "created_at": iso(h.created_at),
            }
            for h in hospitals
        ]
    )


@app.get("/api/hospitals/<int:hospital_id>")
def get_hospital(hospital_id):
    hospital = db.session.get(Hospital, hospital_id)
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404
    return jsonify(hospital_response(hospital))


@app.get("/api/hospitals/nearby")
def get_nearby_hospitals_api():
    latitude = request.args.get("lat", type=float)
    longitude = request.args.get("lng", type=float)
    max_distance = request.args.get("distance", default=10, type=int)
    if latitude is None or longitude is None:
        return jsonify({"error": "Latitude and longitude required"}), 400

    def calculate_distance(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        return R * c

    nearby = []
    for h in Hospital.query.all():
        if h.latitude is not None and h.longitude is not None:
            distance = calculate_distance(latitude, longitude, h.latitude, h.longitude)
            if distance <= max_distance:
                nearby.append(
                    {
                        "id": h.id,
                        "name": h.name,
                        "address": h.address,
                        "city": h.city,
                        "state": h.state,
                        "latitude": h.latitude,
                        "longitude": h.longitude,
                        "phone": h.phone,
                        "distance_km": round(distance, 2),
                    }
                )
    nearby.sort(key=lambda x: x["distance_km"])
    return jsonify(nearby)


@app.get("/api/search")
def search_resources():
    resource_type = request.args.get("type")
    resource_name = request.args.get("name")
    query = HospitalAvailability.query.filter(HospitalAvailability.available_count > 0)
    if resource_type:
        query = query.filter_by(resource_type=resource_type)
    if resource_name:
        query = query.filter_by(resource_name=resource_name)

    result = []
    for item in query.all():
        hospital = db.session.get(Hospital, item.hospital_id)
        if hospital:
            result.append(
                {
                    "hospital_id": hospital.id,
                    "hospital_name": hospital.name,
                    "hospital_address": hospital.address,
                    "hospital_phone": hospital.phone,
                    "resource_type": item.resource_type,
                    "resource_name": item.resource_name,
                    "available": item.available_count,
                }
            )
    return jsonify(result)


@app.post("/api/sos")
def send_sos():
    data = get_json()
    required = ["hospital_id", "emergency_type", "patient_name", "phone"]
    if any(not data.get(key) for key in required):
        return jsonify({"error": "hospital_id, emergency_type, patient_name, and phone are required"}), 400

    hospital = db.session.get(Hospital, data["hospital_id"])
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404

    sos = SOSRequest(
        user_id=data.get("user_id"),
        patient_id=data.get("user_id"),
        hospital_id=hospital.id,
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        emergency_type=data["emergency_type"],
        patient_name=data["patient_name"].strip(),
        age=data.get("age"),
        gender=data.get("gender"),
        phone=data["phone"].strip(),
        notes=data.get("notes"),
    )
    db.session.add(sos)
    db.session.commit()
    return jsonify({"message": "SOS sent successfully", "sos_id": sos.id, "status": sos.status}), 201


@app.get("/api/sos/<int:sos_id>")
def get_sos_status(sos_id):
    sos = db.session.get(SOSRequest, sos_id)
    if not sos:
        return jsonify({"error": "SOS not found"}), 404
    return jsonify(
        {
            "sos_id": sos.id,
            "hospital_id": sos.hospital_id,
            "patient_name": sos.patient_name,
            "emergency_type": sos.emergency_type,
            "status": sos.status,
            "created_at": iso(sos.created_at),
            "updated_at": iso(sos.updated_at),
        }
    )


@app.get("/api/hospital/<int:hospital_id>/sos")
@require_role("hospital", "admin")
def get_hospital_sos(hospital_id):
    user = current_user()
    if user.role == "hospital" and user.hospital_id != hospital_id:
        return jsonify({"error": "Access denied"}), 403
    rows = SOSRequest.query.filter_by(hospital_id=hospital_id).order_by(SOSRequest.created_at.desc()).all()
    return jsonify([request_response(row) for row in rows])


@app.put("/api/sos/<int:sos_id>/status")
@require_role("hospital", "admin")
def update_sos_status(sos_id):
    data = get_json()
    status = str(data.get("status", "")).lower()
    if status not in ALLOWED_SOS_STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    sos = db.session.get(SOSRequest, sos_id)
    if not sos:
        return jsonify({"error": "SOS not found"}), 404

    user = current_user()
    if user.role == "hospital" and user.hospital_id != sos.hospital_id:
        return jsonify({"error": "Access denied"}), 403

    sos.status = status
    sos.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "SOS status updated", "sos_id": sos.id, "status": sos.status})


@app.put("/api/sos/<int:sos_id>/accept")
@require_role("hospital", "admin")
def accept_sos(sos_id):
    sos = db.session.get(SOSRequest, sos_id)
    if not sos:
        return jsonify({"error": "SOS request not found"}), 404
    sos.status = "accepted"
    db.session.commit()
    return jsonify({"message": "SOS accepted", "sos_id": sos.id, "status": sos.status})


@app.put("/api/sos/<int:sos_id>/reject")
@require_role("hospital", "admin")
def reject_sos(sos_id):
    sos = db.session.get(SOSRequest, sos_id)
    if not sos:
        return jsonify({"error": "SOS request not found"}), 404
    sos.status = "rejected"
    db.session.commit()
    return jsonify({"message": "SOS rejected", "sos_id": sos.id, "status": sos.status})


@app.post("/api/requests")
def create_request():
    data = get_json()
    required = ["patient_name", "phone", "hospital_id", "emergency_type"]
    if any(not data.get(field) for field in required):
        return jsonify({"error": "patient_name, phone, hospital_id, and emergency_type are required"}), 400

    hospital = db.session.get(Hospital, data["hospital_id"])
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404

    sos = SOSRequest(
        user_id=data.get("user_id"),
        patient_id=data.get("user_id"),
        hospital_id=hospital.id,
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        emergency_type=data["emergency_type"].strip(),
        patient_name=data["patient_name"].strip(),
        age=data.get("age"),
        gender=data.get("gender"),
        phone=data["phone"].strip(),
        notes=data.get("notes"),
    )
    db.session.add(sos)
    db.session.commit()
    return jsonify({"message": "Emergency request created successfully", "request": request_response(sos)}), 201


@app.get("/api/requests")
def list_requests():
    hospital_id = request.args.get("hospital_id", type=int)
    user_id = request.args.get("user_id", type=int)
    query = SOSRequest.query
    if hospital_id:
        query = query.filter_by(hospital_id=hospital_id)
    if user_id:
        query = query.filter_by(user_id=user_id)
    rows = query.order_by(SOSRequest.created_at.desc()).all()
    return jsonify([request_response(row) for row in rows])


@app.get("/api/requests/<int:request_id>")
def get_request(request_id):
    req = db.session.get(SOSRequest, request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404
    return jsonify(request_response(req))


@app.patch("/api/requests/<int:request_id>")
def update_request(request_id):
    req = db.session.get(SOSRequest, request_id)
    if not req:
        return jsonify({"error": "Request not found"}), 404

    data = get_json()
    if "status" in data:
        status = str(data["status"]).lower()
        if status not in ALLOWED_SOS_STATUSES:
            return jsonify({"error": "Invalid status"}), 400
        req.status = status
    if "notes" in data:
        req.notes = data["notes"]

    db.session.commit()
    return jsonify({"message": "Request updated successfully", "request": request_response(req)})

@app.post("/api/ai/analyze-emergency")
def analyze_emergency():
    data = request.get_json(silent=True) or {}
    return jsonify({
        "category": data.get("category", "other_unclear"),
        "urgency": data.get("urgency", "unable_to_determine"),
        "confidence": data.get("confidence", "low"),
        "recommendation": "Seek professional emergency medical evaluation.",
        "note": "AI analysis is not a medical diagnosis and does not replace professional emergency medical evaluation."
    }), 200


if __name__ == "__main__":
    print("Entered main")
    with app.app_context():
        print("Before create_all")
        db.drop_all()
        db.create_all()
        seed_demo_data()
        print("After create_all")

    print("Starting server on 5001")
    app.run(debug=True, port=5001)