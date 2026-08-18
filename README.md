# RESQ

RESQ is a smart emergency healthcare coordination platform that connects patients with hospitals during critical situations.

Patients can view nearby hospitals, check the availability of ICU beds, blood, oxygen, emergency services, and ambulances, and submit emergency requests directly to a selected hospital. Hospital staff can securely log in, manage incoming emergency requests, update their hospital’s resource availability, and respond to patients in real time.

## Features

### Patient portal

- View registered hospitals.
- Search hospitals by city.
- View hospital addresses, phone numbers, and map coordinates.
- Check ICU bed availability.
- Check blood availability.
- Check oxygen availability.
- Check emergency-service availability.
- Check ambulance availability.
- Submit an SOS emergency request.
- Track the status of an emergency request.
- Manage basic patient details.

### Hospital portal

- Hospital staff login.
- View emergency requests sent to their hospital.
- View patient details related to an emergency request.
- Accept or reject emergency requests.
- Update request statuses such as:
  - Pending
  - Accepted
  - Rejected
  - In progress
  - Resolved
- Update ICU, blood, oxygen, ambulance, and emergency-service availability.

### Admin features

- Add new hospitals.
- Manage hospital information.
- Seed demo hospitals and resource data.

## Technology Stack

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- Flask-CORS
- SQLite for local development
- PostgreSQL for online deployment
- Werkzeug password hashing
- Flask sessions for authentication

### Frontend

- HTML
- CSS
- JavaScript

### Deployment

The application can be deployed using platforms such as Render or Railway.

The backend can connect to a hosted PostgreSQL database through the `DATABASE_URL` environment variable.

## Project Structure

```text
RESQ/
├── database.py
├── requirements.txt
├── README.md
├── instance/
│   └── resq.db
└── static/
    └── patient/
        ├── index.html
        ├── patient.css
        └── patient.js
```

The `instance/resq.db` file is used for local SQLite development. In production, the application should use a hosted PostgreSQL database instead.

## API Overview

### General

```text
GET /api/health
```

Checks whether the backend is running.

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

The `POST /api/hospitals` endpoint is restricted to administrators.

### Hospital availability

```text
GET /api/hospital/<hospital_id>/availability
PUT /api/hospital/<hospital_id>/availability
```

Hospital staff can update resources only for their assigned hospital.

### Emergency requests

```text
POST /api/sos
GET  /api/sos/<sos_id>
GET  /api/hospital/<hospital_id>/sos
PUT  /api/sos/<sos_id>/accept
PUT  /api/sos/<sos_id>/reject
PUT  /api/sos/<sos_id>/status
```

Hospital staff can view and manage emergency requests belonging to their hospital.

### Resource search

```text
GET /api/search
```

Example:

```text
/api/search?name=ICU
/api/search?name=Blood
/api/search?name=Oxygen
```

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd RESQ
```

### 2. Create a virtual environment

#### Windows

```powershell
python -m venv venv
venv\Scripts\activate
```

#### macOS or Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set the secret key

#### Windows PowerShell

```powershell
$env:SECRET_KEY = "replace-with-a-long-random-secret"
```

#### macOS or Linux

```bash
export SECRET_KEY="replace-with-a-long-random-secret"
```

### 5. Run the backend

```bash
python database.py
```

The backend will run at:

```text
http://localhost:5000
```

### 6. Check the backend

Open:

```text
http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "RESQ backend is running"
}
```

The patient frontend is served from:

```text
http://localhost:5000/
```

if the files are present in:

```text
static/patient/
```

## Database

For local development, RESQ uses SQLite:

```text
sqlite:///instance/resq.db
```

For deployment, configure PostgreSQL using:

```text
DATABASE_URL=your-postgresql-connection-string
```

The database configuration should select PostgreSQL when `DATABASE_URL` is available and SQLite otherwise.

## Deployment

For production deployment:

1. Push the project to GitHub.
2. Create a hosted PostgreSQL database.
3. Create a Flask web service on a hosting platform.
4. Add the `DATABASE_URL` environment variable.
5. Add a secure `SECRET_KEY`.
6. Install the dependencies from `requirements.txt`.
7. Use a production WSGI server.

Example start command:

```bash
gunicorn database:app
```

Do not use Flask's development server for production deployment.

## Example Workflow

```text
1. A patient opens the RESQ patient portal.
2. The patient views available hospitals and resources.
3. The patient selects a hospital.
4. The patient submits an emergency request.
5. The request is stored in the shared database.
6. The selected hospital staff logs in.
7. Hospital staff views the incoming request.
8. Staff accepts or rejects the request.
9. Staff updates resource availability.
10. The patient can check the updated request status and hospital resources.
```

## Important Note

RESQ is currently a basic emergency coordination and hospital resource management prototype. It is designed for demonstration and educational purposes.

A production healthcare platform would require additional features such as:

- Stronger authentication.
- HTTPS.
- Hospital verification.
- Role-management workflows.
- Audit logs.
- Database migrations.
- Data privacy and compliance controls.
- Notifications through SMS, email, or push messages.
- Location and map-service integration.
- Monitoring and backup systems.

## Future Improvements

- Real-time notifications for emergency requests.
- GPS-based nearby-hospital search.
- Online ambulance tracking.
- Hospital verification.
- Patient medical-record integration.
- Blood-bank integration.
- Multi-language support.
- Doctor and ambulance-driver portals.
- Analytics dashboard for hospitals and administrators.

## License

This project is intended for educational and demonstration purposes.
