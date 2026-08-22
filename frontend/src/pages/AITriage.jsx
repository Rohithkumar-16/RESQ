import { useState } from "react";
import {
    ArrowLeft,
    Camera,
    Upload,
    Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../AITriage.css";

function AITriage() {
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const [sendingSOS, setSendingSOS] = useState(false);
    const [sosSent, setSosSent] = useState(null);

    // ============================================================
    // SELECT IMAGE
    // ============================================================

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setResult(null);
        setError("");
        setSosSent(null);
    };

    // ============================================================
    // AI ANALYSIS
    // ============================================================

    const analyzeImage = async () => {
        if (!selectedFile) {
            setError("Please select an image first.");
            return;
        }

        setLoading(true);
        setError("");
        setResult(null);
        setSosSent(null);

        try {
            const formData = new FormData();

            formData.append("photo", selectedFile);

            const response = await fetch(
                "http://localhost:5678/webhook/resq-ai-triage",
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (!response.ok) {
                throw new Error(
                    `RESQ AI request failed (${response.status})`
                );
            }

            const data = await response.json();

            console.log("AI TRIAGE RESULT:", data);

            setResult(data);

        } catch (err) {
            console.error("AI triage error:", err);

            setError(
                "Unable to connect to RESQ AI. Make sure n8n is running."
            );

        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // SEND AI RESULT TO RESQ BACKEND
    // ============================================================

    const sendToHospital = async () => {
        if (!result?.hospital) {
            setError("No recommended hospital available.");
            return;
        }

        try {
            setSendingSOS(true);
            setError("");
            setSosSent(null);

            // ============================================
            // GET LOGGED-IN PATIENT
            // ============================================

            const storedPatient = localStorage.getItem(
                "resq_patient_user"
            );

            if (!storedPatient) {
                setError(
                    "Please login as a patient before sending the request."
                );

                navigate("/patient-login");
                return;
            }

            const patient = JSON.parse(storedPatient);
            let patientData = patient;

            const meResponse = await fetch(
                "http://localhost:5001/api/me",
                {
                    method: "GET",
                    credentials: "include",
                }
            );

            if (meResponse.ok) {
                const meData = await meResponse.json();

                console.log(
                    "CURRENT PATIENT FROM BACKEND:",
                    meData
                );

                if (meData.user) {
                    patientData = {
                        ...patient,
                        ...meData.user,
                    };
                } else {
                    patientData = {
                        ...patient,
                        ...meData,
                    };
                }
            }

            // ============================================
            // HOSPITAL
            // ============================================

            // For now use the hospital ID returned by RESQ AI.
            //
            // Your n8n result currently gives:
            // hospital.name
            // hospital.distance_km
            // hospital.emergency
            // hospital.trauma
            //
            // Since the AI hospital name may not exactly match
            // your backend hospital name, use the backend ID
            // that we know exists.

            const hospitalId = 3;

            // ============================================
            // BUILD AI REPORT
            // ============================================

            const observations =
                result.triage?.observations || [];

            const concerns =
                result.triage?.immediate_concerns || [];

            const severity =
                result.triage?.visible_severity ||
                "Unknown";

            const confidence =
                result.triage?.confidence != null
                    ? `${Math.round(
                        result.triage.confidence * 100
                    )}%`
                    : "Unknown";

            const hospitalName =
                result.hospital?.name ||
                "Recommended Hospital";

            const distance =
                result.hospital?.distance_km != null
                    ? `${result.hospital.distance_km} km`
                    : "Unknown";

            const emergency =
                result.hospital?.emergency
                    ? "Yes"
                    : "No";

            const trauma =
                result.hospital?.trauma
                    ? "Yes"
                    : "No";

            const aiNotes = `
RESQ AI TRIAGE REPORT

Severity:
${severity}

Confidence:
${confidence}

Observations:
${observations.length
                    ? observations.map(
                        (item) => `- ${item}`
                    ).join("\n")
                    : "- None provided"
                }

Immediate Concerns:
${concerns.length
                    ? concerns.map(
                        (item) => `- ${item}`
                    ).join("\n")
                    : "- None provided"
                }

AI Recommended Hospital:
${hospitalName}

Distance:
${distance}

Emergency Care:
${emergency}

Trauma Capability:
${trauma}
        `.trim();

            // ============================================
            // BUILD BACKEND SOS REQUEST
            // ============================================

            // =====================================================
            // GET PHONE FROM BACKEND PATIENT
            // =====================================================

           const phone = patient?.phone || "";

            console.log("PATIENT PHONE FROM BACKEND:", phone);

            // =====================================================
            // BUILD SOS PAYLOAD
            // =====================================================

            const sosPayload = {
                hospital_id: Number(hospitalId),

                emergency_type:
                    result?.triage?.visible_severity || "Emergency",

                patient_name:
                    patient?.name ||
                    patient?.name ||
                    "Patient",

                phone: String(phone).trim(),

                age:
                    patient?.age ??
                    patient?.age ??
                    null,

                ai_notes: aiNotes,

                latitude:
                    location?.latitude ??
                    null,

                longitude:
                    location?.longitude ??
                    null,
            };

            console.log("Sending SOS to backend:", sosPayload);

            console.log(
                "Sending SOS to backend:",
                sosPayload
            );

            // ============================================
            // SEND TO FLASK
            // ============================================

            const response = await fetch(
                "http://localhost:5001/api/sos",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    credentials: "include",

                    body:
                        JSON.stringify(
                            sosPayload
                        ),
                }
            );

            const data =
                await response.json();

            console.log(
                "SOS BACKEND RESPONSE:",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    "Unable to send SOS request."
                );
            }

            // ============================================
            // SUCCESS
            // ============================================

            setSosSent(data);

            console.log(
                "SOS successfully created:",
                data
            );

        } catch (error) {

            console.error(
                "SOS error:",
                error
            );

            setError(
                error.message ||
                "Unable to send emergency request."
            );

        } finally {

            setSendingSOS(false);
        }
    };

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div className="resq-ai-page">

            {/* =====================================================
                HEADER
            ====================================================== */}

            <header className="resq-ai-header">

                <button
                    className="resq-ai-back"
                    onClick={() =>
                        navigate("/")
                    }
                >
                    <ArrowLeft size={18} />
                    Back to RESQ
                </button>

                <div className="resq-ai-title">

                    <Sparkles size={22} />

                    <span>
                        RESQ AI
                    </span>

                </div>

            </header>


            {/* =====================================================
                MAIN
            ====================================================== */}

            <main className="resq-ai-main">

                {/* =================================================
                    HERO
                ================================================== */}

                <section className="resq-ai-hero">

                    <span className="resq-ai-eyebrow">
                        EMERGENCY INTELLIGENCE
                    </span>

                    <h1>
                        AI-assisted
                        <br />
                        <span>
                            emergency triage.
                        </span>
                    </h1>

                    <p>
                        Upload an image of an
                        injury or emergency
                        scene. RESQ AI will
                        analyze visible findings
                        and help identify an
                        appropriate hospital.
                    </p>

                </section>


                {/* =================================================
                    UPLOAD CARD
                ================================================== */}

                <section className="resq-ai-card">

                    <div className="resq-ai-upload">

                        {preview ? (

                            <img
                                src={preview}
                                alt="Selected emergency"
                                className="resq-ai-preview"
                            />

                        ) : (

                            <div className="resq-ai-upload-placeholder">

                                <Camera size={42} />

                                <h3>
                                    Upload an
                                    emergency image
                                </h3>

                                <p>
                                    Choose a photo
                                    showing the
                                    visible injury
                                    or emergency
                                    situation.
                                </p>

                            </div>

                        )}

                        <label className="resq-ai-upload-button">

                            <Upload size={18} />

                            Choose Photo

                            <input
                                type="file"
                                accept="image/*"
                                onChange={
                                    handleFileChange
                                }
                                hidden
                            />

                        </label>

                    </div>


                    {/* ANALYZE */}

                    <button
                        className="resq-ai-analyze-button"
                        onClick={analyzeImage}
                        disabled={
                            !selectedFile ||
                            loading
                        }
                    >

                        <Sparkles size={19} />

                        {loading
                            ? "Analyzing..."
                            : "Analyze with RESQ AI"
                        }

                    </button>


                    {/* ERROR */}

                    {error && (

                        <div className="resq-ai-error">
                            {error}
                        </div>

                    )}

                </section>


                {/* =================================================
                    RESULTS
                ================================================== */}

                {result && (

                    <section className="resq-ai-results">

                        {/* RESULT HEADER */}

                        <div className="resq-ai-result-header">

                            <span>
                                AI TRIAGE RESULT
                            </span>

                            <strong>
                                {
                                    result.triage
                                        ?.visible_severity ||
                                    "Unknown"
                                }
                            </strong>

                        </div>


                        {/* RESULT GRID */}

                        <div className="resq-ai-result-grid">

                            {/* OBSERVATIONS */}

                            <div className="resq-ai-result-card">

                                <span>
                                    OBSERVATIONS
                                </span>

                                <ul>

                                    {result.triage
                                        ?.observations
                                        ?.map(
                                            (
                                                observation,
                                                index
                                            ) => (

                                                <li
                                                    key={
                                                        index
                                                    }
                                                >
                                                    {
                                                        observation
                                                    }
                                                </li>

                                            )
                                        )}

                                </ul>

                            </div>


                            {/* CONCERNS */}

                            <div className="resq-ai-result-card">

                                <span>
                                    IMMEDIATE
                                    CONCERNS
                                </span>

                                <ul>

                                    {result.triage
                                        ?.immediate_concerns
                                        ?.map(
                                            (
                                                concern,
                                                index
                                            ) => (

                                                <li
                                                    key={
                                                        index
                                                    }
                                                >
                                                    {
                                                        concern
                                                    }
                                                </li>

                                            )
                                        )}

                                </ul>

                            </div>

                        </div>


                        {/* =================================================
                            HOSPITAL
                        ================================================== */}

                        <div className="resq-ai-hospital">

                            <div>

                                <span>
                                    RECOMMENDED
                                    HOSPITAL
                                </span>

                                <h2>
                                    {
                                        result
                                            .hospital
                                            ?.name ||
                                        "No suitable hospital available"
                                    }
                                </h2>

                                {result.hospital && (

                                    <p>

                                        {
                                            result.hospital
                                                .distance_km
                                        }{" "}
                                        km away

                                        {" · "}

                                        {
                                            result.hospital
                                                .emergency
                                                ? "Emergency care"
                                                : "No emergency service"
                                        }

                                        {" · "}

                                        {
                                            result.hospital
                                                .trauma
                                                ? "Trauma capable"
                                                : "No trauma capability"
                                        }

                                    </p>

                                )}

                            </div>


                            {/* CONFIDENCE */}

                            <div className="resq-ai-confidence">

                                <span>
                                    CONFIDENCE
                                </span>

                                <strong>

                                    {result.triage
                                        ?.confidence != null

                                        ? `${Math.round(
                                            result
                                                .triage
                                                .confidence *
                                            100
                                        )}%`

                                        : "—"}

                                </strong>

                            </div>

                        </div>


                        {/* =================================================
                            SEND TO HOSPITAL
                        ================================================== */}

                        <button
                            className="resq-ai-send-button"
                            onClick={
                                sendToHospital
                            }
                            disabled={
                                sendingSOS ||
                                sosSent
                            }
                        >

                            {sendingSOS
                                ? "Sending to hospital..."

                                : sosSent
                                    ? "Request Sent ✓"

                                    : "Send Emergency Request to Hospital"
                            }

                        </button>


                        {/* =================================================
                            SOS SUCCESS
                        ================================================== */}

                        {sosSent && (

                            <div className="resq-ai-sos-success">

                                <strong>
                                    Emergency request
                                    sent successfully.
                                </strong>

                                <p>
                                    Request ID: #
                                    {
                                        sosSent.sos_id
                                    }
                                </p>

                                <p>
                                    The emergency
                                    request has been
                                    sent to the RESQ
                                    backend.
                                </p>

                                <button
                                    onClick={() =>
                                        navigate(
                                            `/request/${sosSent.sos_id}`
                                        )
                                    }
                                >
                                    Track Emergency Request
                                </button>

                            </div>

                        )}

                    </section>

                )}

            </main>

        </div>
    );
}

export default AITriage;