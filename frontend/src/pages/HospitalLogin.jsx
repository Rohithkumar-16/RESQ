import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Activity,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  TriangleAlert,
  User,
} from "lucide-react";

const API_URL = "http://localhost:5001/api";

function HospitalLogin() {
  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);

  // ============================================================
  // LOGIN
  // ============================================================

  const [email, setEmail] = useState("hospital@resq.com");
  const [password, setPassword] = useState("resq123");

  // ============================================================
  // SIGNUP
  // ============================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // ============================================================
  // OTHER STATES
  // ============================================================

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // SWITCH LOGIN / SIGNUP
  // ============================================================

  function switchMode() {
    setIsSignup((current) => !current);

    setError("");
    setSuccess("");
    setShowPassword(false);
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async function handleLogin(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // --------------------------------------------------------
      // CHECK USER ROLE
      // --------------------------------------------------------

      if (
        data.user.role !== "hospital" &&
        data.user.role !== "admin"
      ) {
        throw new Error(
          "This account does not have hospital access."
        );
      }

      // --------------------------------------------------------
      // SAVE USER
      // --------------------------------------------------------

      localStorage.setItem(
        "resq_hospital_user",
        JSON.stringify(data.user)
      );

      // --------------------------------------------------------
      // GO TO DASHBOARD
      // --------------------------------------------------------

      navigate("/hospital-dashboard");

    } catch (err) {
      console.error(err);

      setError(err.message || "Login failed");

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // SIGNUP
  // ============================================================

  async function handleSignup(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!name.trim()) {
        throw new Error("Please enter your full name.");
      }

      if (phone.trim().length < 10) {
        throw new Error("Please enter a valid phone number.");
      }

      if (!signupEmail.trim()) {
        throw new Error("Please enter your email address.");
      }

      if (signupPassword.length < 6) {
        throw new Error(
          "Password must contain at least 6 characters."
        );
      }

      // --------------------------------------------------------
      // CREATE HOSPITAL ACCOUNT
      // IMPORTANT:
      // Use /hospital/signup, NOT /signup.
      //
      // /signup        -> patient account
      // /hospital/signup -> hospital account
      // --------------------------------------------------------

      const signupResponse = await fetch(
        `${API_URL}/hospital/signup`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: name.trim(),
            email: signupEmail.trim().toLowerCase(),
            password: signupPassword,
            phone: phone.trim(),
            designation: "Hospital Administrator",
          }),
        }
      );

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        throw new Error(
          signupData.error || "Account creation failed"
        );
      }

      // --------------------------------------------------------
      // AUTOMATIC LOGIN
      // --------------------------------------------------------

      const loginResponse = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            email: signupEmail.trim().toLowerCase(),
            password: signupPassword,
          }),
        }
      );

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(
          loginData.error ||
            "Account created but automatic login failed."
        );
      }

      // --------------------------------------------------------
      // VERIFY HOSPITAL ROLE
      // --------------------------------------------------------

      if (
        loginData.user.role !== "hospital" &&
        loginData.user.role !== "admin"
      ) {
        throw new Error(
          "Account was created but hospital access was not assigned."
        );
      }

      // --------------------------------------------------------
      // SAVE USER
      // --------------------------------------------------------

      localStorage.setItem(
        "resq_hospital_user",
        JSON.stringify(loginData.user)
      );

      // --------------------------------------------------------
      // SUCCESS MESSAGE
      // --------------------------------------------------------

      setSuccess(
        "Account created successfully! Opening hospital dashboard..."
      );

      // --------------------------------------------------------
      // CLEAR FORM
      // --------------------------------------------------------

      setName("");
      setPhone("");
      setSignupEmail("");
      setSignupPassword("");

      // --------------------------------------------------------
      // GO TO DASHBOARD
      // --------------------------------------------------------

      setTimeout(() => {
        navigate("/hospital-dashboard");
      }, 800);

    } catch (err) {
      console.error(err);

      setError(
        err.message || "Account creation failed"
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="hospital-auth-page">

      {/* ======================================================
          LEFT BRAND SECTION
      ======================================================= */}

      <div className="hospital-auth-brand">

        <div className="hospital-brand-content">

          <div className="hospital-brand-logo">
            <Activity size={30} />

            <span>
              RESQ
            </span>
          </div>

          <div className="hospital-brand-heading">

            <span className="hospital-brand-badge">
              <ShieldCheck size={15} />

              Emergency Response Platform
            </span>

            <h1>
              Faster response.
              <br />
              Better care.
            </h1>

            <p>
              Manage emergency requests, hospital
              resources, and critical patient
              information from one secure dashboard.
            </p>

          </div>

          <div className="hospital-feature-list">

            <div>
              <CheckCircle size={19} />

              <span>
                Real-time emergency requests
              </span>
            </div>

            <div>
              <CheckCircle size={19} />

              <span>
                Live hospital resource availability
              </span>
            </div>

            <div>
              <CheckCircle size={19} />

              <span>
                Secure hospital access
              </span>
            </div>

            <div>
              <CheckCircle size={19} />

              <span>
                Patient-ready hospital information
              </span>
            </div>

          </div>

        </div>

        <div className="hospital-brand-footer">
          RESQ Emergency Management System
        </div>

      </div>

      {/* ======================================================
          RIGHT FORM
      ======================================================= */}

      <div className="hospital-auth-form-area">

        <div className="hospital-auth-card">

          {/* MOBILE LOGO */}

          <div className="hospital-mobile-logo">

            <Activity size={25} />

            <span>
              RESQ
            </span>

          </div>

          {/* HEADER */}

          <div className="hospital-auth-heading">

            <span className="hospital-auth-label">
              HOSPITAL PORTAL
            </span>

            <h2>
              {isSignup
                ? "Create your account"
                : "Welcome back"}
            </h2>

            <p>
              {isSignup
                ? "Create your hospital staff account."
                : "Sign in to manage your hospital and emergency resources."}
            </p>

          </div>

          {/* ERROR */}

          {error && (

            <div className="hospital-auth-message error">

              <TriangleAlert size={18} />

              <span>
                {error}
              </span>

            </div>

          )}

          {/* SUCCESS */}

          {success && (

            <div className="hospital-auth-message success">

              <CheckCircle size={18} />

              <span>
                {success}
              </span>

            </div>

          )}

          {/* ==================================================
              LOGIN
          =================================================== */}

          {!isSignup && (

            <form onSubmit={handleLogin}>

              {/* EMAIL */}

              <div className="hospital-form-group">

                <label htmlFor="login-email">
                  Email address
                </label>

                <div className="hospital-input">

                  <Mail size={18} />

                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="hospital@example.com"
                    autoComplete="email"
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="hospital-form-group">

                <label htmlFor="login-password">
                  Password
                </label>

                <div className="hospital-input">

                  <Lock size={18} />

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="hospital-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>

              {/* LOGIN BUTTON */}

              <button
                className="hospital-primary-button"
                type="submit"
                disabled={loading}
              >

                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>

          )}

          {/* ==================================================
              SIGNUP
          =================================================== */}

          {isSignup && (

            <form onSubmit={handleSignup}>

              <div className="hospital-section-title">

                <User size={18} />

                <span>
                  Hospital staff account
                </span>

              </div>

              {/* NAME */}

              <div className="hospital-form-group">

                <label htmlFor="signup-name">
                  Full name
                </label>

                <div className="hospital-input">

                  <User size={18} />

                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />

                </div>

              </div>

              {/* PHONE */}

              <div className="hospital-form-group">

                <label htmlFor="signup-phone">
                  Phone
                </label>

                <div className="hospital-input">

                  <Phone size={18} />

                  <input
                    id="signup-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="Phone number"
                    autoComplete="tel"
                    required
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div className="hospital-form-group">

                <label htmlFor="signup-email">
                  Email address
                </label>

                <div className="hospital-input">

                  <Mail size={18} />

                  <input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(event) =>
                      setSignupEmail(event.target.value)
                    }
                    placeholder="hospital@example.com"
                    autoComplete="email"
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="hospital-form-group">

                <label htmlFor="signup-password">
                  Password
                </label>

                <div className="hospital-input">

                  <Lock size={18} />

                  <input
                    id="signup-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={signupPassword}
                    onChange={(event) =>
                      setSignupPassword(event.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    className="hospital-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>

              {/* INFORMATION */}

              <div className="hospital-auth-message success">

                <Activity size={18} />

                <span>
                  This creates a hospital staff
                  account. The account must be linked
                  to a hospital before hospital
                  resources can be managed.
                </span>

              </div>

              {/* SUBMIT */}

              <button
                className="hospital-primary-button"
                type="submit"
                disabled={loading}
              >

                {loading ? (
                  "Creating account..."
                ) : (
                  <>
                    Create account
                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>

          )}

          {/* ==================================================
              SWITCH LOGIN / SIGNUP
          =================================================== */}

          <div className="hospital-auth-switch">

            <span>
              {isSignup
                ? "Already have an account?"
                : "Need a hospital account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isSignup
                ? "Sign in"
                : "Create account"}
            </button>

          </div>

          {/* BACK */}

          <button
            className="hospital-back-button"
            type="button"
            onClick={() => navigate("/")}
          >
            ← Back to RESQ
          </button>

          {/* SECURITY */}

          <div className="hospital-security-note">

            <ShieldCheck size={15} />

            <span>
              Secure hospital portal
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default HospitalLogin;