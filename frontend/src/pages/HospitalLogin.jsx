import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Lock, Mail, TriangleAlert } from "lucide-react";

const API_URL = "http://localhost:5001/api";

function HospitalLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("hospital@resq.com");
  const [password, setPassword] = useState("resq123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user.role !== "hospital" && data.user.role !== "admin") {
        throw new Error("This account is not a hospital account");
      }

      navigate("/hospital-dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-login-wrapper">
        <div className="dashboard-login-card">
          <div className="dashboard-login-logo">
            <Activity size={28} />
            <span>RESQ</span>
          </div>

          <p className="dashboard-label">HOSPITAL PORTAL</p>

          <h1>Hospital Login</h1>

          <p className="dashboard-login-description">
            Sign in to view and manage incoming emergency requests.
          </p>

          {error && (
            <div className="dashboard-error">
              <TriangleAlert size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <label>
              Email
              <div className="dashboard-input-wrapper">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Hospital email"
                  required
                />
              </div>
            </label>

            <label>
              Password
              <div className="dashboard-input-wrapper">
                <Lock size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  required
                />
              </div>
            </label>

            <button
              className="dashboard-login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in to Dashboard"}
            </button>
          </form>

          <button
            className="dashboard-back-button"
            onClick={() => navigate("/")}
          >
            Back to RESQ
          </button>
        </div>
      </div>
    </div>
  );
}

export default HospitalLogin;