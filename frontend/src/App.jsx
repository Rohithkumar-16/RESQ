import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AITriage from "./pages/AITriage";
import Home from "./pages/Home";
import Hospitals from "./pages/Hospitals";
import HospitalDetails from "./pages/HospitalDetails";
import RequestStatus from "./pages/RequestStatus";
import HospitalDashboard from "./pages/HospitalDashboard";
import HospitalLogin from "./pages/HospitalLogin";
import AddHospital from "./pages/AddHospital";
import PatientLogin from "./pages/PatientLogin";
import PatientSignup from "./pages/PatientSignup";
import PatientDashboard from "./pages/PatientDashboard";
import PatientProtectedRoute from "./components/PatientProtectedRoute";
import HospitalProtectedRoute from "./components/HospitalProtectedRoute";
function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =====================================================
            HOME
        ====================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* =====================================================
            HOSPITALS
        ====================================================== */}

        <Route
          path="/hospitals"
          element={<Hospitals />}
        />

        {/* =====================================================
            HOSPITAL DETAILS
        ====================================================== */}

        <Route
          path="/hospital/:id"
          element={<HospitalDetails />}
        />

        {/* =====================================================
            SOS REQUEST STATUS
        ====================================================== */}

        <Route
          path="/request/:id"
          element={<RequestStatus />}
        />

        {/* =====================================================
            HOSPITAL LOGIN / CREATE ACCOUNT
        ====================================================== */}

        <Route
          path="/hospital-login"
          element={<HospitalLogin />}
        />

        {/* =====================================================
            HOSPITAL DASHBOARD
        ====================================================== */}

        <Route
          path="/hospital-dashboard"
          element={
            <HospitalProtectedRoute>
              <HospitalDashboard />
            </HospitalProtectedRoute>
          }
        />

        {/* =====================================================
            HOSPITAL REGISTRATION
        ====================================================== */}

        <Route
          path="/add-hospital"
          element={<AddHospital />}
        />
        <Route
          path="/patient-dashboard"
          element={
            <PatientProtectedRoute>
              <PatientDashboard />
            </PatientProtectedRoute>
          }
        />

        {/* =====================================================
            FALLBACK
        ====================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route
          path="/patient-signup"
          element={<PatientSignup />}
        />
        <Route
          path="/ai-triage"
          element={<AITriage />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;