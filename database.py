import os
import random
import string
import math
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, request, session, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash


# ============================================================
# APP CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(exist_ok=True)

DATABASE_PATH = INSTANCE_DIR / "resq.db"


app = Flask(
    __name__,
    static_folder="static",
    static_url_path="/static",
)

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY",
    "resq-dev-secret-change-me",
)

app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"sqlite:///{DATABASE_PATH}"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


db = SQLAlchemy(app)
CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:5173"],
)


# ============================================================
# CONSTANTS
# ============================================================

ALLOWED_ROLES = {
    "patient",
    "hospital",
    "admin",
}


ALLOWED_SOS_STATUSES = {
    "pending",
    "accepted",
    "rejected",
    "in progress",
    "resolved",
}


RESOURCE_UNITS = {
    "ICU": "beds",
    "Blood": "units",
    "Oxygen": "cylinders",
    "Emergency Service": "slots",
    "Ambulance": "vehicles",
}


def get_resource_unit(resource_name):
    return RESOURCE_UNITS.get(
        resource_name,
        "units",
    )


# ============================================================
# DATABASE MODELS
# ============================================================


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

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Hospital(db.Model):

    __tablename__ = "hospitals"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    phone = db.Column(db.String(20))
    icu_available = db.Column(db.Integer, default=0)
    blood_available = db.Column(db.Boolean, default=False)
    oxygen_available = db.Column(db.Boolean, default=False)
    emergency_services = db.Column(db.Boolean, default=False)
    contact_phone = db.Column(db.String(20))
    contact_email = db.Column(db.String(120))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SOSRequest(db.Model):
    __tablename__ = "emergency_requests"

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey("hospitals.id"), nullable=False)
    emergency_type = db.Column(db.String(100))
    patient_name = db.Column(db.String(120))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(20))
    phone = db.Column(db.String(30))
    notes = db.Column(db.Text)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    emergency_info = db.Column(db.Text)
    status = db.Column(db.String(50), default="pending")
    ai_category = db.Column(db.String(100))
    ai_urgency = db.Column(db.String(50))
    ai_confidence = db.Column(db.String(50))
    ai_recommendation = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())


