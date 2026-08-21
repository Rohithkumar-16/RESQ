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
  Menu,
  X,
  UserRound,
  Building2,
} from "lucide-react";
import { useState } from "react";
import "../App.css";

function Home() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [authMenu, setAuthMenu] = useState(null);

  return (
    <div className="app">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="modern-navbar">

        <div
          className="navbar-logo"
          onClick={() => navigate("/")}
        >
          <div className="navbar-logo-icon">
            R
          </div>

          <span>RESQ</span>
        </div>

        <nav className="desktop-nav">

          <button
            onClick={() => navigate("/")}
          >
            Home
          </button>

          <button
            onClick={() => navigate("/hospitals")}
          >
            Find Hospitals
          </button>

          <button
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            How It Works
          </button>

          <button
            onClick={() =>
              document
                .getElementById("about")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            About
          </button>

        </nav>

        <div className="navbar-actions">

          {/* LOGIN */}

          <div className="nav-dropdown">

            <button
              className="nav-login-button"
              onClick={() =>
                setAuthMenu(
                  authMenu === "login"
                    ? null
                    : "login"
                )
              }
            >
              Login
            </button>

            {authMenu === "login" && (
              <div className="nav-dropdown-menu">

                <div className="dropdown-title">
                  Login to RESQ
                </div>

                <button
                  onClick={() =>
                    navigate("/patient-login")
                  }
                >
                  <UserRound size={18} />
                  <div>
                    <strong>Patient</strong>
                    <span>
                      Access your healthcare account
                    </span>
                  </div>
                </button>

                <button
                  onClick={() =>
                    navigate("/hospital-login")
                  }
                >
                  <Building2 size={18} />
                  <div>
                    <strong>Hospital</strong>
                    <span>
                      Manage your hospital
                    </span>
                  </div>
                </button>

              </div>
            )}

          </div>

          {/* REGISTER */}

          <div className="nav-dropdown">

            <button
              className="nav-register-button"
              onClick={() =>
                setAuthMenu(
                  authMenu === "register"
                    ? null
                    : "register"
                )
              }
            >
              Register
            </button>

            {authMenu === "register" && (
              <div className="nav-dropdown-menu">

                <div className="dropdown-title">
                  Join RESQ
                </div>

                <button
                  onClick={() =>
                    navigate("/patient-signup")
                  }
                >
                  <UserRound size={18} />
                  <div>
                    <strong>Patient</strong>
                    <span>
                      Create your patient account
                    </span>
                  </div>
                </button>

                <button
                  onClick={() =>
                    navigate("/add-hospital")
                  }
                >
                  <Building2 size={18} />
                  <div>
                    <strong>Hospital</strong>
                    <span>
                      Register your hospital
                    </span>
                  </div>
                </button>

              </div>
            )}

          </div>

          {/* PRIMARY CTA */}

          <button
            className="navbar-primary-button"
            onClick={() => navigate("/hospitals")}
          >
            Find a Hospital
            <ArrowRight size={16} />
          </button>

        </div>

        {/* MOBILE MENU */}

        <button
          className="mobile-menu-button"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
        >
          {menuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>

      </header>

      {menuOpen && (
        <div className="mobile-nav">

          <button onClick={() => navigate("/")}>
            Home
          </button>

          <button
            onClick={() => navigate("/hospitals")}
          >
            Find Hospitals
          </button>

          <button
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            How It Works
          </button>

          <button
            onClick={() =>
              document
                .getElementById("about")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            About
          </button>

          <button
            onClick={() => navigate("/patient-login")}
          >
            Patient Login
          </button>

          <button
            onClick={() =>
              navigate("/hospital-login")
            }
          >
            Hospital Login
          </button>

          <button
            onClick={() =>
              navigate("/patient-signup")
            }
          >
            Patient Register
          </button>

          <button
            onClick={() =>
              navigate("/add-hospital")
            }
          >
            Hospital Register
          </button>

        </div>
      )}

      {/* =====================================================
          HERO
      ====================================================== */}

      <main>

        <section className="new-hero">

          <div className="hero-content">

            <div className="status-pill">
              <span className="status-dot"></span>
              Live emergency healthcare network
            </div>

            <h1>
              Emergency care,
              <br />
              <span>
                without the uncertainty.
              </span>
            </h1>

            <p>
              Find the right hospital, check critical
              resource availability and get emergency
              assistance when every second matters.
            </p>

            <div className="search-box">

              <div className="search-input">

                <MapPin size={21} />

                <div>
                  <label>
                    Your location
                  </label>

                  <input
                    type="text"
                    placeholder="Enter city or location"
                  />
                </div>

              </div>

              <button
                className="search-button"
                onClick={() =>
                  navigate("/hospitals")
                }
              >
                <Search size={19} />
                Find Hospitals
              </button>

            </div>

            <p className="search-note">
              Real-time hospital resources •
              ICU • Blood • Oxygen • Emergency Care
            </p>

          </div>

          {/* HERO NETWORK VISUAL */}

          <div className="hero-network">

            <div className="network-card">

              <div className="network-header">
                <div>
                  <span>
                    LIVE NETWORK
                  </span>

                  <h3>
                    Emergency availability
                  </h3>
                </div>

                <div className="live-indicator">
                  <span></span>
                  LIVE
                </div>
              </div>

              <div className="network-map">

                <div className="map-grid"></div>

                <div className="map-route route-one"></div>
                <div className="map-route route-two"></div>

                <div className="hospital-marker marker-one">
                  H
                </div>

                <div className="hospital-marker marker-two">
                  H
                </div>

                <div className="hospital-marker marker-three">
                  H
                </div>

                <div className="user-marker">
                  <MapPin size={22} />
                </div>

              </div>

              <div className="network-stats">

                <div>
                  <strong>24</strong>
                  <span>
                    Hospitals nearby
                  </span>
                </div>

                <div>
                  <strong>18</strong>
                  <span>
                    Emergency ready
                  </span>
                </div>

                <div>
                  <strong>92%</strong>
                  <span>
                    Network uptime
                  </span>
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RESOURCE AVAILABILITY
        ================================================== */}

        <section className="resources-section">

          <div className="section-heading">

            <div>
              <span>
                CHECK AVAILABILITY
              </span>

              <h2>
                What do you need?
              </h2>
            </div>

            <button
              className="view-all"
              onClick={() =>
                navigate("/hospitals")
              }
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
              onClick={() =>
                navigate("/hospitals")
              }
            />

            <ResourceCard
              icon={<Droplets />}
              title="Blood"
              description="Check blood availability nearby"
              onClick={() =>
                navigate("/hospitals")
              }
            />

            <ResourceCard
              icon={<Wind />}
              title="Oxygen"
              description="Find hospitals with oxygen supply"
              onClick={() =>
                navigate("/hospitals")
              }
            />

            <ResourceCard
              icon={<Zap />}
              title="Emergency"
              description="Find hospitals offering emergency care"
              onClick={() =>
                navigate("/hospitals")
              }
            />

          </div>

        </section>

        {/* =================================================
            HOW IT WORKS
        ================================================== */}

        <section
          id="how-it-works"
          className="how-section"
        >

          <div className="section-heading">

            <div>
              <span>
                HOW RESQ WORKS
              </span>

              <h2>
                From uncertainty to action.
              </h2>
            </div>

          </div>

          <div className="steps-grid">

            <Step
              number="01"
              title="Locate"
              text="Enter your location and find nearby hospitals."
            />

            <Step
              number="02"
              title="Discover"
              text="See real-time availability for critical resources."
            />

            <Step
              number="03"
              title="Choose"
              text="Compare hospitals and choose the right one."
            />

            <Step
              number="04"
              title="Respond"
              text="Request emergency assistance when needed."
            />

          </div>

        </section>

        {/* =================================================
            EMERGENCY CTA
        ================================================== */}

        <section className="emergency-section">

          <div className="emergency-icon">
            <Activity size={25} />
          </div>

          <div>
            <h3>
              Need emergency assistance?
            </h3>

            <p>
              Search nearby hospitals and check
              critical resource availability before
              you travel.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/hospitals")
            }
          >
            Start Search
            <ArrowRight size={18} />
          </button>

        </section>

      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer id="about">

        <div className="logo">
          <div className="logo-icon">
            R
          </div>

          <span>
            RESQ
          </span>
        </div>

        <p>
          Smart emergency hospital resource management.
        </p>

      </footer>

    </div>
  );
}


/* =========================================================
   RESOURCE CARD
========================================================= */

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

      <h3>
        {title}
      </h3>

      <p>
        {description}
      </p>

      <ArrowRight
        className="card-arrow"
        size={18}
      />

    </button>
  );
}


/* =========================================================
   STEP
========================================================= */

function Step({
  number,
  title,
  text,
}) {
  return (
    <div className="step-card">

      <span>
        {number}
      </span>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

    </div>
  );
}

export default Home;