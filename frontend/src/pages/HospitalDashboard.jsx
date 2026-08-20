import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  TriangleAlert,
  XCircle,
  MoreVertical,
  Eye,
} from "lucide-react";

const API_URL = "http://localhost:5001/api";

function HospitalDashboard() {
  const [requests, setRequests] = useState([]);
  const [hospital, setHospital] = useState(null);
  const [user, setUser] = useState(null);
  const [availability, setAvailability] = useState([]);

  const [hasHospital, setHasHospital] = useState(false);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingResources, setUpdatingResources] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [openMenu, setOpenMenu] = useState(null);
  const [selectedSOS, setSelectedSOS] = useState(null);

  // ============================================================
  // RESOURCE UNITS
  // ============================================================

  function getResourceUnit(resourceName) {
    switch (resourceName) {
      case "ICU":
        return "beds";

      case "Blood":
        return "units";

      case "Oxygen":
        return "cylinders";

      case "Emergency Service":
        return "services";

      case "Ambulance":
        return "vehicles";

      default:
        return "units";
    }
  }

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // --------------------------------------------------------
      // GET HOSPITAL DASHBOARD DATA
      // --------------------------------------------------------

      const dashboardResponse = await fetch(`${API_URL}/hospital/dashboard`, {
        credentials: "include",
      });

      const dashboardData = await dashboardResponse.json();

      if (!dashboardResponse.ok) {
        throw new Error(
          dashboardData.error || "Unable to load hospital dashboard.",
        );
      }

      // --------------------------------------------------------
      // SAVE USER
      // --------------------------------------------------------

      setUser(dashboardData.user || null);

      // --------------------------------------------------------
      // CHECK WHETHER HOSPITAL EXISTS
      // --------------------------------------------------------

      if (!dashboardData.has_hospital) {
        setHasHospital(false);
        setHospital(null);
        setAvailability([]);
        setRequests([]);
        return;
      }

      // --------------------------------------------------------
      // HOSPITAL EXISTS
      // --------------------------------------------------------

      setHasHospital(true);

      setHospital(dashboardData.hospital || null);

      const hospitalId = dashboardData.user?.hospital_id;

      if (!hospitalId) {
        throw new Error("Hospital information is missing from the account.");
      }

      // --------------------------------------------------------
      // LOAD SOS + RESOURCES
      // --------------------------------------------------------

      const [sosResponse, availabilityResponse] = await Promise.all([
        fetch(`${API_URL}/hospital/${hospitalId}/sos`, {
          credentials: "include",
        }),

        fetch(`${API_URL}/hospital/${hospitalId}/availability`, {
          credentials: "include",
        }),
      ]);

      const sosData = await sosResponse.json();

      const availabilityData = await availabilityResponse.json();

      // --------------------------------------------------------
      // CHECK SOS RESPONSE
      // --------------------------------------------------------

      if (!sosResponse.ok) {
        throw new Error(sosData.error || "Unable to load emergency requests.");
      }

      // --------------------------------------------------------
      // CHECK AVAILABILITY RESPONSE
      // --------------------------------------------------------

      if (!availabilityResponse.ok) {
        throw new Error(
          availabilityData.error || "Unable to load hospital resources.",
        );
      }

      // --------------------------------------------------------
      // SAVE DATA
      // --------------------------------------------------------

      setRequests(Array.isArray(sosData) ? sosData : []);

      setAvailability(Array.isArray(availabilityData) ? availabilityData : []);
    } catch (err) {
      console.error("Dashboard error:", err);

      // --------------------------------------------------------
      // LOGIN REQUIRED
      // --------------------------------------------------------

      if (err.message === "Login required") {
        window.location.href = "/hospital-login";

        return;
      }

      setError(err.message || "Unable to load hospital dashboard.");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

useEffect(() => {
  loadDashboard();
}, []);

useEffect(() => {
  if (!loading && user && !hasHospital) {
    window.location.href = "/add-hospital";
  }
}, [loading, user, hasHospital]);
  // ============================================================
  // RESOURCE VALIDATION
  // ============================================================

  function validateResources() {
    for (const resource of availability) {
      const total = Number(resource.total);

      const available = Number(resource.available);

      if (Number.isNaN(total) || Number.isNaN(available)) {
        throw new Error(
          `${resource.resource_name}: Please enter valid numbers.`,
        );
      }

      if (total < 0 || available < 0) {
        throw new Error(
          `${resource.resource_name}: Values cannot be negative.`,
        );
      }

      if (available > total) {
        throw new Error(
          `${resource.resource_name}: Available cannot be greater than total.`,
        );
      }
    }
  }

  // ============================================================
  // UPDATE ALL RESOURCES
  // ============================================================

  async function updateAllAvailability() {
    if (!user?.hospital_id) {
      setError("Hospital information is not available.");

      return;
    }

    try {
      setError("");
      setSuccess("");
      setUpdatingResources(true);

      validateResources();

      // Update every resource
      for (const resource of availability) {
        const response = await fetch(
          `${API_URL}/hospital/${user.hospital_id}/availability`,
          {
            method: "PUT",

            headers: {
              "Content-Type": "application/json",
            },

            credentials: "include",

            body: JSON.stringify({
              resource_type: resource.resource_type,

              resource_name: resource.resource_name,

              total_count: Number(resource.total),

              available_count: Number(resource.available),
            }),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Unable to update ${resource.resource_name}.`,
          );
        }
      }

      await loadDashboard();

      setSuccess("Hospital resources updated successfully.");
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to update resources.");
    } finally {
      setUpdatingResources(false);
    }
  }

  // ============================================================
  // CHANGE RESOURCE VALUE
  // ============================================================

  function updateResourceValue(resourceName, field, value) {
    const numericValue = value === "" ? "" : Number(value);

    setAvailability((current) =>
      current.map((resource) => {
        if (resource.resource_name !== resourceName) {
          return resource;
        }

        const updated = {
          ...resource,
          [field]: numericValue,
        };

        if (
          field === "total" &&
          numericValue !== "" &&
          Number(updated.available) > numericValue
        ) {
          updated.available = numericValue;
        }

        return updated;
      }),
    );
  }

  // ============================================================
  // UPDATE SOS STATUS
  // ============================================================

  async function updateRequest(sosId, action) {
    try {
      setUpdatingId(sosId);
      setError("");
      setSuccess("");
      setOpenMenu(null);

      const response = await fetch(`${API_URL}/sos/${sosId}/${action}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update SOS request.");
      }

      // Update local state
      setRequests((current) =>
        current.map((request) =>
          request.sos_id === sosId
            ? {
                ...request,
                status: data.status,
              }
            : request,
        ),
      );

      // Update modal
      setSelectedSOS((current) =>
        current?.sos_id === sosId
          ? {
              ...current,
              status: data.status,
            }
          : current,
      );

      setSuccess(
        action === "accept"
          ? "SOS request accepted successfully."
          : "SOS request rejected successfully.",
      );
    } catch (err) {
      console.error(err);

      setError(err.message || "Unable to update SOS request.");
    } finally {
      setUpdatingId(null);
    }
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(dateString) {
    if (!dateString) {
      return "Unknown";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleString();
  }

  // ============================================================
  // STATUS CLASS
  // ============================================================

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

  // ============================================================
  // LOGOUT
  // ============================================================

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    localStorage.removeItem("resq_hospital_user");

    window.location.href = "/";
  }

  // ============================================================
  // LOADING
  // ============================================================

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

  // ============================================================
  // MAIN
  // ============================================================

  return (
    <div className="dashboard-page">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div>
            <div className="dashboard-logo">RESQ</div>

            <p className="dashboard-subtitle">Hospital Emergency Dashboard</p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <button
              className="dashboard-refresh"
              onClick={loadDashboard}
              disabled={updatingResources}
            >
              <RefreshCw size={17} />
              Refresh
            </button>

            <button
              className="dashboard-refresh"
              onClick={handleLogout}
              disabled={updatingResources}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* ==================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="dashboard-error">
            <TriangleAlert size={18} />

            {error}
          </div>
        )}

        {/* ==================================================
            SUCCESS
        =================================================== */}

        {success && (
          <div className="dashboard-success">
            <CheckCircle size={18} />

            {success}
          </div>
        )}

        {/* ==================================================
            NO HOSPITAL REGISTERED
        =================================================== */}

        {!hasHospital && (
          <section className="dashboard-hospital-card">
            <div>
              <p className="dashboard-label">HOSPITAL ACCOUNT</p>

              <h1>Welcome, {user?.name || "Hospital Administrator"}</h1>

              <p>
                Your hospital account has been created successfully, but it is
                not linked to a hospital yet.
              </p>

              <div
                className="dashboard-hospital-meta"
                style={{
                  marginTop: "16px",
                }}
              >
                <span>
                  <CheckCircle size={15} />
                  Account created successfully
                </span>

                <span>
                  <TriangleAlert size={15} />
                  Hospital registration required
                </span>
              </div>
              {/* REGISTER HOSPITAL BUTTON */}
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/add-hospital";
                }}
                style={{
                  marginTop: "20px",
                  padding: "12px 20px",
                  background: "#159570",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "700",
                  cursor: "pointer",
                  position: "relative",
                  zIndex: 9999,
                  pointerEvents: "auto",
                }}
              >
                Register Your Hospital
              </button>
            </div>
          </section>
        )}

        {/* ==================================================
            USER INFORMATION
        =================================================== */}

        {user && !hasHospital && (
          <section className="dashboard-user-info">
            <strong>{user.name}</strong>

            <span>{user.email}</span>

            <span>Role: {user.role}</span>
          </section>
        )}

        {/* ==================================================
            NORMAL HOSPITAL DASHBOARD
        =================================================== */}

        {hasHospital && hospital && (
          <>
            {/* ==================================================
                HOSPITAL INFORMATION
            =================================================== */}

            <section className="dashboard-hospital-card">
              <div>
                <p className="dashboard-label">HOSPITAL</p>

                <h1>{hospital.name}</h1>

                <div className="dashboard-hospital-meta">
                  <span>
                    <MapPin size={15} />

                    {hospital.address}

                    {hospital.city && `, ${hospital.city}`}

                    {hospital.state && `, ${hospital.state}`}
                  </span>

                  <span>
                    <Phone size={15} />

                    {hospital.phone}
                  </span>
                </div>

                {hospital.last_updated && (
                  <small>
                    Last resource update: {formatDate(hospital.last_updated)}
                  </small>
                )}
              </div>

              <div className="dashboard-live">
                <span className="dashboard-live-dot" />
                Live
              </div>
            </section>

            {/* ==================================================
                USER INFORMATION
            =================================================== */}

            {user && (
              <section className="dashboard-user-info">
                <strong>{user.name}</strong>

                <span>{user.email}</span>

                <span>Hospital ID: {user.hospital_id}</span>

                {user.designation && <span>{user.designation}</span>}
              </section>
            )}

            {/* ==================================================
                HOSPITAL RESOURCES
            =================================================== */}

            <section className="dashboard-availability">
              <div className="dashboard-section-heading">
                <div>
                  <p className="dashboard-label">HOSPITAL RESOURCES</p>

                  <h2>Availability</h2>
                </div>

                <span className="dashboard-request-count">
                  {availability.length} resources
                </span>
              </div>

              {availability.length === 0 ? (
                <div className="dashboard-empty">
                  <TriangleAlert size={36} />

                  <h3>No resources found</h3>

                  <p>
                    No availability information has been configured for this
                    hospital.
                  </p>
                </div>
              ) : (
                <>
                  <div className="dashboard-resource-list">
                    {availability.map((resource) => {
                      const unit = getResourceUnit(resource.resource_name);

                      return (
                        <div
                          className="dashboard-resource-card"
                          key={`${resource.resource_type}-${resource.resource_name}`}
                        >
                          <div className="dashboard-resource-info">
                            <p className="dashboard-label">
                              {resource.resource_type}
                            </p>

                            <h3>{resource.resource_name}</h3>

                            <span>
                              Unit: <strong>{unit}</strong>
                            </span>

                            {resource.updated_at && (
                              <small>
                                Updated: {formatDate(resource.updated_at)}
                              </small>
                            )}
                          </div>

                          <div className="dashboard-resource-control">
                            <div>
                              <label
                                htmlFor={`total-${resource.resource_name}`}
                              >
                                Total
                              </label>

                              <input
                                id={`total-${resource.resource_name}`}
                                type="number"
                                min="0"
                                value={resource.total}
                                onChange={(event) =>
                                  updateResourceValue(
                                    resource.resource_name,
                                    "total",
                                    event.target.value,
                                  )
                                }
                              />

                              <small>{unit}</small>
                            </div>

                            <div>
                              <label
                                htmlFor={`available-${resource.resource_name}`}
                              >
                                Available
                              </label>

                              <input
                                id={`available-${resource.resource_name}`}
                                type="number"
                                min="0"
                                max={resource.total}
                                value={resource.available}
                                onChange={(event) =>
                                  updateResourceValue(
                                    resource.resource_name,
                                    "available",
                                    event.target.value,
                                  )
                                }
                              />

                              <small>{unit}</small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="dashboard-update-all-container">
                    <button
                      className="dashboard-update-all"
                      onClick={updateAllAvailability}
                      disabled={updatingResources}
                    >
                      {updatingResources
                        ? "Updating All Resources..."
                        : "Update All Resources"}
                    </button>
                  </div>
                </>
              )}
            </section>

            {/* ==================================================
                SOS SUMMARY
            =================================================== */}

            <section className="dashboard-summary">
              <div className="dashboard-summary-card">
                <Clock size={22} />

                <div>
                  <strong>
                    {
                      requests.filter((request) => request.status === "pending")
                        .length
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
                        (request) => request.status === "accepted",
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
                        (request) => request.status === "rejected",
                      ).length
                    }
                  </strong>

                  <span>Rejected</span>
                </div>
              </div>

              <div className="dashboard-summary-card">
                <Activity size={22} />

                <div>
                  <strong>{requests.length}</strong>

                  <span>Total SOS</span>
                </div>
              </div>
            </section>

            {/* ==================================================
                SOS REQUESTS
            =================================================== */}

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

                  <p>New SOS requests will appear here.</p>
                </div>
              ) : (
                <div className="dashboard-request-list">
                  {requests.map((request) => (
                    <article
                      className="dashboard-request-card"
                      key={request.sos_id}
                    >
                      {/* TOP */}

                      <div className="dashboard-request-top">
                        <div>
                          <span className="dashboard-sos-id">
                            SOS #{request.sos_id}
                          </span>

                          <h3>{request.patient_name}</h3>
                        </div>

                        <div className="dashboard-request-menu-wrapper">
                          <button
                            className="dashboard-menu-button"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === request.sos_id
                                  ? null
                                  : request.sos_id,
                              )
                            }
                            aria-label="SOS options"
                          >
                            <MoreVertical size={20} />
                          </button>

                          {openMenu === request.sos_id && (
                            <div className="dashboard-sos-menu">
                              <button
                                onClick={() => {
                                  setSelectedSOS(request);

                                  setOpenMenu(null);
                                }}
                              >
                                <Eye size={16} />
                                View Details
                              </button>

                              {request.status === "pending" && (
                                <button
                                  onClick={() =>
                                    updateRequest(request.sos_id, "accept")
                                  }
                                >
                                  <CheckCircle size={16} />
                                  Accept
                                </button>
                              )}

                              {request.status !== "rejected" && (
                                <button
                                  onClick={() =>
                                    updateRequest(request.sos_id, "reject")
                                  }
                                >
                                  <XCircle size={16} />
                                  Reject
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* STATUS */}

                      <div className="dashboard-request-status-row">
                        <span className={getStatusClass(request.status)}>
                          {request.status}
                        </span>
                      </div>

                      {/* BASIC INFORMATION */}

                      <div className="dashboard-request-info">
                        <div>
                          <span>Emergency</span>

                          <strong>{request.emergency_type}</strong>
                        </div>

                        <div>
                          <span>Phone</span>

                          <strong>{request.phone}</strong>
                        </div>

                        {request.age !== null && request.age !== undefined && (
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

                          <strong>{formatDate(request.created_at)}</strong>
                        </div>
                      </div>

                      {/* NOTES */}

                      {request.notes && (
                        <div className="dashboard-notes">
                          <span>Additional information</span>

                          <p>{request.notes}</p>
                        </div>
                      )}

                      {/* PENDING ACTIONS */}

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

                      {/* ACCEPTED */}

                      {request.status === "accepted" && (
                        <div className="dashboard-accepted-message">
                          <CheckCircle size={18} />
                          Emergency request accepted.
                        </div>
                      )}

                      {/* REJECTED */}

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
          </>
        )}
      </main>

      {/* ======================================================
          SOS DETAILS MODAL
      ======================================================= */}

      {selectedSOS && (
        <div
          className="dashboard-modal-overlay"
          onClick={() => setSelectedSOS(null)}
        >
          <div
            className="dashboard-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dashboard-modal-header">
              <div>
                <p className="dashboard-label">EMERGENCY REQUEST</p>

                <h2>SOS #{selectedSOS.sos_id}</h2>
              </div>

              <button
                className="dashboard-modal-close"
                onClick={() => setSelectedSOS(null)}
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="dashboard-modal-content">
              <div className="dashboard-detail-row">
                <span>Patient</span>

                <strong>{selectedSOS.patient_name}</strong>
              </div>

              <div className="dashboard-detail-row">
                <span>Emergency Type</span>

                <strong>{selectedSOS.emergency_type}</strong>
              </div>

              <div className="dashboard-detail-row">
                <span>Phone</span>

                <strong>{selectedSOS.phone}</strong>
              </div>

              <div className="dashboard-detail-row">
                <span>Age</span>

                <strong>{selectedSOS.age ?? "Not provided"}</strong>
              </div>

              <div className="dashboard-detail-row">
                <span>Gender</span>

                <strong>{selectedSOS.gender || "Not provided"}</strong>
              </div>

              <div className="dashboard-detail-row">
                <span>Status</span>

                <strong className={getStatusClass(selectedSOS.status)}>
                  {selectedSOS.status}
                </strong>
              </div>

              <div className="dashboard-detail-row">
                <span>Received</span>

                <strong>{formatDate(selectedSOS.created_at)}</strong>
              </div>

              {selectedSOS.notes && (
                <div className="dashboard-detail-notes">
                  <span>Additional Information</span>

                  <p>{selectedSOS.notes}</p>
                </div>
              )}
            </div>

            <div className="dashboard-modal-actions">
              {selectedSOS.status === "pending" && (
                <button
                  className="dashboard-accept"
                  disabled={updatingId === selectedSOS.sos_id}
                  onClick={() => updateRequest(selectedSOS.sos_id, "accept")}
                >
                  <CheckCircle size={17} />
                  Accept
                </button>
              )}

              {selectedSOS.status !== "rejected" && (
                <button
                  className="dashboard-reject"
                  disabled={updatingId === selectedSOS.sos_id}
                  onClick={() => updateRequest(selectedSOS.sos_id, "reject")}
                >
                  <XCircle size={17} />
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalDashboard;
