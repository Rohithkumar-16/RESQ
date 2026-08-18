import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bed,
  Droplets,
  MapPin,
  Phone,
  Wind,
  Zap,
  Ambulance,
} from "lucide-react";

const API_URL = "http://localhost:5001/api/hospitals";

function StatusBadge({ available }) {
  return (
    <span
      className={`status-badge ${
        available ? "available" : "unavailable"
      }`}
    >
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

function HospitalDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHospital() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/${id}`);

        if (!response.ok) {
          throw new Error("Hospital not found");
        }

        const data = await response.json();
        setHospital(data);
      } catch (err) {
        console.error("Hospital details error:", err);
        setError("Unable to load hospital details.");
      } finally {
        setLoading(false);
      }
    }

    fetchHospital();
  }, [id]);

  if (loading) {
    return (
      <div className="hospitals-page">
        <header className="hospitals-header">
          <div className="hospitals-header-inner">
            <button
              className="back-button"
              onClick={() => navigate("/hospitals")}
            >
              <ArrowLeft size={20} />
            </button>

            <div className="hospitals-logo">RESQ</div>

            <div />
          </div>
        </header>

        <main className="hospitals-main">
          <div className="hospital-card">
            <p>Loading hospital details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !hospital) {
    return (
      <div className="hospitals-page">
        <header className="hospitals-header">
          <div className="hospitals-header-inner">
            <button
              className="back-button"
              onClick={() => navigate("/hospitals")}
            >
              <ArrowLeft size={20} />
            </button>

            <div className="hospitals-logo">RESQ</div>

            <div />
          </div>
        </header>

        <main className="hospitals-main">
          <div className="hospital-card">
            <h2>Hospital not found</h2>
            <p>{error}</p>

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

  const icu = hospital.resources?.ICU;
  const blood = hospital.resources?.Blood;
  const oxygen = hospital.resources?.Oxygen;
  const ambulance = hospital.resources?.Ambulance;

  return (
    <div className="hospitals-page">
      {/* Header */}
      <header className="hospitals-header">
        <div className="hospitals-header-inner">
          <button
            className="back-button"
            onClick={() => navigate("/hospitals")}
            aria-label="Back to hospitals"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="hospitals-logo">RESQ</div>

          <button
            className="emergency-button"
            onClick={() => navigate(`/request/${hospital.id}`)}
          >
            Emergency Help
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="hospitals-main">
        <section className="hospital-details-hero">
          <p className="section-label">HOSPITAL DETAILS</p>

          <h1>{hospital.name}</h1>

          <div className="hospital-details-location">
            <MapPin size={18} />

            <span>
              {hospital.address}, {hospital.city}, {hospital.state}
            </span>
          </div>

          <div className="hospital-contact">
            <Phone size={17} />

            <a href={`tel:${hospital.phone}`}>
              {hospital.phone}
            </a>
          </div>
        </section>

        {/* Emergency Request */}
        <section className="emergency-request-card">
          <div>
            <div className="emergency-request-icon">
              <Zap size={22} />
            </div>

            <h2>Need emergency assistance?</h2>

            <p>
              Send an emergency request to this hospital.
            </p>
          </div>

          <button
            className="emergency-request-button"
            onClick={() => navigate(`/request/${hospital.id}`)}
          >
            Request Emergency Help
          </button>
        </section>

        {/* Resources */}
        <section className="details-section">
          <div className="details-section-heading">
            <h2>Available resources</h2>

            <p>
              Current availability reported by the hospital.
            </p>
          </div>

          <div className="details-resource-grid">
            {/* ICU */}
            <div className="details-resource-card">
              <div className="details-resource-icon">
                <Bed size={23} />
              </div>

              <div>
                <span>ICU Beds</span>

                <strong>
                  {icu?.available ?? hospital.icu_available}
                  {icu?.total ? ` / ${icu.total}` : ""}
                </strong>

                <small>
                  {icu?.available > 0
                    ? "Beds currently available"
                    : "No ICU beds available"}
                </small>
              </div>
            </div>

            {/* Blood */}
            <div className="details-resource-card">
              <div className="details-resource-icon">
                <Droplets size={23} />
              </div>

              <div>
                <span>Blood</span>

                <StatusBadge
                  available={hospital.blood_available}
                />

                <small>
                  Blood availability status
                </small>
              </div>
            </div>

            {/* Oxygen */}
            <div className="details-resource-card">
              <div className="details-resource-icon">
                <Wind size={23} />
              </div>

              <div>
                <span>Oxygen</span>

                <StatusBadge
                  available={hospital.oxygen_available}
                />

                <small>
                  Oxygen availability status
                </small>
              </div>
            </div>

            {/* Emergency */}
            <div className="details-resource-card">
              <div className="details-resource-icon">
                <Zap size={23} />
              </div>

              <div>
                <span>Emergency Service</span>

                <StatusBadge
                  available={hospital.emergency_service}
                />

                <small>
                  Emergency services available
                </small>
              </div>
            </div>

            {/* Ambulance */}
            <div className="details-resource-card">
              <div className="details-resource-icon">
                <Ambulance size={23} />
              </div>

              <div>
                <span>Ambulance</span>

                <StatusBadge
                  available={hospital.ambulance_available}
                />

                <small>
                  {ambulance
                    ? `${ambulance.available} ambulance available`
                    : "Ambulance availability"}
                </small>
              </div>
            </div>
          </div>
        </section>

        {/* Last updated */}
        <section className="details-updated">
          <span>
            Last updated
          </span>

          <strong>
            {hospital.last_updated
              ? new Date(
                  hospital.last_updated
                ).toLocaleString()
              : "Not available"}
          </strong>
        </section>
      </main>
    </div>
  );
}

export default HospitalDetails;