import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bed,
  Droplets,
  LogOut,
  MapPin,
  Search,
  UserRound,
  Wind,
  Zap,
} from "lucide-react";
import "../App.css";

function PatientDashboard() {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("resq_patient_user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  const patientName =
    user?.name ||
    user?.fullName ||
    user?.username ||
    "Patient";

  function handleLogout() {
    localStorage.removeItem("resq_patient_user");
    navigate("/patient-login");
  }

  return (
    <div className="patient-dashboard">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="patient-dashboard-nav">

        <div
          className="patient-dashboard-logo"
          onClick={() => navigate("/")}
        >
          <div className="patient-dashboard-logo-icon">
            R
          </div>

          <span>RESQ</span>
        </div>

        <div className="patient-dashboard-nav-right">

          <div className="patient-user">

            <div className="patient-user-icon">
              <UserRound size={17} />
            </div>

            <div>
              <span>Welcome</span>
              <strong>{patientName}</strong>
            </div>

          </div>

          <button
            className="patient-logout"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="patient-dashboard-main">

        {/* HERO */}

        <section className="patient-dashboard-hero">

          <div>

            <div className="patient-dashboard-status">
              <span></span>
              RESQ Healthcare Network
            </div>

            <h1>
              How can we help
              <br />
              <span>you today?</span>
            </h1>

            <p>
              Find nearby hospitals and check critical
              healthcare resources in real time.
            </p>

          </div>

          <div className="patient-dashboard-hero-icon">
            <Activity size={42} />
          </div>

        </section>


        {/* SEARCH */}

        <section className="patient-search-section">

          <div className="patient-search-heading">

            <div>
              <span>FIND CARE</span>
              <h2>Find a hospital</h2>
            </div>

          </div>

          <div className="patient-search-box">

            <MapPin size={21} />

            <input
              type="text"
              placeholder="Enter city, location or hospital name"
            />

            <button
              onClick={() => navigate("/hospitals")}
            >
              <Search size={18} />
              Search
            </button>

          </div>

        </section>


        {/* RESOURCES */}

        <section className="patient-resources">

          <div className="patient-section-title">

            <div>
              <span>CRITICAL RESOURCES</span>
              <h2>What do you need?</h2>
            </div>

            <button
              onClick={() => navigate("/hospitals")}
            >
              View hospitals
              <ArrowRight size={16} />
            </button>

          </div>


          <div className="patient-resource-grid">

            <button
              className="patient-resource-card"
              onClick={() => navigate("/hospitals")}
            >
              <div className="patient-resource-icon">
                <Bed size={24} />
              </div>

              <h3>ICU Beds</h3>

              <p>
                Find hospitals with available ICU beds.
              </p>

              <ArrowRight size={17} />

            </button>


            <button
              className="patient-resource-card"
              onClick={() => navigate("/hospitals")}
            >
              <div className="patient-resource-icon">
                <Droplets size={24} />
              </div>

              <h3>Blood</h3>

              <p>
                Check blood availability near you.
              </p>

              <ArrowRight size={17} />

            </button>


            <button
              className="patient-resource-card"
              onClick={() => navigate("/hospitals")}
            >
              <div className="patient-resource-icon">
                <Wind size={24} />
              </div>

              <h3>Oxygen</h3>

              <p>
                Find hospitals with oxygen supply.
              </p>

              <ArrowRight size={17} />

            </button>


            <button
              className="patient-resource-card emergency"
              onClick={() => navigate("/hospitals")}
            >
              <div className="patient-resource-icon">
                <Zap size={24} />
              </div>

              <h3>Emergency Care</h3>

              <p>
                Find hospitals offering emergency care.
              </p>

              <ArrowRight size={17} />

            </button>

          </div>

        </section>


        {/* EMERGENCY */}

        <section className="patient-emergency">

          <div className="patient-emergency-icon">
            <Zap size={26} />
          </div>

          <div>

            <span>EMERGENCY ASSISTANCE</span>

            <h2>
              Need help right now?
            </h2>

            <p>
              Find the nearest hospitals and check
              emergency resource availability.
            </p>

          </div>

          <button
            onClick={() => navigate("/hospitals")}
          >
            Find Emergency Care
            <ArrowRight size={18} />
          </button>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="patient-dashboard-footer">

        <div className="patient-dashboard-logo">

          <div className="patient-dashboard-logo-icon">
            R
          </div>

          <span>RESQ</span>

        </div>

        <p>
          Smart emergency healthcare management.
        </p>

      </footer>

    </div>
  );
}

export default PatientDashboard;