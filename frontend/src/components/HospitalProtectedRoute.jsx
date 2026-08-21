import { Navigate } from "react-router-dom";

function HospitalProtectedRoute({ children }) {
  const storedUser = localStorage.getItem("resq_hospital_user");

  if (!storedUser) {
    return <Navigate to="/hospital-login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    if (
      !user ||
      (user.role !== "hospital" && user.role !== "admin")
    ) {
      localStorage.removeItem("resq_hospital_user");

      return (
        <Navigate
          to="/hospital-login"
          replace
        />
      );
    }

    return children;
  } catch {
    localStorage.removeItem("resq_hospital_user");

    return (
      <Navigate
        to="/hospital-login"
        replace
      />
    );
  }
}

export default HospitalProtectedRoute;