import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Send,
  TriangleAlert,
} from "lucide-react";

const API_URL = "http://localhost:5001/api";

function RequestStatus() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [hospital, setHospital] = useState(null);
  const [sosId, setSosId] = useState(null);
  const [status, setStatus] = useState(null);

  const [form, setForm] = useState({
    patient_name: "",
    phone: "",
    age: "",
    gender: "",
    emergency_type: "",
    notes: "",
  });

  const [loadingHospital, setLoadingHospital] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /*
   * If a request has already been created, check its status.
   */
  useEffect(() => {
    if (!sosId) return;

    async function fetchStatus() {
      try {
        const response = await fetch(`${API_URL}/sos/${sosId}`);

        if (!response.ok) {
          throw new Error("Unable to get request status");
        }

        const data = await response.json();

        setStatus(data);
      } catch (err) {
        console.error("Status error:", err);
      }
    }

    fetchStatus();

    /*
     * Refresh the request status every 5 seconds.
     */
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [sosId]);

  /*
   * Load the selected hospital.
   */
  useEffect(() => {
    async function fetchHospital() {
      try {
        setLoadingHospital(true);

        const response = await fetch(`${API_URL}/hospitals/${id}`);

        if (!response.ok) {
          throw new Error("Hospital not found");
        }

        const data = await response.json();

        setHospital(data);
      } catch (err) {
        console.error("Hospital error:", err);
        setError("Unable to load hospital information.");
      } finally {
        setLoadingHospital(false);
      }
    }

    fetchHospital();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.patient_name.trim()) {
      setError("Please enter the patient's name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter a phone number.");
      return;
    }

    if (!form.emergency_type) {
      setError("Please select the emergency type.");
      return;
    }

    try {
      setSending(true);

      const response = await fetch(`${API_URL}/sos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hospital_id: Number(id),
          patient_name: form.patient_name,
          phone: form.phone,
          age: form.age ? Number(form.age) : null,
          gender: form.gender || null,
          emergency_type: form.emergency_type,
          notes: form.notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send emergency request.");
      }

      setSosId(data.sos_id);

      setStatus({
        sos_id: data.sos_id,
        hospital_id: Number(id),
        patient_name: form.patient_name,
        emergency_type: form.emergency_type,
        status: data.status,
      });
    } catch (err) {
      console.error("SOS error:", err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  function getStatusLabel(currentStatus) {
    switch (currentStatus) {
      case "accepted":
        return "Request Accepted";

      case "rejected":
        return "Request Rejected";

      case "in progress":
        return "Emergency Request In Progress";

      case "resolved":
        return "Request Resolved";

      default:
        return "Request Sent";
    }
  }

  function getStatusIcon(currentStatus) {
    if (currentStatus === "accepted" || currentStatus === "resolved") {
      return <CheckCircle size={30} />;
    }

    if (currentStatus === "rejected") {
      return <TriangleAlert size={30} />;
    }

    return <Clock size={30} />;
  }

  if (loadingHospital) {
    return (
      <div className="hospitals-page">
        <main className="hospitals-main">
          <div className="hospital-card">
            <p>Loading hospital information...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="hospitals-page">
        <main className="hospitals-main">
          <div className="hospital-card">
            <h2>Hospital not found</h2>

            <button
              className="view-details-button"
              onClick={() => navigate("/hospitals")}
            >
              Back to hospitals
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
   * After SOS is created, show request status.
   */
  if (sosId && status) {
    return (
      <div className="hospitals-page">
        <header className="hospitals-header">
          <div className="hospitals-header-inner">
            <button
              className="back-button"
              onClick={() => navigate(`/hospital/${hospital.id}`)}
            >
              <ArrowLeft size={20} />
            </button>

            <div className="hospitals-logo">RESQ</div>

            <div />
          </div>
        </header>

        <main className="hospitals-main">
          <section className="request-success-section">
            <div className="request-status-icon">
              {getStatusIcon(status.status)}
            </div>

            <p className="section-label">EMERGENCY REQUEST</p>

            <h1>{getStatusLabel(status.status)}</h1>

            <p>
              Your emergency request has been sent to{" "}
              <strong>{hospital.name}</strong>.
            </p>
          </section>

          <section className="request-status-card">
            <div className="request-status-row">
              <span>Request ID</span>
              <strong>#{status.sos_id}</strong>
            </div>

            <div className="request-status-row">
              <span>Hospital</span>
              <strong>{hospital.name}</strong>
            </div>

            <div className="request-status-row">
              <span>Emergency</span>
              <strong>{status.emergency_type}</strong>
            </div>

            <div className="request-status-row">
              <span>Status</span>

              <span
                className={`request-status-badge ${status.status.replace(
                  " ",
                  "-"
                )}`}
              >
                {status.status}
              </span>
            </div>
          </section>

          <section className="request-info-banner">
            <Clock size={20} />

            <div>
              <strong>Waiting for hospital response</strong>

              <p>
                RESQ will automatically check for status updates.
              </p>
            </div>
          </section>

          <button
            className="request-call-button"
            onClick={() => {
              window.location.href = `tel:${hospital.phone}`;
            }}
          >
            <Phone size={18} />
            Call Hospital
          </button>
        </main>
      </div>
    );
  }

  /*
   * Emergency request form.
   */
  return (
    <div className="hospitals-page">
      <header className="hospitals-header">
        <div className="hospitals-header-inner">
          <button
            className="back-button"
            onClick={() => navigate(`/hospital/${hospital.id}`)}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="hospitals-logo">RESQ</div>

          <div />
        </div>
      </header>

      <main className="hospitals-main">
        <section className="request-intro">
          <p className="section-label">EMERGENCY REQUEST</p>

          <h1>Request emergency help</h1>

          <p>
            Send an emergency request to{" "}
            <strong>{hospital.name}</strong>.
          </p>
        </section>

        <form
          className="emergency-form"
          onSubmit={handleSubmit}
        >
          <div className="form-section">
            <h2>Patient information</h2>

            <div className="form-grid">
              <div className="form-field full-width">
                <label htmlFor="patient_name">
                  Patient name *
                </label>

                <input
                  id="patient_name"
                  name="patient_name"
                  type="text"
                  placeholder="Enter patient's name"
                  value={form.patient_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">
                  Phone number *
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="age">
                  Age
                </label>

                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  placeholder="Age"
                  value={form.age}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="gender">
                  Gender
                </label>

                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Emergency information</h2>

            <div className="form-field">
              <label htmlFor="emergency_type">
                Emergency type *
              </label>

              <select
                id="emergency_type"
                name="emergency_type"
                value={form.emergency_type}
                onChange={handleChange}
              >
                <option value="">
                  Select emergency type
                </option>

                <option value="Accident">
                  Accident
                </option>

                <option value="Breathing difficulty">
                  Breathing difficulty
                </option>

                <option value="Chest pain">
                  Chest pain
                </option>

                <option value="Critical condition">
                  Critical condition
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="notes">
                Additional information
              </label>

              <textarea
                id="notes"
                name="notes"
                rows="4"
                placeholder="Describe anything important about the emergency..."
                value={form.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="form-error">
              <TriangleAlert size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="request-hospital-info">
            <MapPin size={18} />

            <div>
              <strong>{hospital.name}</strong>

              <span>
                {hospital.address}, {hospital.city}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="submit-request-button"
            disabled={sending}
          >
            <Send size={18} />

            {sending
              ? "Sending request..."
              : "Send Emergency Request"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default RequestStatus;