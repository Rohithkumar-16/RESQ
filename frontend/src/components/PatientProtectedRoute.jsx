import { Navigate } from "react-router-dom";

function PatientProtectedRoute({ children }) {
  const storedUser = localStorage.getItem("resq_patient_user");

  if (!storedUser) {
    return <Navigate to="/patient-login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    if (!user || user.role !== "patient") {
      localStorage.removeItem("resq_patient_user");
      return <Navigate to="/patient-login" replace />;
    }

    return children;
  } catch {
    localStorage.removeItem("resq_patient_user");
    return <Navigate to="/patient-login" replace />;
  }
}

export default PatientProtectedRoute;