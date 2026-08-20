import os 
import random
import string
from datetime import timedelta
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

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

db = SQLAlchemy(app)
CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:5173"],
)

ALLOWED_ROLES = {"patient", "hospital", "admin"}
ALLOWED_SOS_STATUSES = {"pending", "accepted", "rejected", "in progress", "resolved"}


# ============ MODELS ============
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="patient")
    age = db.Column(db.Integer)
    gender = db.Column(db.String(30))
    blood_group = db.Column(db.String(10))
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=True)
    designation = db.Column(db.String(80))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Hospital(db.Model):
    __tablename__ = "hospitals"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(80), nullable=False)
    state = db.Column(db.String(80))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    phone = db.Column(db.String(30), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class SOSRequest(db.Model):
    __tablename__ = "sos_requests"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    emergency_type = db.Column(db.String(80), nullable=False)
    patient_name = db.Column(db.String(120), nullable=False)
    age = db.Column(db.Integer)
    gender = db.Column(db.String(30))
    phone = db.Column(db.String(30), nullable=False)
    notes = db.Column(db.Text)
    status = db.Column(db.String(30), default="pending", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class HospitalAvailability(db.Model):
    __tablename__ = "hospital_availability"

    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_name = db.Column(db.String(100), nullable=False)
    total_count = db.Column(db.Integer, default=0, nullable=False)
    available_count = db.Column(db.Integer, default=0, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint(
            "hospital_id",
            "resource_type",
            "resource_name",
            name="unique_hospital_resource",
        ),
        db.CheckConstraint("total_count >= 0", name="total_nonnegative"),
        db.CheckConstraint("available_count >= 0", name="available_nonnegative"),
        db.CheckConstraint("available_count <= total_count", name="availability_valid"),
    )

class OTPVerification(db.Model):
    __tablename__ = "otp_verifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    otp_code = db.Column(db.String(6), nullable=False)
    phone = db.Column(db.String(30), nullable=False)
    purpose = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, default=False, nullable=False)

    user = db.relationship("User", backref="otp_verifications")



# ============ HELPER FUNCTIONS ============
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


def seed_demo_data():
    if Hospital.query.count() == 0:
        hospitals = [
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
        db.session.flush()

    for hospital in Hospital.query.all():
        default_resources = [
            ("bed", "ICU", 50, 8),
            ("blood", "Blood", 20, 10),
            ("oxygen", "Oxygen", 30, 15),
            ("service", "Emergency Service", 1, 1),
            ("service", "Ambulance", 2, 1),
        ]
        for resource_type, resource_name, total, available in default_resources:
            existing = HospitalAvailability.query.filter_by(
                hospital_id=hospital.id, resource_name=resource_name
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

    db.session.commit()


# ============ FRONTEND ROUTES ============
@app.get("/")
def patient_home():
    patient_dir = BASE_DIR / "static" / "patient"
    if (patient_dir / "index.html").exists():
        return send_from_directory(patient_dir, "index.html")
    return jsonify(
        {
            "message": "RESQ backend is running",
            "frontend": "Place patient files in static/patient",
        }
    )


@app.get("/patient/<path:filename>")
def patient_files(filename):
    return send_from_directory(BASE_DIR / "static" / "patient", filename)


# ============ API ENDPOINTS ============
@app.get("/api/health")
def health():
    return jsonify({"success": True, "message": "RESQ backend is running"})


# ============ USER ENDPOINTS ============
@app.post("/api/signup")
def signup():
    data = get_json()
    required = ["name", "email", "password", "phone"]
    if any(not data.get(key) for key in required):
        return jsonify({"error": "name, email, password, and phone are required"}), 400

    email = data["email"].strip().lower()
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    role = data.get("role", "patient")
    if role not in ALLOWED_ROLES:
        return jsonify({"error": "Invalid role"}), 400

    user = User(
        name=data["name"].strip(),
        email=email,
        password_hash=generate_password_hash(data["password"]),
        phone=data["phone"].strip(),
        role=role,
        age=data.get("age"),
        gender=data.get("gender"),
        blood_group=data.get("blood_group"),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Signup successful", "user_id": user.id}), 201


@app.post("/api/login")
def login():
    """Step 1: Validate credentials and send OTP"""
    
    data = get_json()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    
    user = User.query.filter_by(email=email).first()
    
    valid = user and check_password_hash(user.password_hash, password)
    if not valid:
        return jsonify({"error": "Invalid email or password"}), 401
    
    # For hospital/admin users, require 2FA
    if user.role in ["hospital", "admin"]:
        # Generate OTP
        otp_code = generate_otp()
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        
        otp = OTPVerification(
            user_id=user.id,
            otp_code=otp_code,
            phone=user.phone,
            purpose="login",
            expires_at=expires_at
        )
        db.session.add(otp)
        db.session.commit()
        
        # Send OTP via SMS (or print for testing)
        send_otp_sms(user.phone, otp_code, "login")
        
        return jsonify({
            "message": "OTP sent to your phone",
            "requires_2fa": True,
            "user_id": user.id,
            "phone_last_4": user.phone[-4:] if len(user.phone) > 4 else user.phone
        })
    
    # For patients, login directly (no 2FA required)
    session["user_id"] = user.id
    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "hospital_id": user.hospital_id,
        },
    })
     

@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


@app.get("/api/me")
def me():
    user = current_user()

    if not user:
        return jsonify({"error": "Login required"}), 401

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "hospital_id": user.hospital_id,
    })


