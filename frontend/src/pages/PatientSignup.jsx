import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  UserRound,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import "../App.css";

const API_URL = "http://localhost:5001";

function PatientSignup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    age: "",
    gender: "",
    blood_group: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.phone.trim()
    ) {
      setError(
        "Name, email, password and phone are required."
      );
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
            phone: form.phone.trim(),
            age: form.age
              ? Number(form.age)
              : null,
            gender: form.gender || null,
            blood_group:
              form.blood_group || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create account."
        );
      }

      setSuccess(
        "Patient account created successfully!"
      );

      setTimeout(() => {
        navigate("/patient-login");
      }, 1200);

    } catch (err) {
      console.error("Patient signup:", err);

      setError(
        err.message ||
          "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-signup-page">

      {/* =====================================================
          LEFT PANEL
      ====================================================== */}

      <div className="patient-signup-brand">

        <div className="patient-signup-brand-content">

          <div
            className="patient-signup-logo"
            onClick={() => navigate("/")}
          >
            <div className="patient-signup-logo-icon">
              R
            </div>

            <span>RESQ</span>
          </div>

          <div className="patient-signup-heading">

            <div className="patient-signup-badge">
              <Activity size={14} />
              Patient Registration
            </div>

            <h1>
              Your healthcare,
              <br />
              <span>connected.</span>
            </h1>

            <p>
              Create your RESQ patient account to
              find hospitals, check critical resources
              and access emergency healthcare services.
            </p>

          </div>

          <div className="patient-signup-features">

            <div>
              <span>✓</span>
              <p>
                Find nearby hospitals quickly
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                Check ICU, blood and oxygen availability
              </p>
            </div>

            <div>
              <span>✓</span>
              <p>
                Access emergency assistance
              </p>
            </div>

          </div>

        </div>

        <div className="patient-signup-brand-footer">
          Smart emergency healthcare management
        </div>

      </div>


      {/* =====================================================
          FORM PANEL
      ====================================================== */}

      <div className="patient-signup-form-area">

        <div className="patient-signup-card">

          <div className="patient-signup-mobile-logo">

            <div>
              R
            </div>

            <span>
              RESQ
            </span>

          </div>


          <div className="patient-signup-title">

            <span>
              CREATE ACCOUNT
            </span>

            <h2>
              Create your patient account
            </h2>

            <p>
              Enter your details to get started with RESQ.
            </p>

          </div>


          {/* ERROR */}

          {error && (
            <div className="patient-signup-message error">
              <TriangleAlert size={17} />
              <span>{error}</span>
            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div className="patient-signup-message success">
              <span>✓</span>
              <span>{success}</span>
            </div>
          )}


          <form onSubmit={handleSignup}>

            {/* NAME */}

            <div className="patient-signup-form-group">

              <label>
                Full Name
              </label>

              <div className="patient-signup-input">

                <UserRound size={18} />

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="name"
                />

              </div>

            </div>


            {/* EMAIL + PHONE */}

            <div className="patient-signup-two-columns">

              <div className="patient-signup-form-group">

                <label>
                  Email Address
                </label>

                <div className="patient-signup-input">

                  <Mail size={18} />

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="email"
                  />

                </div>

              </div>


              <div className="patient-signup-form-group">

                <label>
                  Phone Number
                </label>

                <div className="patient-signup-input">

                  <Phone size={18} />

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={loading}
                    autoComplete="tel"
                  />

                </div>

              </div>

            </div>


            {/* PASSWORD */}

            <div className="patient-signup-form-group">

              <label>
                Password
              </label>

              <div className="patient-signup-input">

                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Create a password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="patient-signup-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

              <small>
                Use at least 6 characters.
              </small>

            </div>


            {/* AGE + GENDER */}

            <div className="patient-signup-two-columns">

              <div className="patient-signup-form-group">

                <label>
                  Age
                </label>

                <input
                  className="patient-signup-plain-input"
                  type="number"
                  name="age"
                  placeholder="Age"
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={handleChange}
                  disabled={loading}
                />

              </div>


              <div className="patient-signup-form-group">

                <label>
                  Gender
                </label>

                <select
                  className="patient-signup-plain-input"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">
                    Select gender
                  </option>

                  <option value="Male">
                    Male
                  </option>

                  <option value="Female">
                    Female
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

            </div>


            {/* BLOOD GROUP */}

            <div className="patient-signup-form-group">

              <label>
                Blood Group
              </label>

              <select
                className="patient-signup-plain-input"
                name="blood_group"
                value={form.blood_group}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">
                  Select blood group
                </option>

                <option value="A+">
                  A+
                </option>

                <option value="A-">
                  A-
                </option>

                <option value="B+">
                  B+
                </option>

                <option value="B-">
                  B-
                </option>

                <option value="AB+">
                  AB+
                </option>

                <option value="AB-">
                  AB-
                </option>

                <option value="O+">
                  O+
                </option>

                <option value="O-">
                  O-
                </option>

              </select>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="patient-signup-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <Activity size={17} />
                  Creating account...
                </>
              ) : (
                <>
                  Create Patient Account
                  <ArrowRight size={17} />
                </>
              )}

            </button>

          </form>


          {/* LOGIN */}

          <div className="patient-signup-login">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/patient-login")
              }
            >
              Patient Login
            </button>

          </div>


          {/* BACK */}

          <button
            className="patient-signup-back"
            type="button"
            onClick={() => navigate("/")}
          >
            ← Back to RESQ
          </button>


          <div className="patient-signup-security">

            <ShieldCheck size={15} />

            <span>
              Your account is protected by RESQ
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default PatientSignup;