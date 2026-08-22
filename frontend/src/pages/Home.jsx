import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ResqLiveMap from "../components/ResqLiveMap";
import {
  ArrowRight,
  Bed,
  Droplets,
  HeartPulse,
  MapPin,
  Search,
  ShieldCheck,
  Wind,
  Zap,
} from "lucide-react";
import "../App.css";

function Home() {
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    async function fetchHospitals() {
      try {
        const response = await fetch(
          "http://localhost:5001/api/hospitals"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch hospitals");
        }

        const data = await response.json();

        setHospitals(data);
      } catch (error) {
        console.error(
          "Failed to load hospitals for map:",
          error
        );
      }
    }

    fetchHospitals();
  }, []);

  return (
    <div className="resq-home">

      {/* ========================= NAVBAR ========================= */}

      <header className="resq-navbar">

        <div
          className="resq-logo"
          onClick={() => navigate("/")}
        >
          <div className="resq-logo-mark">R</div>
          <span>RESQ</span>
        </div>

        <nav className="resq-nav-links">
          <button onClick={() => navigate("/hospitals")}>
            Find Care
          </button>

          <button onClick={() => navigate("/hospitals")}>
            Hospitals
          </button>

          <button
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            How RESQ Works
          </button>

          <button
            onClick={() =>
              document
                .getElementById("about-resq")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            About
          </button>
        </nav>

        <div className="resq-nav-actions">

          <button
            className="resq-login-link"
            onClick={() => navigate("/patient-login")}
          >
            Patient Login
          </button>

          <button
            className="resq-hospital-link"
            onClick={() => navigate("/hospital-login")}
          >
            Hospital Login
          </button>

          <button
            className="resq-nav-cta"
            onClick={() => navigate("/patient-signup")}
          >
            Get Started
            <ArrowRight size={16} />
          </button>

        </div>

      </header>


      {/* ========================= HERO ========================= */}

      <main>

        <section className="resq-hero">

          <div className="resq-hero-content">

            <div className="resq-eyebrow">
              <span className="resq-eyebrow-dot"></span>
              Emergency healthcare, connected
            </div>

            <h1>
              Care that moves
              <br />
              <span>when you need it.</span>
            </h1>

            <p>
              Find nearby hospitals, check critical resources,
              and connect with emergency care — all in one place.
            </p>

            <div className="resq-hero-actions">

              <button
                className="resq-primary-button"
                onClick={() => navigate("/hospitals")}
              >
                Find a hospital
                <ArrowRight size={18} />
              </button>

              <button
                className="resq-secondary-button"
                onClick={() => navigate("/hospitals")}
              >
                <Zap size={18} />
                Emergency help
              </button>

            </div>

            <div className="resq-trust-row">

              <div>
                <ShieldCheck size={17} />
                Secure healthcare access
              </div>

              <div>
                <HeartPulse size={17} />
                Built for critical moments
              </div>

            </div>

          </div>


          <div className="resq-hero-visual">

            <div className="resq-hero-image">

              <div className="resq-image-overlay"></div>

              <div className="resq-floating-card resq-floating-top">

                <div className="resq-floating-icon">
                  <HeartPulse size={19} />
                </div>

                <div>
                  <strong>Care when it matters</strong>
                  <span>Connected through RESQ</span>
                </div>

              </div>

              <div className="resq-floating-card resq-floating-bottom">

                <MapPin size={18} />

                <div>
                  <strong>Find care nearby</strong>
                  <span>Hospitals & emergency services</span>
                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ========================= INTRO ========================= */}

        <section
          className="resq-intro"
          id="about-resq"
        >

          <div className="resq-intro-small">
            WHY RESQ
          </div>

          <div className="resq-intro-main">

            <h2>
              Healthcare shouldn't feel
              <span> harder when you're already worried.</span>
            </h2>

            <p>
              RESQ brings essential hospital information together
              so patients can make faster decisions when every
              second matters.
            </p>

          </div>

        </section>

        {/* ========================= RESQ AI ========================= */}

        <section className="resq-ai-home-section">

          <div className="resq-ai-home-content">

            <span>RESQ AI</span>

            <h2>
              Smarter help
              <br />
              when every second matters.
            </h2>

            <p>
              Upload an injury or emergency image and let RESQ AI
              analyze visible findings and help identify an appropriate
              available hospital.
            </p>

            <button
              className="resq-ai-home-button"
              onClick={() => navigate("/ai-triage")}
            >
              Try RESQ AI
              <ArrowRight size={18} />
            </button>

          </div>

          <div className="resq-ai-home-badge">

            <div>
              <HeartPulse size={24} />
            </div>

            <span>AI-assisted</span>
            <strong>Emergency Triage</strong>

          </div>

        </section>
        {/* ========================= RESOURCES ========================= */}

        <section className="resq-care-section">

          <div className="resq-section-heading">

            <div>

              <span>FIND WHAT YOU NEED</span>

              <h2>
                The right care,
                <br />
                without the guesswork.
              </h2>

            </div>

            <button
              onClick={() => navigate("/hospitals")}
              className="resq-text-button"
            >
              Explore hospitals
              <ArrowRight size={17} />
            </button>

          </div>


          <div className="resq-care-grid">

            <CareCard
              icon={<Bed size={25} />}
              number="01"
              title="ICU beds"
              description="Find hospitals with available intensive care beds."
              onClick={() => navigate("/hospitals")}
            />

            <CareCard
              icon={<Droplets size={25} />}
              number="02"
              title="Blood availability"
              description="Check blood availability before you travel."
              onClick={() => navigate("/hospitals")}
            />

            <CareCard
              icon={<Wind size={25} />}
              number="03"
              title="Oxygen"
              description="Find hospitals with available oxygen resources."
              onClick={() => navigate("/hospitals")}
            />

            <CareCard
              icon={<Zap size={25} />}
              number="04"
              title="Emergency care"
              description="Find hospitals ready to provide emergency assistance."
              onClick={() => navigate("/hospitals")}
              emergency
            />

          </div>

        </section>


        {/* ========================= SEARCH ========================= */}

        <section className="resq-search-section">

          <div className="resq-search-content">

            <span>FIND CARE NEAR YOU</span>

            <h2>
              Where do you need
              <br />
              care?
            </h2>

            <p>
              Search by city, location, or hospital name
              to find available healthcare resources.
            </p>

            <div className="resq-search-box">

              <MapPin size={20} />

              <input
                type="text"
                placeholder="Enter city, location or hospital"
              />

              <button
                onClick={() => navigate("/hospitals")}
              >
                <Search size={18} />
                Search
              </button>

            </div>

          </div>

          <div className="resq-search-map">

            <ResqLiveMap
              hospitals={hospitals}
              onHospitalSelect={(hospital) => {
                localStorage.setItem(
                  "resq_selected_hospital",
                  JSON.stringify(hospital)
                );

                navigate("/patient-dashboard");
              }}
            />
          </div>

        </section>


        {/* ========================= HOW IT WORKS ========================= */}

        <section
          className="resq-how"
          id="how-it-works"
        >

          <div className="resq-section-heading centered">

            <span>HOW RESQ WORKS</span>

            <h2>
              From searching to care
              <br />
              in a few simple steps.
            </h2>

          </div>


          <div className="resq-steps">

            <Step
              number="01"
              title="Find"
              description="Search for hospitals and emergency services near your location."
            />

            <Step
              number="02"
              title="Check"
              description="See available ICU beds, blood, oxygen and emergency resources."
            />

            <Step
              number="03"
              title="Connect"
              description="View hospital information and choose the care that fits your needs."
            />

            <Step
              number="04"
              title="Respond"
              description="Request emergency assistance and keep track of your request."
            />

          </div>

        </section>


        {/* ========================= TWO SIDES ========================= */}

        <section className="resq-audience">

          <div className="resq-audience-card patient">

            <div className="resq-audience-number">
              FOR PATIENTS
            </div>

            <h2>
              Your care,
              <br />
              within reach.
            </h2>

            <p>
              Find hospitals, check resources and get
              the information you need before you travel.
            </p>

            <button
              onClick={() => navigate("/patient-signup")}
            >
              Create patient account
              <ArrowRight size={17} />
            </button>

          </div>


          <div className="resq-audience-card hospital">

            <div className="resq-audience-number">
              FOR HOSPITALS
            </div>

            <h2>
              Better visibility.
              <br />
              Faster response.
            </h2>

            <p>
              Manage resources, respond to emergency
              requests and keep hospital information updated.
            </p>

            <button
              onClick={() => navigate("/hospital-login")}
            >
              Hospital portal
              <ArrowRight size={17} />
            </button>

          </div>

        </section>


        {/* ========================= FINAL CTA ========================= */}

        <section className="resq-final-cta">

          <div>

            <span>WHEN EVERY SECOND MATTERS</span>

            <h2>
              Get closer to the
              <br />
              care you need.
            </h2>

            <p>
              RESQ helps connect patients with hospitals
              and critical healthcare resources.
            </p>

          </div>

          <button
            onClick={() => navigate("/hospitals")}
          >
            Find care now
            <ArrowRight size={18} />
          </button>

        </section>

      </main>


      {/* ========================= FOOTER ========================= */}

      <footer className="resq-footer">

        <div className="resq-footer-top">

          <div className="resq-footer-brand">

            <div className="resq-logo">

              <div className="resq-logo-mark">
                R
              </div>

              <span>RESQ</span>

            </div>

            <p>
              Connecting people with emergency
              healthcare when it matters most.
            </p>

          </div>


          <div className="resq-footer-links">

            <div>
              <strong>Care</strong>

              <button onClick={() => navigate("/hospitals")}>
                Find hospitals
              </button>

              <button onClick={() => navigate("/hospitals")}>
                ICU availability
              </button>

              <button onClick={() => navigate("/hospitals")}>
                Blood availability
              </button>

              <button onClick={() => navigate("/hospitals")}>
                Emergency care
              </button>
            </div>


            <div>
              <strong>Account</strong>

              <button onClick={() => navigate("/patient-login")}>
                Patient login
              </button>

              <button onClick={() => navigate("/patient-signup")}>
                Patient registration
              </button>

              <button onClick={() => navigate("/hospital-login")}>
                Hospital login
              </button>
            </div>

          </div>

        </div>


        <div className="resq-footer-bottom">

          <span>
            © 2026 RESQ. Smart emergency healthcare management.
          </span>

          <span>
            Built for better emergency access.
          </span>

        </div>

      </footer>

    </div>
  );
}


function CareCard({
  icon,
  number,
  title,
  description,
  onClick,
  emergency,
}) {
  return (
    <button
      className={`resq-care-card ${emergency ? "emergency" : ""
        }`}
      onClick={onClick}
    >

      <div className="resq-care-card-top">

        <div className="resq-care-icon">
          {icon}
        </div>

        <span>{number}</span>

      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      <div className="resq-care-arrow">
        <ArrowRight size={18} />
      </div>

    </button>
  );
}


function Step({
  number,
  title,
  description,
}) {
  return (
    <div className="resq-step">

      <span>{number}</span>

      <div className="resq-step-line"></div>

      <h3>{title}</h3>

      <p>{description}</p>

    </div>
  );
}


export default Home;