# ============ HOSPITAL ENDPOINTS ============
@app.get("/api/hospitals")
def get_hospitals():
    """Get all hospitals or filter by city"""
    
    city = request.args.get("city")
    state = request.args.get("state")
    
    query = Hospital.query
    
    if city:
        query = query.filter(db.func.lower(Hospital.city) == city.lower())
    
    if state:
        query = query.filter(db.func.lower(Hospital.state) == state.lower())
    
    hospitals = query.order_by(Hospital.name).all()
    
    return jsonify([
        {
            "id": h.id,
            "name": h.name,
            "address": h.address,
            "city": h.city,
            "state": h.state,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "phone": h.phone,
            "created_at": iso(h.created_at)
        }
        for h in hospitals
    ])


@app.get("/api/hospitals/<int:hospital_id>")
def get_hospital(hospital_id):
    """Get single hospital by ID"""
    
    hospital = db.session.get(Hospital, hospital_id)
    
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404
    
    return jsonify(hospital_response(hospital))


@app.get("/api/hospitals/nearby")
def get_nearby_hospitals_api():
    """Get hospitals near given coordinates"""
    
    latitude = request.args.get("lat", type=float)
    longitude = request.args.get("lng", type=float)
    max_distance = request.args.get("distance", default=10, type=int)
    
    if not latitude or not longitude:
        return jsonify({"error": "Latitude and longitude required"}), 400
    
    all_hospitals = Hospital.query.all()
    
    import math
    
    def calculate_distance(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        return R * c
    
    nearby = []
    for h in all_hospitals:
        if h.latitude and h.longitude:
            distance = calculate_distance(latitude, longitude, h.latitude, h.longitude)
            if distance <= max_distance:
                nearby.append({
                    "id": h.id,
                    "name": h.name,
                    "address": h.address,
                    "city": h.city,
                    "state": h.state,
                    "latitude": h.latitude,
                    "longitude": h.longitude,
                    "phone": h.phone,
                    "distance_km": round(distance, 2)
                })
    
    nearby.sort(key=lambda x: x["distance_km"])
    
    return jsonify(nearby)


@app.post("/api/hospitals")
@require_role("admin")
def add_hospital():
    """Add new hospital (admin only)"""
    
    data = get_json()
    required = ["name", "address", "city", "phone"]
    if any(not data.get(field) for field in required):
        return jsonify({"error": "name, address, city, and phone are required"}), 400

    existing = Hospital.query.filter_by(
        name=data["name"].strip(), city=data["city"].strip()
    ).first()
    if existing:
        return jsonify({"error": "Hospital already exists"}), 409

    hospital = Hospital(
        name=data["name"].strip(),
        address=data["address"].strip(),
        city=data["city"].strip(),
        state=data.get("state"),
        phone=data["phone"].strip(),
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
    )
    db.session.add(hospital)
    db.session.commit()
    return jsonify(
        {
            "message": "Hospital added successfully",
            "hospital": hospital_response(hospital),
        }
    ), 201


@app.put("/api/hospitals/<int:hospital_id>")
@require_role("admin")
def update_hospital(hospital_id):
    """Update hospital details (admin only)"""
    
    hospital = db.session.get(Hospital, hospital_id)
    
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404
    
    data = get_json()
    
    if "name" in data:
        hospital.name = data["name"].strip()
    if "address" in data:
        hospital.address = data["address"].strip()
    if "city" in data:
        hospital.city = data["city"].strip()
    if "state" in data:
        hospital.state = data["state"].strip()
    if "phone" in data:
        hospital.phone = data["phone"].strip()
    if "latitude" in data:
        hospital.latitude = data["latitude"]
    if "longitude" in data:
        hospital.longitude = data["longitude"]
    
    db.session.commit()
    
    return jsonify({
        "message": "Hospital updated successfully!",
        "hospital": {
            "id": hospital.id,
            "name": hospital.name,
            "address": hospital.address,
            "city": hospital.city,
            "state": hospital.state,
            "phone": hospital.phone
        }
    })


@app.delete("/api/hospitals/<int:hospital_id>")
@require_role("admin")
def delete_hospital(hospital_id):
    """Delete hospital (admin only)"""
    
    hospital = db.session.get(Hospital, hospital_id)
    
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404
    
    db.session.delete(hospital)
    db.session.commit()
    
    return jsonify({
        "message": "Hospital deleted successfully!",
        "hospital_id": hospital_id
    })


# ============ SOS ENDPOINTS ============
@app.post("/api/sos")
def send_sos():
    data = get_json()
    required = ["hospital_id", "emergency_type", "patient_name", "phone"]
    if any(not data.get(key) for key in required):
        return (
            jsonify(
                {
                    "error": "hospital_id, emergency_type, patient_name, and phone are required"
                }
            ),
            400,
        )

    hospital = db.session.get(Hospital, data["hospital_id"])
    if not hospital:
        return jsonify({"error": "Hospital not found"}), 404

    sos = SOSRequest(
        user_id=data.get("user_id"),
        hospital_id=hospital.id,
        latitude=data.get("latitude"),
        longitude=data.get("longitude"),
        emergency_type=data["emergency_type"],
        patient_name=data["patient_name"].strip(),
        age=data.get("age"),
        gender=data.get("gender"),
        phone=data["phone"].strip(),
        notes=data.get("notes")
    )
    
    db.session.add(sos)
    db.session.commit()
    
    return (
        jsonify(
            {"message": "SOS sent successfully", "sos_id": sos.id, "status": sos.status}
        ),
        201,
    )


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

    rows = (
        SOSRequest.query.filter_by(hospital_id=hospital_id)
        .order_by(SOSRequest.created_at.desc())
        .all()
    )
    return jsonify(
        [
            {
                "sos_id": row.id,
                "hospital_id": row.hospital_id,
                "patient_name": row.patient_name,
                "age": row.age,
                "gender": row.gender,
                "phone": row.phone,
                "emergency_type": row.emergency_type,
                "notes": row.notes,
                "status": row.status,
                "created_at": iso(row.created_at),
            }
            for row in rows
        ]
    )


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
    return jsonify(
        {"message": "SOS status updated", "sos_id": sos.id, "status": sos.status}
    )


@app.put("/api/sos/<int:sos_id>/accept")
@require_role("hospital", "admin")
def accept_sos(sos_id):
    sos = db.session.get(SOSRequest, sos_id)

    if not sos:
        return jsonify({"error": "SOS request not found"}), 404

    sos.status = "accepted"
    db.session.commit()

    return jsonify({
        "message": "SOS accepted",
        "sos_id": sos.id,
        "status": sos.status,
    })


@app.put("/api/sos/<int:sos_id>/reject")
@require_role("hospital", "admin")
def reject_sos(sos_id):
    sos = db.session.get(SOSRequest, sos_id)

    if not sos:
        return jsonify({"error": "SOS request not found"}), 404

    sos.status = "rejected"
    db.session.commit()

    return jsonify({
        "message": "SOS rejected",
        "sos_id": sos.id,
        "status": sos.status,
    })


# ============ AVAILABILITY ENDPOINTS ============
@app.get("/api/hospital/<int:hospital_id>/availability")
def get_availability(hospital_id):
    if not db.session.get(Hospital, hospital_id):
        return jsonify({"error": "Hospital not found"}), 404
    return jsonify(
        [
            {
                "resource_type": row.resource_type,
                "resource_name": row.resource_name,
                "total": row.total_count,
                "available": row.available_count,
                "updated_at": iso(row.updated_at),
            }
            for row in HospitalAvailability.query.filter_by(
                hospital_id=hospital_id
            ).all()
        ]
    )


@app.put("/api/hospital/<int:hospital_id>/availability")
@require_role("hospital", "admin")
def update_availability(hospital_id):
    user = current_user()
    if user.role == "hospital" and user.hospital_id != hospital_id:
        return jsonify({"error": "Access denied"}), 403

    data = get_json()
    required = ["resource_type", "resource_name", "available_count"]
    if any(key not in data for key in required):
        return (
            jsonify(
                {
                    "error": "resource_type, resource_name, and available_count are required"
                }
            ),
            400,
        )

    total = int(data.get("total_count", 0))
    available = int(data["available_count"])
    if total < 0 or available < 0 or available > total:
        return jsonify({"error": "Availability values are invalid"}), 400

    item = HospitalAvailability.query.filter_by(
        hospital_id=hospital_id,
        resource_type=data["resource_type"],
        resource_name=data["resource_name"],
    ).first()
    if item:
        item.total_count = total
        item.available_count = available
        item.updated_at = datetime.utcnow()
    else:
        item = HospitalAvailability(
            hospital_id=hospital_id,
            resource_type=data["resource_type"],
            resource_name=data["resource_name"],
            total_count=total,
            available_count=available,
        )
        db.session.add(item)

    db.session.commit()
    return jsonify(
        {
            "message": "Availability updated",
            "resource_name": item.resource_name,
            "total": item.total_count,
            "available": item.available_count,
        }
    )

def generate_otp(length=6):
    """Generate random OTP code"""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_sms(phone, otp_code, purpose="verification"):
    """Send OTP via SMS - TESTING MODE"""
    
    # For testing, just print OTP
    print(f"\n{'='*50}")
    print(f"🔐 OTP for {phone}: {otp_code}")
    print(f"{'='*50}\n")
    
    # Later, replace with actual Twilio SMS:
    # message = f"Your RESQ verification code: {otp_code}"
    # result = send_sms(phone, message)
    # return result
    
    return {"success": True, "testing": True}


def verify_otp(user_id, otp_code):
    """Verify OTP code"""
    otp = OTPVerification.query.filter_by(
        user_id=user_id,
        otp_code=otp_code,
        is_used=False
    ).first()
    
    if not otp:
        return {"valid": False, "error": "Invalid OTP"}
    
    if datetime.utcnow() > otp.expires_at:
        return {"valid": False, "error": "OTP expired"}
    
    # Mark as used
    otp.is_used = True
    db.session.commit()
    
    return {"valid": True, "user_id": user_id}


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

@app.post("/api/verify-otp")
def verify_otp_endpoint():
    """Step 2: Verify OTP and complete login"""
    
    data = get_json()
    user_id = data.get("user_id")
    otp_code = data.get("otp")
    
    if not user_id or not otp_code:
        return jsonify({"error": "user_id and otp are required"}), 400
    
    # Verify OTP
    result = verify_otp(user_id, otp_code)
    
    if not result["valid"]:
        return jsonify({"error": result["error"]}), 400
    
    # Get user
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Complete login
    session["user_id"] = user.id
    
    return jsonify({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "hospital_id": user.hospital_id,
        },
    })


