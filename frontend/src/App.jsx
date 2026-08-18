import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Hospitals from "./pages/Hospitals";
import HospitalDetails from "./pages/HospitalDetails";
import RequestStatus from "./pages/RequestStatus";
import HospitalDashboard from "./pages/HospitalDashboard";
import HospitalLogin from "./pages/HospitalLogin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/hospitals" element={<Hospitals />} />

        <Route path="/hospital/:id" element={<HospitalDetails />} />

        <Route path="/request/:id" element={<RequestStatus />} />

        <Route
          path="/hospital-login"
          element={<HospitalLogin />}
        />

        <Route
          path="/hospital-dashboard"
          element={<HospitalDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;