class HospitalAvailability(db.Model):

    __tablename__ = "hospital_availability"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    hospital_id = db.Column(
        db.Integer,
        db.ForeignKey("hospitals.id"),
        nullable=False,
    )

    resource_type = db.Column(
        db.String(50),
        nullable=False,
    )

    resource_name = db.Column(
        db.String(100),
        nullable=False,
    )

    total_count = db.Column(
        db.Integer,
        default=0,
        nullable=False,
    )

    available_count = db.Column(
        db.Integer,
        default=0,
        nullable=False,
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (

        db.UniqueConstraint(
            "hospital_id",
            "resource_type",
            "resource_name",
            name="unique_hospital_resource",
        ),

        db.CheckConstraint(
            "total_count >= 0",
            name="total_nonnegative",
        ),

        db.CheckConstraint(
            "available_count >= 0",
            name="available_nonnegative",
        ),

        db.CheckConstraint(
            "available_count <= total_count",
            name="availability_valid",
        ),
    )


class OTPVerification(db.Model):

    __tablename__ = "otp_verifications"

    id = db.Column(
        db.Integer,
        primary_key=True,
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
    )

    otp_code = db.Column(
        db.String(6),
        nullable=False,
    )

    phone = db.Column(
        db.String(30),
        nullable=False,
    )

    purpose = db.Column(
        db.String(50),
        nullable=False,
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    expires_at = db.Column(
        db.DateTime,
        nullable=False,
    )

    is_used = db.Column(
        db.Boolean,
        default=False,
        nullable=False,
    )

    user = db.relationship(
        "User",
        backref="otp_verifications",
    )


def get_json():
    return request.get_json(
        silent=True
    ) or {}


def iso(value):
    return (
        value.isoformat()
        if value
        else None
    )


def current_user():

    user_id = session.get(
        "user_id"
    )

    if not user_id:
        return None

    return db.session.get(
        User,
        user_id,
    )


def require_role(*roles):

    def decorator(function):

        @wraps(function)
        def wrapper(*args, **kwargs):

            user = current_user()

            if not user:

                return jsonify(
                    {
                        "error": "Login required"
                    }
                ), 401

            if user.role not in roles:

                return jsonify(
                    {
                        "error": "Access denied"
                    }
                ), 403

            return function(
                *args,
                **kwargs
            )

        return wrapper

    return decorator


# ============================================================
# OTP HELPERS
# ============================================================


def generate_otp(length=6):
    return "".join(
        random.choices(
            string.digits,
            k=length,
        )
    )


def send_otp_sms(
    phone,
    otp_code,
    purpose="verification",
):
    print("\n" + "=" * 50)
    print(
        f"OTP for {phone}: {otp_code}"
    )
    print("=" * 50 + "\n")

    return {
        "success": True,
        "testing": True,
    }


def verify_otp(
    user_id,
    otp_code,
):

    otp = (
        OTPVerification.query
        .filter_by(
            user_id=user_id,
            otp_code=otp_code,
            is_used=False,
        )
        .order_by(
            OTPVerification.created_at.desc()
        )
        .first()
    )

    if not otp:

        return {
            "valid": False,
            "error": "Invalid OTP",
        }

    if datetime.utcnow() > otp.expires_at:

        return {
            "valid": False,
            "error": "OTP expired",
        }

    otp.is_used = True

    db.session.commit()

    return {
        "valid": True,
        "user_id": user_id,
    }


# ============================================================
# RESOURCE HELPERS
# ============================================================


def get_resources(hospital_id):

    rows = (
        HospitalAvailability.query
        .filter_by(
            hospital_id=hospital_id
        )
        .all()
    )

    return {

        row.resource_name: {

            "id": row.id,

            "resource_type": row.resource_type,

            "resource_name": row.resource_name,

            "total": row.total_count,

            "available": row.available_count,

            "unit": get_resource_unit(
                row.resource_name
            ),

            "updated_at": iso(
                row.updated_at
            ),
        }

        for row in rows
    }


def hospital_response(hospital):

    resources = get_resources(
        hospital.id
    )

    def available(name):

        return resources.get(
            name,
            {}
        ).get(
            "available",
            0,
        )

    timestamps = [

        row.updated_at

        for row in (
            HospitalAvailability.query
            .filter_by(
                hospital_id=hospital.id
            )
            .all()
        )

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

        "icu_available": available(
            "ICU"
        ),

        "blood_available": (
            available("Blood") > 0
        ),

        "oxygen_available": (
            available("Oxygen") > 0
        ),

        "emergency_service": (
            available("Emergency Service") > 0
        ),

        "ambulance_available": (
            available("Ambulance") > 0
        ),

        "last_updated": (
            iso(max(timestamps))
            if timestamps
            else None
        ),
    }


# ============================================================
# PATIENT SIGNUP
# ============================================================


@app.post("/api/signup")
def signup():

    data = get_json()

    required = [
        "name",
        "email",
        "password",
        "phone",
    ]

    if any(
        not data.get(key)
        for key in required
    ):

        return jsonify(
            {
                "error": (
                    "name, email, password "
                    "and phone are required"
                )
            }
        ), 400

    email = str(
        data["email"]
    ).strip().lower()

    if User.query.filter_by(
        email=email
    ).first():

        return jsonify(
            {
                "error": "Email already registered"
            }
        ), 409

    user = User(

        name=str(
            data["name"]
        ).strip(),

        email=email,

        password_hash=generate_password_hash(
            data["password"]
        ),

        phone=str(
            data["phone"]
        ).strip(),

        role="patient",

        age=data.get("age"),

        gender=data.get("gender"),

        blood_group=data.get(
            "blood_group"
        ),
    )

    db.session.add(user)

    db.session.commit()

    return jsonify(
        {
            "message": "Patient signup successful",
            "user_id": user.id,
        }
    ), 201


# ============================================================
# HOSPITAL ACCOUNT SIGNUP
# ============================================================


@app.post("/api/hospital/signup")
def hospital_signup():

    data = get_json()

    required = [
        "name",
        "email",
        "password",
        "phone",
    ]

    if any(
        not data.get(key)
        for key in required
    ):

        return jsonify(
            {
                "error": (
                    "name, email, password "
                    "and phone are required"
                )
            }
        ), 400

    email = str(
        data["email"]
    ).strip().lower()

    existing_user = User.query.filter_by(
        email=email
    ).first()

    if existing_user:

        return jsonify(
            {
                "error": "Email already registered"
            }
        ), 409

    user = User(

        name=str(
            data["name"]
        ).strip(),

        email=email,

        password_hash=generate_password_hash(
            data["password"]
        ),

        phone=str(
            data["phone"]
        ).strip(),

        role="hospital",

        designation=data.get(
            "designation",
            "Hospital Administrator",
        ),
    )

    db.session.add(user)

    db.session.commit()

    return jsonify(
        {

            "message": (
                "Hospital account "
                "created successfully"
            ),

            "user_id": user.id,

            "role": user.role,

            "hospital_id": None,

            "next_step": (
                "Login and register "
                "your hospital"
            ),
        }
    ), 201


# ============================================================
# LOGIN
#
# IMPORTANT:
# Keep direct login because your current React
# HospitalLogin.jsx expects data.user immediately.
# OTP endpoints are provided separately below.
# ============================================================


@app.post("/api/login")
def login():

    data = get_json()

    email = str(
        data.get(
            "email",
            "",
        )
    ).strip().lower()

    password = data.get(
        "password",
        "",
    )

    user = User.query.filter_by(
        email=email
    ).first()

    valid = (
        user
        and check_password_hash(
            user.password_hash,
            password,
        )
    )

    if not valid:

        return jsonify(
            {
                "error": (
                    "Invalid email "
                    "or password"
                )
            }
        ), 401

    session["user_id"] = user.id

    response = {

        "id": user.id,

        "name": user.name,

        "email": user.email,

        "role": user.role,

        "hospital_id": user.hospital_id,

        "designation": user.designation,
    }

    return jsonify(
        {

            "message": "Login successful",

            "user": response,

            "redirect": (
                "/hospital/dashboard"
                if user.role == "hospital"
                else "/"
            ),
        }
    )


# ============================================================
# LOGOUT
# ============================================================


@app.post("/api/logout")
def logout():

    session.clear()

    return jsonify(
        {
            "message": "Logged out"
        }
    )


# ============================================================
# CURRENT USER
# ============================================================


@app.get("/api/me")
def me():

    user = current_user()

    if not user:

        return jsonify(
            {
                "error": "Login required"
            }
        ), 401

    hospital = None

    if user.hospital_id:

        hospital = db.session.get(
            Hospital,
            user.hospital_id,
        )

    return jsonify(
        {

            "id": user.id,

            "name": user.name,

            "email": user.email,

            "role": user.role,

            "hospital_id": user.hospital_id,
            
            "phone": user.phone,
             
            "designation": user.designation,

            "hospital": (
                hospital_response(hospital)
                if hospital
                else None
            ),
        }
    )


# ============================================================
# HOSPITAL DASHBOARD
# ============================================================


@app.get("/api/hospital/dashboard")
@require_role("hospital")
def hospital_dashboard():

    user = current_user()

    if not user.hospital_id:

        return jsonify(
            {

                "has_hospital": False,

                "message": (
                    "No hospital registered. "
                    "Please register your hospital."
                ),

                "user": {

                    "id": user.id,

                    "name": user.name,

                    "email": user.email,

                    "role": user.role,

                    "hospital_id": None,

                    "designation": user.designation,
                },
            }
        )

    hospital = db.session.get(
        Hospital,
        user.hospital_id,
    )

    if not hospital:

        return jsonify(
            {
                "error": (
                    "Hospital linked to "
                    "your account was not found"
                )
            }
        ), 404

    return jsonify(
        {

            "has_hospital": True,

            "hospital": hospital_response(
                hospital
            ),

            "user": {

                "id": user.id,

                "name": user.name,

                "email": user.email,

                "role": user.role,

                "hospital_id": user.hospital_id,

                "designation": user.designation,
            },
        }
    )


# ============================================================
# REGISTER HOSPITAL
# ============================================================


@app.post("/api/hospital/register")
@require_role("hospital", "admin")
def register_hospital():

    user = current_user()

    data = get_json()

    if user.role == "hospital" and user.hospital_id:

        return jsonify(
            {

                "error": (
                    "You already have a "
                    "hospital registered."
                ),

                "hospital_id": user.hospital_id,
            }
        ), 409

    required_fields = [
        "hospital_name",
        "address",
        "city",
        "phone",
    ]

    for field in required_fields:

        if not str(
            data.get(
                field,
                "",
            )
        ).strip():

            return jsonify(
                {
                    "error": (
                        f"{field} is required"
                    )
                }
            ), 400

    hospital_name = str(
        data["hospital_name"]
    ).strip()

    address = str(
        data["address"]
    ).strip()

    city = str(
        data["city"]
    ).strip()

    state = str(
        data.get(
            "state",
            "",
        )
    ).strip()

    phone = str(
        data["phone"]
    ).strip()

    existing = (
        Hospital.query
        .filter_by(
            name=hospital_name,
            city=city,
        )
        .first()
    )

    if existing:

        return jsonify(
            {
                "error": (
                    "A hospital with this "
                    "name already exists "
                    "in this city."
                )
            }
        ), 409

    hospital = Hospital(

        name=hospital_name,

        address=address,

        city=city,

        state=state or None,

        phone=phone,

        latitude=data.get(
            "latitude"
        ),

        longitude=data.get(
            "longitude"
        ),
    )

    db.session.add(hospital)

    db.session.flush()

    resource_definitions = [

        (
            "bed",
            "ICU",
            "icu_total",
            "icu_available",
        ),

        (
            "blood",
            "Blood",
            "blood_total",
            "blood_available",
        ),

        (
            "oxygen",
            "Oxygen",
            "oxygen_total",
            "oxygen_available",
        ),

        (
            "service",
            "Emergency Service",
            "emergency_total",
            "emergency_available",
        ),

        (
            "service",
            "Ambulance",
            "ambulance_total",
            "ambulance_available",
        ),
    ]

    for (
        resource_type,
        resource_name,
        total_key,
        available_key,
    ) in resource_definitions:

        try:

            total = int(
                data.get(
                    total_key,
                    0,
                )
            )

            available = int(
                data.get(
                    available_key,
                    0,
                )
            )

        except (
            TypeError,
            ValueError,
        ):

            db.session.rollback()

            return jsonify(
                {
                    "error": (
                        "Resource values "
                        "must be numbers"
                    )
                }
            ), 400

        if total < 0:

            db.session.rollback()

            return jsonify(
                {
                    "error": (
                        f"{resource_name} "
                        "total cannot be negative"
                    )
                }
            ), 400

        if available < 0:

            db.session.rollback()

            return jsonify(
                {
                    "error": (
                        f"{resource_name} "
                        "available cannot be negative"
                    )
                }
            ), 400

        if available > total:

            db.session.rollback()

            return jsonify(
                {
                    "error": (
                        f"{resource_name}: "
                        "available cannot be "
                        "greater than total"
                    )
                }
            ), 400

        db.session.add(
            HospitalAvailability(

                hospital_id=hospital.id,

                resource_type=resource_type,

                resource_name=resource_name,

                total_count=total,

                available_count=available,

                updated_at=datetime.utcnow(),
            )
        )

    user.hospital_id = hospital.id

    user.role = "hospital"

    user.designation = data.get(
        "designation",
        "Hospital Administrator",
    )

    db.session.commit()

    return jsonify(
        {

            "message": (
                "Hospital registered "
                "successfully"
            ),

            "hospital": hospital_response(
                hospital
            ),

            "user": {

                "id": user.id,

                "name": user.name,

                "email": user.email,

                "role": user.role,

                "hospital_id": user.hospital_id,

                "designation": user.designation,
            },
        }
    ), 201


# ============================================================
# GET ALL HOSPITALS
# ============================================================


@app.get("/api/hospitals")
def get_hospitals():

    city = request.args.get(
        "city"
    )

    state = request.args.get(
        "state"
    )

    query = Hospital.query

    if city:

        query = query.filter(

            db.func.lower(
                Hospital.city
            )
            == city.lower()
        )

    if state:

        query = query.filter(

            db.func.lower(
                Hospital.state
            )
            == state.lower()
        )

    hospitals = (
        query
        .order_by(
            Hospital.name
        )
        .all()
    )

    return jsonify(
        [
            {
                **hospital_response(hospital),
                "created_at": iso(
                    hospital.created_at
                ),
            }
            for hospital in hospitals
        ]
    )


# ============================================================
# GET ONE HOSPITAL
# ============================================================


@app.get(
    "/api/hospitals/<int:hospital_id>"
)
def get_hospital(hospital_id):

    hospital = db.session.get(
        Hospital,
        hospital_id,
    )

    if not hospital:

        return jsonify(
            {
                "error": "Hospital not found"
            }
        ), 404

    return jsonify(
        hospital_response(
            hospital
        )
    )


# ============================================================
# NEARBY HOSPITALS
# Added from friend's changes
# ============================================================


@app.get("/api/hospitals/nearby")
def get_nearby_hospitals_api():

    latitude = request.args.get(
        "lat",
        type=float,
    )

    longitude = request.args.get(
        "lng",
        type=float,
    )

    max_distance = request.args.get(
        "distance",
        default=10,
        type=float,
    )

    if latitude is None or longitude is None:

        return jsonify(
            {
                "error": (
                    "Latitude and longitude "
                    "required"
                )
            }
        ), 400

    import math

    def calculate_distance(
        lat1,
        lon1,
        lat2,
        lon2,
    ):

        radius = 6371

        dlat = math.radians(
            lat2 - lat1
        )

        dlon = math.radians(
            lon2 - lon1
        )

        a = (
            math.sin(dlat / 2) ** 2
            +
            math.cos(
                math.radians(lat1)
            )
            * math.cos(
                math.radians(lat2)
            )
            * math.sin(
                dlon / 2
            ) ** 2
        )

        c = (
            2
            * math.asin(
                math.sqrt(a)
            )
        )

        return radius * c

    nearby = []

    for hospital in Hospital.query.all():

        if (
            hospital.latitude is not None
            and
            hospital.longitude is not None
        ):

            distance = calculate_distance(
                latitude,
                longitude,
                hospital.latitude,
                hospital.longitude,
            )

            if distance <= max_distance:

                nearby.append(
                    {

                        "id": hospital.id,

                        "name": hospital.name,

                        "address": hospital.address,

                        "city": hospital.city,

                        "state": hospital.state,

                        "latitude": hospital.latitude,

                        "longitude": hospital.longitude,

                        "phone": hospital.phone,

                        "distance_km": round(
                            distance,
                            2,
                        ),

                    }
                )

    nearby.sort(
        key=lambda item:
        item["distance_km"]
    )

    return jsonify(
        nearby
    )


# ============================================================
# ADMIN ADD HOSPITAL
# ============================================================


@app.post(
    "/api/hospitals"
)
@require_role("admin")
def add_hospital():

    data = get_json()

    required = [
        "name",
        "address",
        "city",
        "phone",
    ]

    if any(
        not data.get(field)
        for field in required
    ):

        return jsonify(
            {
                "error": (
                    "name, address, city "
                    "and phone are required"
                )
            }
        ), 400

    existing = (
        Hospital.query
        .filter_by(
            name=data["name"].strip(),
            city=data["city"].strip(),
        )
        .first()
    )

    if existing:

        return jsonify(
            {
                "error": "Hospital already exists"
            }
        ), 409

    hospital = Hospital(

        name=data[
            "name"
        ].strip(),

        address=data[
            "address"
        ].strip(),

        city=data[
            "city"
        ].strip(),

        state=data.get(
            "state"
        ),

        phone=data[
            "phone"
        ].strip(),

        latitude=data.get(
            "latitude"
        ),

        longitude=data.get(
            "longitude"
        ),
    )

    db.session.add(hospital)

    db.session.commit()

    return jsonify(
        {

            "message": (
                "Hospital added successfully"
            ),

            "hospital": hospital_response(
                hospital
            ),
        }
    ), 201


# ============================================================
# ADMIN UPDATE HOSPITAL
# Added from friend's changes
# ============================================================


@app.put(
    "/api/hospitals/<int:hospital_id>"
)
@require_role("admin")
def update_hospital(hospital_id):

    hospital = db.session.get(
        Hospital,
        hospital_id,
    )

    if not hospital:

        return jsonify(
            {
                "error": "Hospital not found"
            }
        ), 404

    data = get_json()

    if "name" in data:
        hospital.name = str(
            data["name"]
        ).strip()

    if "address" in data:
        hospital.address = str(
            data["address"]
        ).strip()

    if "city" in data:
        hospital.city = str(
            data["city"]
        ).strip()

    if "state" in data:
        hospital.state = (
            str(
                data["state"]
            ).strip()
            or None
        )

    if "phone" in data:
        hospital.phone = str(
            data["phone"]
        ).strip()

    if "latitude" in data:
        hospital.latitude = data[
            "latitude"
        ]

    if "longitude" in data:
        hospital.longitude = data[
            "longitude"
        ]

    db.session.commit()

    return jsonify(
        {

            "message":
                "Hospital updated successfully!",

            "hospital":
                hospital_response(
                    hospital
                ),

        }
    )


# ============================================================
# ADMIN DELETE HOSPITAL
# Added from friend's changes
# ============================================================


@app.delete(
    "/api/hospitals/<int:hospital_id>"
)
@require_role("admin")
def delete_hospital(hospital_id):

    hospital = db.session.get(
        Hospital,
        hospital_id,
    )

    if not hospital:

        return jsonify(
            {
                "error": "Hospital not found"
            }
        ), 404

    db.session.delete(
        hospital
    )

    db.session.commit()

    return jsonify(
        {

            "message":
                "Hospital deleted successfully!",

            "hospital_id":
                hospital_id,

        }
    )


# ============================================================
# GET HOSPITAL AVAILABILITY
# ============================================================


@app.get(
    "/api/hospital/<int:hospital_id>/availability"
)
def get_availability(hospital_id):

    hospital = db.session.get(
        Hospital,
        hospital_id,
    )

    if not hospital:

        return jsonify(
            {
                "error": "Hospital not found"
            }
        ), 404

    rows = (
        HospitalAvailability.query
        .filter_by(
            hospital_id=hospital_id
        )
        .all()
    )

    return jsonify(
        [

            {

                "id": row.id,

                "resource_type":
                    row.resource_type,

                "resource_name":
                    row.resource_name,

                "total":
                    row.total_count,

                "available":
                    row.available_count,

                "unit":
                    get_resource_unit(
                        row.resource_name
                    ),

                "updated_at":
                    iso(
                        row.updated_at
                    ),
            }

            for row in rows
        ]
    )


# ============================================================
# UPDATE HOSPITAL RESOURCE
# ============================================================


@app.put(
    "/api/hospital/<int:hospital_id>/availability"
)
@require_role(
    "hospital",
    "admin",
)
def update_availability(hospital_id):

    user = current_user()

    if (
        user.role == "hospital"
        and user.hospital_id != hospital_id
    ):

        return jsonify(
            {
                "error": (
                    "You can only update "
                    "your own hospital."
                )
            }
        ), 403

    hospital = db.session.get(
        Hospital,
        hospital_id,
    )

    if not hospital:

        return jsonify(
            {
                "error": "Hospital not found"
            }
        ), 404

    data = get_json()

    required = [
        "resource_type",
        "resource_name",
        "available_count",
    ]

    if any(
        key not in data
        for key in required
    ):

        return jsonify(
            {
                "error": (
                    "resource_type, "
                    "resource_name and "
                    "available_count "
                    "are required"
                )
            }
        ), 400

    resource_type = str(
        data["resource_type"]
    ).strip()

    resource_name = str(
        data["resource_name"]
    ).strip()

    try:

        available = int(
            data["available_count"]
        )

        total_input = data.get(
            "total_count"
        )

        if total_input is not None:

            total = int(
                total_input
            )

        else:

            existing_item = (
                HospitalAvailability.query
                .filter_by(
                    hospital_id=hospital_id,
                    resource_type=resource_type,
                    resource_name=resource_name,
                )
                .first()
            )

            total = (
                existing_item.total_count
                if existing_item
                else 0
            )

    except (
        TypeError,
        ValueError,
    ):

        return jsonify(
            {
                "error": (
                    "Total and available "
                    "values must be numbers"
                )
            }
        ), 400

    if total < 0:

        return jsonify(
            {
                "error":
                    "Total cannot be negative"
            }
        ), 400

    if available < 0:

        return jsonify(
            {
                "error":
                    "Available cannot be negative"
            }
        ), 400

    if available > total:

        return jsonify(
            {
                "error": (
                    "Available cannot be "
                    "greater than total"
                )
            }
        ), 400

    item = (
        HospitalAvailability.query
        .filter_by(

            hospital_id=hospital_id,

            resource_type=resource_type,

            resource_name=resource_name,
        )
        .first()
    )

    if item:

        item.total_count = total

        item.available_count = available

        item.updated_at = datetime.utcnow()

    else:

        item = HospitalAvailability(

            hospital_id=hospital_id,

            resource_type=resource_type,

            resource_name=resource_name,

            total_count=total,

            available_count=available,

            updated_at=datetime.utcnow(),
        )

        db.session.add(item)

    db.session.commit()

    return jsonify(
        {

            "message": (
                "Hospital resource "
                "updated successfully"
            ),

            "hospital_id":
                hospital_id,

            "resource_name":
                item.resource_name,

            "total":
                item.total_count,

            "available":
                item.available_count,

            "unit":
                get_resource_unit(
                    item.resource_name
                ),

            "updated_at":
                iso(
                    item.updated_at
                ),
        }
    )


# ============================================================
# SEARCH AVAILABLE RESOURCES
# ============================================================


@app.get("/api/search")
def search_resources():

    resource_type = request.args.get(
        "type"
    )

    resource_name = request.args.get(
        "name"
    )

    query = (
        HospitalAvailability.query
        .filter(
            HospitalAvailability
            .available_count > 0
        )
    )

    if resource_type:

        query = query.filter_by(
            resource_type=resource_type
        )

    if resource_name:

        query = query.filter_by(
            resource_name=resource_name
        )

    result = []

    for item in query.all():

        hospital = db.session.get(
            Hospital,
            item.hospital_id,
        )

        if hospital:

            result.append(
                {

                    "hospital_id":
                        hospital.id,

                    "hospital_name":
                        hospital.name,

                    "hospital_address":
                        hospital.address,

                    "hospital_phone":
                        hospital.phone,

                    "resource_type":
                        item.resource_type,

                    "resource_name":
                        item.resource_name,

                    "available":
                        item.available_count,

                    "unit":
                        get_resource_unit(
                            item.resource_name
                        ),
                }
            )

    return jsonify(
        result
    )


# ============================================================
# SEND SOS
# ============================================================


@app.post("/api/sos")
def send_sos():

    data = get_json()

    required = [
        "hospital_id",
        "emergency_type",
        "patient_name",
    ]

    if any(
        not data.get(key)
        for key in required
    ):

        return jsonify(
            {
                "error": (
                    "hospital_id, "
                    "emergency_type, "
                    "patient_name are required"
                )
            }
        ), 400

    hospital = db.session.get(
        Hospital,
        data["hospital_id"],
    )

    if not hospital:

        return jsonify(
            {
                "error": "Hospital not found"
            }
        ), 404

    user = current_user()

    sos = SOSRequest(

        user_id=(
            user.id
            if user
            else data.get("user_id")
        ),

        hospital_id=hospital.id,

        latitude=data.get(
            "latitude"
        ),

        longitude=data.get(
            "longitude"
        ),

        emergency_type=data[
            "emergency_type"
        ],

        patient_name=data[
            "patient_name"
        ].strip(),

        age=data.get(
            "age"
        ),

        gender=data.get(
            "gender"
        ),

        phone=data[
            "phone"
        ].strip(),

        notes=data.get(
            "notes"
        ),
    )

    db.session.add(sos)

    db.session.commit()

    return jsonify(
        {

            "message":
                "SOS sent successfully",

            "sos_id":
                sos.id,

            "status":
                sos.status,
        }
    ), 201


# ============================================================
# GET SOS STATUS
# ============================================================


@app.get(
    "/api/sos/<int:sos_id>"
)
def get_sos_status(sos_id):

    sos = db.session.get(
        SOSRequest,
        sos_id,
    )

    if not sos:

        return jsonify(
            {
                "error": "SOS not found"
            }
        ), 404

    return jsonify(
        {

            "sos_id":
                sos.id,

            "hospital_id":
                sos.hospital_id,

            "patient_name":
                sos.patient_name,

            "emergency_type":
                sos.emergency_type,

            "status":
                sos.status,

            "created_at":
                iso(
                    sos.created_at
                ),

            "updated_at":
                iso(
                    sos.updated_at
                ),
        }
    )


# ============================================================
# HOSPITAL SOS LIST
# ============================================================


@app.get(
    "/api/hospital/<int:hospital_id>/sos"
)
@require_role(
    "hospital",
    "admin",
)
def get_hospital_sos(hospital_id):

    user = current_user()

    if (
        user.role == "hospital"
        and user.hospital_id != hospital_id
    ):

        return jsonify(
            {
                "error": "Access denied"
            }
        ), 403

    rows = (

        SOSRequest.query

        .filter_by(
            hospital_id=hospital_id
        )

        .order_by(
            SOSRequest.created_at.desc()
        )

        .all()
    )

    return jsonify(
        [

            {

                "sos_id":
                    row.id,

                "hospital_id":
                    row.hospital_id,

                "patient_name":
                    row.patient_name,

                "age":
                    row.age,

                "gender":
                    row.gender,

                "phone":
                    row.phone,

                "emergency_type":
                    row.emergency_type,

                "notes":
                    row.notes,

                "status":
                    row.status,

                "created_at":
                    iso(
                        row.created_at
                    ),

                "updated_at":
                    iso(
                        row.updated_at
                    ),
            }

            for row in rows
        ]
    )


# ============================================================
# UPDATE SOS STATUS
# ============================================================


@app.put(
    "/api/sos/<int:sos_id>/status"
)
@require_role(
    "hospital",
    "admin",
)
def update_sos_status(sos_id):

    data = get_json()

    status = str(
        data.get(
            "status",
            "",
        )
    ).lower()

    if status not in ALLOWED_SOS_STATUSES:

        return jsonify(
            {
                "error": "Invalid status"
            }
        ), 400

    sos = db.session.get(
        SOSRequest,
        sos_id,
    )

    if not sos:

        return jsonify(
            {
                "error": "SOS not found"
            }
        ), 404

    user = current_user()

    if (
        user.role == "hospital"
        and user.hospital_id != sos.hospital_id
    ):

        return jsonify(
            {
                "error": "Access denied"
            }
        ), 403

    sos.status = status

    sos.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(
        {

            "message":
                "SOS status updated",

            "sos_id":
                sos.id,

            "status":
                sos.status,
        }
    )


# ============================================================
# ACCEPT SOS
# ============================================================


@app.put(
    "/api/sos/<int:sos_id>/accept"
)
@require_role(
    "hospital",
    "admin",
)
def accept_sos(sos_id):

    sos = db.session.get(
        SOSRequest,
        sos_id,
    )

    if not sos:

        return jsonify(
            {
                "error":
                    "SOS request not found"
            }
        ), 404

    user = current_user()

    if (
        user.role == "hospital"
        and user.hospital_id != sos.hospital_id
    ):

        return jsonify(
            {
                "error":
                    "Access denied"
            }
        ), 403

    sos.status = "accepted"

    sos.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(
        {

            "message":
                "SOS accepted",

            "sos_id":
                sos.id,

            "status":
                sos.status,
        }
    )


# ============================================================
# REJECT SOS
# ============================================================


@app.put(
    "/api/sos/<int:sos_id>/reject"
)
@require_role(
    "hospital",
    "admin",
)
def reject_sos(sos_id):

    sos = db.session.get(
        SOSRequest,
        sos_id,
    )

    if not sos:

        return jsonify(
            {
                "error":
                    "SOS request not found"
            }
        ), 404

    user = current_user()

    if (
        user.role == "hospital"
        and user.hospital_id != sos.hospital_id
    ):

        return jsonify(
            {
                "error":
                    "Access denied"
            }
        ), 403

    sos.status = "rejected"

    sos.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify(
        {

            "message":
                "SOS rejected",

            "sos_id":
                sos.id,

            "status":
                sos.status,
        }
    )


# ============================================================
# DELETE SOS
# ============================================================


@app.delete(
    "/api/sos/<int:sos_id>"
)
@require_role(
    "hospital",
    "admin",
)
def delete_sos(sos_id):

    sos = db.session.get(
        SOSRequest,
        sos_id,
    )

    if not sos:

        return jsonify(
            {
                "error":
                    "SOS request not found"
            }
        ), 404

    user = current_user()

    if (
        user.role == "hospital"
        and user.hospital_id != sos.hospital_id
    ):

        return jsonify(
            {
                "error":
                    "Access denied"
            }
        ), 403

    db.session.delete(
        sos
    )

    db.session.commit()

    return jsonify(
        {

            "message":
                "SOS request deleted successfully",

            "sos_id":
                sos_id,
        }
    )


# ============================================================
# OTP VERIFICATION ENDPOINTS
# Added from friend's changes
# ============================================================


@app.post("/api/verify-otp")
def verify_otp_endpoint():

    data = get_json()

    user_id = data.get(
        "user_id"
    )

    otp_code = data.get(
        "otp"
    )

    if not user_id or not otp_code:

        return jsonify(
            {
                "error":
                    "user_id and otp are required"
            }
        ), 400

    result = verify_otp(
        user_id,
        str(otp_code),
    )

    if not result["valid"]:

        return jsonify(
            {
                "error":
                    result["error"]
            }
        ), 400

    user = db.session.get(
        User,
        user_id,
    )

    if not user:

        return jsonify(
            {
                "error":
                    "User not found"
            }
        ), 404

    session["user_id"] = user.id

    return jsonify(
        {

            "message":
                "Login successful",

            "user": {

                "id":
                    user.id,

                "name":
                    user.name,

                "email":
                    user.email,

                "role":
                    user.role,

                "hospital_id":
                    user.hospital_id,

                "designation":
                    user.designation,
            },
        }
    )


@app.post("/api/resend-otp")
def resend_otp():

    data = get_json()

    user_id = data.get(
        "user_id"
    )

    if not user_id:

        return jsonify(
            {
                "error":
                    "user_id is required"
            }
        ), 400

    user = db.session.get(
        User,
        user_id,
    )

    if not user:

        return jsonify(
            {
                "error":
                    "User not found"
            }
        ), 404

    old_otps = (
        OTPVerification.query
        .filter_by(
            user_id=user_id,
            is_used=False,
        )
        .all()
    )

    for otp in old_otps:

        otp.is_used = True

    otp_code = generate_otp()

    expires_at = (
        datetime.utcnow()
        + timedelta(minutes=5)
    )

    otp = OTPVerification(

        user_id=user.id,

        otp_code=otp_code,

        phone=user.phone,

        purpose="login",

        expires_at=expires_at,
    )

    db.session.add(otp)

    db.session.commit()

    send_otp_sms(
        user.phone,
        otp_code,
        "login",
    )

    return jsonify(
        {

            "message":
                "New OTP sent",

            "phone_last_4":
                (
                    user.phone[-4:]
                    if len(user.phone) > 4
                    else user.phone
                ),
        }
    )


# ============================================================
# PATIENT STATIC FILES
# ============================================================


@app.get("/")
def patient_home():

    patient_dir = (
        BASE_DIR
        / "static"
        / "patient"
    )

    if (
        patient_dir
        / "index.html"
    ).exists():

        return send_from_directory(
            patient_dir,
            "index.html",
        )

    return jsonify(
        {

            "message":
                "RESQ backend is running",

            "frontend":
                "Place patient files in static/patient",
        }
    )


@app.get(
    "/patient/<path:filename>"
)
def patient_files(filename):

    return send_from_directory(
        BASE_DIR
        / "static"
        / "patient",
        filename,
    )


# ============================================================
# HEALTH
# ============================================================


@app.get("/api/health")
def health():

    return jsonify(
        {

            "success":
                True,

            "message":
                "RESQ backend is running",
        }
    )


# ============================================================
# CLI SEED COMMAND
# ============================================================


@app.cli.command("seed")
def seed_command():

    seed_demo_data()

    print(
        "Demo hospitals and resources seeded."
    )


# ============================================================
# DEMO DATA
# ============================================================


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
        db.session.add_all(
            hospitals
        )

        db.session.flush()

    for hospital in Hospital.query.all():

        default_resources = [

            (
                "bed",
                "ICU",
                50,
                8,
            ),

            (
                "blood",
                "Blood",
                20,
                10,
            ),

            (
                "oxygen",
                "Oxygen",
                30,
                15,
            ),

            (
                "service",
                "Emergency Service",
                1,
                1,
            ),

            (
                "service",
                "Ambulance",
                2,
                1,
            ),
        ]

        for (
            resource_type,
            resource_name,
            total,
            available,
        ) in default_resources:

            existing = (
                HospitalAvailability.query
                .filter_by(
                    hospital_id=hospital.id,
                    resource_name=resource_name,
                )
                .first()
            )

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

    hospital_user = User.query.filter_by(
        email="hospital@resq.com"
    ).first()

    if not hospital_user:

        city_hospital = (
            Hospital.query.filter_by(
                name="City Hospital"
            ).first()
        )

        if city_hospital:
            db.session.add(
                User(
                    name="City Hospital Admin",
                    email="hospital@resq.com",
                    password_hash=generate_password_hash("resq123"),
                    phone="9999999999",
                    role="hospital",
                    hospital_id=city_hospital.id,
                    designation="Hospital Administrator",
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


# ============================================================
# CREATE DATABASE
# ============================================================


with app.app_context():

    db.create_all()

    seed_demo_data()


# ============================================================
# RUN SERVER
# ============================================================


if __name__ == "__main__":

    print(
        "RESQ backend running at "
        "http://localhost:5001"
    )

    print(
        f"Database: {DATABASE_PATH}"
    )

    app.run(
        debug=True,
        port=5001,
    )
