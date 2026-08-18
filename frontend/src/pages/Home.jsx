import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bed,
  Droplets,
  MapPin,
  Search,
  Wind,
  Zap,
} from "lucide-react";
import "../App.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">R</div>
          <span>RESQ</span>
        </div>

        <button className="header-button">
          Emergency Help
        </button>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-content">

            <div className="status-pill">
              <span className="status-dot"></span>
              Emergency healthcare, simplified
            </div>

            <h1>
              Find the right
              <span> care when it matters.</span>
            </h1>

            <p>
              Quickly discover nearby hospitals with available ICU beds,
              blood, oxygen and emergency services.
            </p>

            <div className="search-box">
              <div className="search-input">
                <MapPin size={21} />

                <div>
                  <label>Your location</label>
                  <input
                    type="text"
                    placeholder="Enter city or location"
                  />
                </div>
              </div>

              <button
                className="search-button"
                onClick={() => navigate("/hospitals")}
              >
                <Search size={19} />
                Find Hospitals
              </button>
            </div>

            <p className="search-note">
              Search hospitals within your preferred radius.
            </p>

          </div>
        </section>

        <section className="resources-section">
          <div className="section-heading">
            <div>
              <span>CHECK AVAILABILITY</span>
              <h2>What do you need?</h2>
            </div>

            <button
              className="view-all"
              onClick={() => navigate("/hospitals")}
            >
              View all
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="resource-grid">

            <ResourceCard
              icon={<Bed />}
              title="ICU Beds"
              description="Find hospitals with available ICU beds"
              onClick={() => navigate("/hospitals")}
            />

            <ResourceCard
              icon={<Droplets />}
              title="Blood"
              description="Check blood availability nearby"
              onClick={() => navigate("/hospitals")}
            />

            <ResourceCard
              icon={<Wind />}
              title="Oxygen"
              description="Find hospitals with oxygen supply"
              onClick={() => navigate("/hospitals")}
            />

            <ResourceCard
              icon={<Zap />}
              title="Emergency"
              description="Find hospitals offering emergency care"
              onClick={() => navigate("/hospitals")}
            />

          </div>
        </section>

        <section className="emergency-section">

          <div className="emergency-icon">
            <Activity size={25} />
          </div>

          <div>
            <h3>Need emergency assistance?</h3>

            <p>
              Search nearby hospitals and check critical resource
              availability before you travel.
            </p>
          </div>

          <button onClick={() => navigate("/hospitals")}>
            Start Search
            <ArrowRight size={18} />
          </button>

        </section>
      </main>

      <footer>
        <div className="logo">
          <div className="logo-icon">R</div>
          <span>RESQ</span>
        </div>

        <p>
          Smart emergency hospital resource management.
        </p>
      </footer>
    </div>
  );
}

function ResourceCard({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      className="resource-card"
      onClick={onClick}
    >
      <div className="resource-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      <ArrowRight
        className="card-arrow"
        size={18}
      />
    </button>
  );
}

export default Home;