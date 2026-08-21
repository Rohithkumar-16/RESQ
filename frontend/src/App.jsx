import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Hospitals from "./pages/Hospitals";
import HospitalDetails from "./pages/HospitalDetails";
import RequestStatus from "./pages/RequestStatus";
import HospitalDashboard from "./pages/HospitalDashboard";
import HospitalLogin from "./pages/HospitalLogin";
import AddHospital from "./pages/AddHospital";

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
          element={<HospitalDashboard />}
        />

        {/* =====================================================
            HOSPITAL REGISTRATION
        ====================================================== */}

        <Route
          path="/add-hospital"
          element={<AddHospital />}
        />

        {/* =====================================================
            FALLBACK
        ====================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;