@app.post("/api/resend-otp")
def resend_otp():
    """Resend OTP to user's phone"""
    
    data = get_json()
    user_id = data.get("user_id")
    
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    
    user = db.session.get(User, user_id)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Invalidate old OTPs
    old_otps = OTPVerification.query.filter_by(
        user_id=user_id,
        is_used=False
    ).all()
    
    for otp in old_otps:
        otp.is_used = True
    
    # Generate new OTP
    otp_code = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    otp = OTPVerification(
        user_id=user.id,
        otp_code=otp_code,
        phone=user.phone,
        purpose="login",
        expires_at=expires_at
    )
    db.session.add(otp)
    db.session.commit()
    
    # Send OTP
    send_otp_sms(user.phone, otp_code, "login")
    
    return jsonify({
        "message": "New OTP sent",
        "phone_last_4": user.phone[-4:] if len(user.phone) > 4 else user.phone
    })

# ============ DATABASE INITIALIZATION ============
@app.cli.command("seed")
def seed_command():
    seed_demo_data()
    print("Demo hospitals and resources seeded.")


with app.app_context():
    db.create_all()
    seed_demo_data()



# ============ RUN SERVER ============
if __name__ == "__main__":
    print(f"RESQ backend running at http://localhost:5001")
    print(f"Database: {DATABASE_PATH}")
    app.run(debug=True, port=5001)