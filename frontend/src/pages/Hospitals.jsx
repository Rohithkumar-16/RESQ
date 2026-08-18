import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bed,
  Droplets,
  MapPin,
  Search,
  Wind,
  Zap,
} from "lucide-react";

const API_URL = "http://localhost:5001/api/hospitals";

function StatusBadge({ available }) {
  const status = available ? "Available" : "Unavailable";

  return (
    <span
      className={`status-badge ${
        available ? "available" : "unavailable"
      }`}
    >
      {status}
    </span>
  );
}

function Hospitals() {
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHospitals() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to fetch hospitals");
        }

        const data = await response.json();

        setHospitals(data);
      } catch (err) {
        console.error("Hospital API error:", err);
        setError("Unable to load hospitals. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchHospitals();
  }, []);

  const filteredHospitals = hospitals.filter((hospital) => {
    const searchText = search.toLowerCase();

    return (
      hospital.name.toLowerCase().includes(searchText) ||
      hospital.city.toLowerCase().includes(searchText) ||
      hospital.address.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="hospitals-page">
      {/* Header */}
      <header className="hospitals-header">
        <div className="hospitals-header-inner">
          <button
            className="back-button"
            onClick={() => navigate("/")}
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="hospitals-logo">
            <span>RESQ</span>
          </div>

          <button
            className="emergency-button"
            onClick={() => navigate("/hospitals")}
          >
            Emergency Help
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="hospitals-main">
        <section className="hospitals-intro">
          <p className="section-label">NEARBY CARE</p>

          <h1>Find available hospitals</h1>

          <p>
            Quickly find hospitals with the emergency resources you need.
          </p>
        </section>

        {/* Search */}
        <section className="hospital-search-section">
          <div className="hospital-search-box">
            <Search size={20} />

            <input
              type="text"
              placeholder="Search hospitals or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search hospitals or location"
            />
          </div>

          {hospitals.length > 0 && (
            <div className="location-indicator">
              <MapPin size={18} />

              <span>
                {hospitals[0].city}, {hospitals[0].state}
              </span>
            </div>
          )}
        </section>

        {/* Results */}
        <section className="hospital-results">
          <div className="results-heading">
            <div>
              <h2>Nearby hospitals</h2>

              <p>
                {loading
                  ? "Loading hospitals..."
                  : `${filteredHospitals.length} hospitals found`}
              </p>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="hospital-card">
              <p>Loading hospitals...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="hospital-card">
              <p>{error}</p>
            </div>
          )}

          {/* No results */}
          {!loading && !error && filteredHospitals.length === 0 && (
            <div className="hospital-card">
              <p>No hospitals found.</p>
            </div>
          )}

          {/* Hospital list */}
          {!loading && !error && filteredHospitals.length > 0 && (
            <div className="hospital-list">
              {filteredHospitals.map((hospital) => {
                const icu = hospital.resources?.ICU;
                const blood = hospital.resources?.Blood;
                const oxygen = hospital.resources?.Oxygen;

                return (
                  <article className="hospital-card" key={hospital.id}>
                    <div className="hospital-card-top">
                      <div>
                        <h3>{hospital.name}</h3>

                        <div className="hospital-location">
                          <MapPin size={15} />

                          <span>{hospital.address}</span>

                          <span>•</span>

                          <span>{hospital.city}</span>
                        </div>
                      </div>

                      {hospital.emergency_service && (
                        <span className="emergency-badge">
                          <Zap size={14} />
                          Emergency
                        </span>
                      )}
                    </div>

                    <div className="resource-grid">
                      {/* ICU */}
                      <div className="resource-item">
                        <div className="resource-icon">
                          <Bed size={18} />
                        </div>

                        <div>
                          <span className="resource-label">
                            ICU Beds
                          </span>

                          <strong>
                            {icu?.available ?? hospital.icu_available}
                            {icu?.total ? `/${icu.total}` : ""}
                          </strong>
                        </div>
                      </div>

                      {/* Blood */}
                      <div className="resource-item">
                        <div className="resource-icon">
                          <Droplets size={18} />
                        </div>

                        <div>
                          <span className="resource-label">
                            Blood
                          </span>

                          <StatusBadge
                            available={hospital.blood_available}
                          />
                        </div>
                      </div>

                      {/* Oxygen */}
                      <div className="resource-item">
                        <div className="resource-icon">
                          <Wind size={18} />
                        </div>

                        <div>
                          <span className="resource-label">
                            Oxygen
                          </span>

                          <StatusBadge
                            available={hospital.oxygen_available}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="hospital-card-bottom">
                      <span className="updated-text">
                        {hospital.last_updated
                          ? `Updated ${new Date(
                              hospital.last_updated
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "Update time unavailable"}
                      </span>

                      <button
                        className="view-details-button"
                        onClick={() =>
                          navigate(`/hospital/${hospital.id}`)
                        }
                      >
                        View details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Hospitals;