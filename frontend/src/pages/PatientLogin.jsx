import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Activity,
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    Mail,
    ShieldCheck,
    TriangleAlert,
} from "lucide-react";
import "../App.css";

const API_URL = "http://localhost:5001/api";

function PatientLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleLogin(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        if (!password) {
            setError("Please enter your password.");
            return;
        }

        try {
            setLoading(true);

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
                throw new Error(
                    data.error || "Invalid email or password."
                );
            }

            if (!data.user) {
                throw new Error(
                    "Login succeeded but user information was not received."
                );
            }

            if (data.user.role !== "patient") {
                await fetch(`${API_URL}/logout`, {
                    method: "POST",
                    credentials: "include",
                });

                throw new Error(
                    "This is not a patient account. Please use Hospital Login."
                );
            }

            localStorage.setItem(
                "resq_patient_user",
                JSON.stringify(data.user)
            );

            setSuccess("Login successful. Redirecting...");

            setTimeout(() => {
                navigate("/patient-dashboard");
            }, 500);

        } catch (error) {
            console.error("Patient login:", error);
            setError(
                error.message || "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="hospital-auth-page">

            {/* LEFT SIDE */}

            <div className="hospital-auth-brand">

                <div className="hospital-brand-content">

                    <div
                        className="hospital-brand-logo"
                        onClick={() => navigate("/")}
                        style={{ cursor: "pointer" }}
                    >
                        <Activity size={27} />
                        <span>RESQ</span>
                    </div>

                    <div className="hospital-brand-heading">

                        <div className="hospital-brand-badge">
                            <Activity size={14} />
                            <span>Patient Emergency Care</span>
                        </div>

                        <h1>
                            Get the care you need,
                            <br />
                            when it matters.
                        </h1>

                        <p>
                            Find nearby hospitals, check critical
                            medical resources and request emergency
                            assistance through RESQ.
                        </p>

                    </div>

                    <div className="hospital-feature-list">

                        <div>
                            <span>✓</span>
                            <span>Find hospitals near you</span>
                        </div>

                        <div>
                            <span>✓</span>
                            <span>Check ICU, blood and oxygen availability</span>
                        </div>

                        <div>
                            <span>✓</span>
                            <span>Request emergency assistance</span>
                        </div>

                    </div>

                </div>

                <div className="hospital-brand-footer">
                    RESQ — Smart emergency healthcare management
                </div>

            </div>

            {/* RIGHT SIDE */}

            <div className="hospital-auth-form-area">

                <div className="hospital-auth-card">

                    <div className="hospital-mobile-logo">
                        <Activity size={24} />
                        <span>RESQ</span>
                    </div>

                    <div className="hospital-auth-heading">

                        <span className="hospital-auth-label">
                            PATIENT PORTAL
                        </span>

                        <h2>Welcome back</h2>

                        <p>
                            Sign in to access your RESQ patient account.
                        </p>

                    </div>

                    {error && (
                        <div className="hospital-auth-message error">
                            <TriangleAlert size={17} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="hospital-auth-message success">
                            <span>✓</span>
                            <span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin}>

                        {/* EMAIL */}

                        <div className="hospital-form-group">

                            <label htmlFor="patient-email">
                                Email Address
                            </label>

                            <div className="hospital-input">

                                <Mail size={18} />

                                <input
                                    id="patient-email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    autoComplete="email"
                                    disabled={loading}
                                />

                            </div>

                        </div>

                        {/* PASSWORD */}

                        <div className="hospital-form-group">

                            <label htmlFor="patient-password">
                                Password
                            </label>

                            <div className="hospital-input">

                                <Lock size={18} />

                                <input
                                    id="patient-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    autoComplete="current-password"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="hospital-password-toggle"
                                    onClick={() =>
                                        setShowPassword((value) => !value)
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={17} />
                                    ) : (
                                        <Eye size={17} />
                                    )}
                                </button>

                            </div>

                        </div>

                        {/* LOGIN */}

                        <button
                            type="submit"
                            className="hospital-primary-button"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <Activity size={17} />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in as Patient
                                    <ArrowRight size={17} />
                                </>
                            )}

                        </button>

                    </form>

                    {/* REGISTER */}

                    <div className="hospital-auth-switch">

                        <span>
                            Don't have a patient account?
                        </span>

                        <button
                            type="button"
                            onClick={() => navigate("/patient-signup")}
                        >
                            Create account
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

                    <div className="hospital-security-note">
                        <ShieldCheck size={15} />
                        <span>Secure patient portal</span>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default PatientLogin;