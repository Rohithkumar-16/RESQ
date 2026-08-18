import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  TriangleAlert,
  XCircle,
} from "lucide-react";

const API_URL = "http://localhost:5001/api";

// For the hackathon prototype we use hospital ID 2.
// Later this should come from the hospital user's login.


function HospitalDashboard() {
  const [requests, setRequests] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setError("");

      const userResponse = await fetch(`${API_URL}/me`, {
        credentials: "include",
      });

      if (!userResponse.ok) {
        const data = await userResponse.json();
        throw new Error(data.error || "Login required");
      }

      const userData = await userResponse.json();

      if (
        userData.role !== "hospital" &&
        userData.role !== "admin"
      ) {
        throw new Error("Hospital access required");
      }

      if (!userData.hospital_id) {
        throw new Error("No hospital is linked to this account");
      }

      setUser(userData);

      const hospitalId = userData.hospital_id;

      const [hospitalResponse, sosResponse] = await Promise.all([
        fetch(`${API_URL}/hospitals/${hospitalId}`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/hospital/${hospitalId}/sos`, {
          credentials: "include",
        }),
      ]);

      if (!hospitalResponse.ok) {
        throw new Error("Unable to load hospital");
      }

      if (!sosResponse.ok) {
        const data = await sosResponse.json();

        throw new Error(
          data.error || "Unable to load emergency requests"
        );
      }

      const hospitalData = await hospitalResponse.json();
      const sosData = await sosResponse.json();

      setHospital(hospitalData);
      setRequests(sosData);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    // Refresh requests every 5 seconds.
    const interval = setInterval(loadDashboard, 5000);

    return () => clearInterval(interval);
  }, []);

async function updateRequest(sosId, action) {
  try {
    setUpdatingId(sosId);
    setError("");

    const response = await fetch(
      `${API_URL}/sos/${sosId}/${action}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to update request");
    }

    await loadDashboard();
  } catch (err) {
    console.error(err);
    setError(err.message);
  } finally {
    setUpdatingId(null);
  }
}

  function formatDate(dateString) {
    if (!dateString) return "Unknown";

    return new Date(dateString).toLocaleString();
  }

  function getStatusClass(status) {
    switch (status) {
      case "accepted":
        return "dashboard-status accepted";

      case "rejected":
        return "dashboard-status rejected";

      case "in progress":
        return "dashboard-status progress";

      case "resolved":
        return "dashboard-status resolved";

      default:
        return "dashboard-status pending";
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <Activity size={28} />
          <p>Loading hospital dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div>
            <div className="dashboard-logo">RESQ</div>

            <p className="dashboard-subtitle">
              Hospital Emergency Dashboard
            </p>
          </div>

          <button
            className="dashboard-refresh"
            onClick={loadDashboard}
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {hospital && (
          <section className="dashboard-hospital-card">
            <div>
              <p className="dashboard-label">HOSPITAL</p>

              <h1>{hospital.name}</h1>

              <div className="dashboard-hospital-meta">
                <span>
                  <MapPin size={15} />
                  {hospital.address}, {hospital.city}
                </span>

                <span>
                  <Phone size={15} />
                  {hospital.phone}
                </span>
              </div>
            </div>

            <div className="dashboard-live">
              <span className="dashboard-live-dot" />
              Live
            </div>
          </section>
        )}

        <section className="dashboard-summary">
          <div className="dashboard-summary-card">
            <Clock size={22} />

            <div>
              <strong>
                {
                  requests.filter(
                    (request) => request.status === "pending"
                  ).length
                }
              </strong>

              <span>Pending</span>
            </div>
          </div>

          <div className="dashboard-summary-card">
            <CheckCircle size={22} />

            <div>
              <strong>
                {
                  requests.filter(
                    (request) => request.status === "accepted"
                  ).length
                }
              </strong>

              <span>Accepted</span>
            </div>
          </div>

          <div className="dashboard-summary-card">
            <XCircle size={22} />

            <div>
              <strong>
                {
                  requests.filter(
                    (request) => request.status === "rejected"
                  ).length
                }
              </strong>

              <span>Rejected</span>
            </div>
          </div>
        </section>

        {error && (
          <div className="dashboard-error">
            <TriangleAlert size={18} />
            {error}
          </div>
        )}

        <section className="dashboard-requests">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-label">EMERGENCY CENTER</p>

              <h2>Incoming requests</h2>
            </div>

            <span className="dashboard-request-count">
              {requests.length} total
            </span>
          </div>

          {requests.length === 0 ? (
            <div className="dashboard-empty">
              <CheckCircle size={36} />

              <h3>No emergency requests</h3>

              <p>
                New SOS requests will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="dashboard-request-list">
              {requests.map((request) => (
                <article
                  className="dashboard-request-card"
                  key={request.sos_id}
                >
                  <div className="dashboard-request-top">
                    <div>
                      <span className="dashboard-sos-id">
                        SOS #{request.sos_id}
                      </span>

                      <h3>{request.patient_name}</h3>
                    </div>

                    <span className={getStatusClass(request.status)}>
                      {request.status}
                    </span>
                  </div>

                  <div className="dashboard-request-info">
                    <div>
                      <span>Emergency</span>
                      <strong>{request.emergency_type}</strong>
                    </div>

                    <div>
                      <span>Phone</span>
                      <strong>{request.phone}</strong>
                    </div>

                    {request.age && (
                      <div>
                        <span>Age</span>
                        <strong>{request.age}</strong>
                      </div>
                    )}

                    {request.gender && (
                      <div>
                        <span>Gender</span>
                        <strong>{request.gender}</strong>
                      </div>
                    )}

                    <div>
                      <span>Received</span>
                      <strong>
                        {formatDate(request.created_at)}
                      </strong>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="dashboard-notes">
                      <span>Additional information</span>
                      <p>{request.notes}</p>
                    </div>
                  )}

                  {request.status === "pending" && (
                    <div className="dashboard-actions">
                      <button
                        className="dashboard-accept"
                        disabled={updatingId === request.sos_id}
                        onClick={() =>
                          updateRequest(request.sos_id, "accept")
                        }
                      >
                        <CheckCircle size={17} />

                        {updatingId === request.sos_id
                          ? "Updating..."
                          : "Accept Request"}
                      </button>

                      <button
                        className="dashboard-reject"
                        disabled={updatingId === request.sos_id}
                        onClick={() =>
                          updateRequest(request.sos_id, "reject")
                        }
                      >
                        <XCircle size={17} />
                        Reject
                      </button>
                    </div>
                  )}

                  {request.status === "accepted" && (
                    <div className="dashboard-accepted-message">
                      <CheckCircle size={18} />
                      Emergency request accepted.
                    </div>
                  )}

                  {request.status === "rejected" && (
                    <div className="dashboard-rejected-message">
                      <XCircle size={18} />
                      Emergency request rejected.
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default HospitalDashboard;
