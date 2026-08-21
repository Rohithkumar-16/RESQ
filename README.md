# RESQ

RESQ is a smart emergency healthcare coordination platform designed to connect patients with hospitals during critical situations.

The platform allows patients to find hospitals and check the availability of essential emergency resources such as ICU beds, blood, oxygen, emergency services, and ambulances. Patients can also submit SOS requests to hospitals and track their request status.

Hospital staff can securely log in, manage incoming emergency requests, update resource availability, and respond to patient emergencies through a centralized backend.

## Features

### Patient Portal

- View registered hospitals
- Search hospitals by city
- View hospital contact and location details
- Check ICU bed availability
- Check blood availability
- Check oxygen availability
- Check ambulance availability
- Check emergency-service availability
- Submit SOS emergency requests
- Track emergency request status
- Manage basic patient information

### Hospital Portal

- Secure hospital staff login
- View incoming emergency requests
- View patient information related to requests
- Accept or reject emergency requests
- Update emergency request status
- Manage ICU, blood, oxygen, ambulance, and emergency-service availability
- Maintain up-to-date hospital resource information

### Admin Features

- Add hospitals
- Manage hospital information
- Manage hospital resource data
- Seed initial/demo hospital data

## Technology Stack

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-CORS
- SQLite for local development
- PostgreSQL support for deployment
- Werkzeug password hashing
- Flask sessions for authentication

### Frontend

- React
- Vite
- JavaScript
- HTML
- CSS
- ESLint

### Database

- SQLite for local development
- PostgreSQL for production deployment

## Project Structure

```text
RESQ/
├── database.py
├── requirements.txt
├── package.json
├── package-lock.json
├── README.md
├── .gitignore
└── frontend/
    ├── public/
    ├── src/
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── eslint.config.js
    └── index.html
```

## API Overview

### Authentication

```text
POST /api/signup
POST /api/login
POST /api/logout
```

### Hospitals

```text
GET  /api/hospitals
GET  /api/hospitals/<hospital_id>
POST /api/hospitals
```

### Hospital Availability

```text
GET /api/hospital/<hospital_id>/availability
PUT /api/hospital/<hospital_id>/availability
```

### Emergency Requests

```text
POST /api/sos
GET  /api/sos/<sos_id>
GET  /api/hospital/<hospital_id>/sos
PUT  /api/sos/<sos_id>/accept
PUT  /api/sos/<sos_id>/reject
PUT  /api/sos/<sos_id>/status
```

### Resource Search

```text
GET /api/search
```

The search API can be used to find hospitals/resources based on requirements such as ICU, blood, oxygen, and other emergency services.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/Rohithkumar-16/RESQ.git
cd RESQ
```

### 2. Create and activate a virtual environment

#### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Start the backend

From the project root:

```bash
python database.py
```

The Flask backend runs on:

```text
http://localhost:5000
```

### 6. Start the frontend

From the `frontend` directory:

```bash
npm run dev
```

The Vite development server will provide the frontend URL in the terminal.

## Database

RESQ uses SQLite during local development.

For production deployment, PostgreSQL can be configured through the `DATABASE_URL` environment variable.

The database stores information related to:

- Patients
- Hospitals
- Hospital resources
- Emergency/SOS requests
- Authentication and user roles

## Application Workflow

```text
Patient
   ↓
Search Hospitals
   ↓
Check Resource Availability
   ↓
Select Hospital
   ↓
Submit SOS Request
   ↓
Request Stored in Database
   ↓
Hospital Staff Receives Request
   ↓
Accept / Reject Request
   ↓
Update Request Status
   ↓
Update Hospital Resource Availability
   ↓
Patient Tracks Request
```

## Deployment

The backend can be deployed using a platform such as Render or Railway.

For production deployment:

1. Configure a PostgreSQL database.
2. Set the `DATABASE_URL` environment variable.
3. Configure a secure `SECRET_KEY`.
4. Install dependencies from `requirements.txt`.
5. Build and deploy the React frontend.
6. Run the Flask application using a production WSGI server.

## Important Note

RESQ is currently a prototype developed for demonstration and educational purposes.

A production-ready healthcare platform would require additional security, authentication, hospital verification, audit logging, data privacy controls, HTTPS, monitoring, backups, notifications, and compliance with applicable healthcare regulations.

## Future Improvements

- Real-time emergency notifications
- GPS-based hospital discovery
- Live ambulance tracking
- SMS/email/push notifications
- Hospital verification
- Advanced role-based access control
- Improved authentication and security
- Production database migrations
- Real-time resource synchronization
- Healthcare data privacy and compliance
- Deployment and monitoring infrastructure

## Team NOIR

Built as a prototype for emergency healthcare coordination.

Find care. Request help. Respond faster.
