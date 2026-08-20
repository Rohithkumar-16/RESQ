import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5001/api";

function AddHospital() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    hospital_name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    latitude: "",
    longitude: "",

    icu_total: 0,
    icu_available: 0,

    blood_total: 0,
    blood_available: 0,

    oxygen_total: 0,
    oxygen_available: 0,

    emergency_total: 0,
    emergency_available: 0,

    ambulance_total: 0,
    ambulance_available: 0,

    designation: "Hospital Administrator",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // HANDLE INPUT
  // ============================================================

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // ============================================================
  // VALIDATE RESOURCE
  // ============================================================

  function validateResource(name, total, available) {
    const totalValue = Number(total);
    const availableValue = Number(available);

    if (
      Number.isNaN(totalValue) ||
      Number.isNaN(availableValue)
    ) {
      throw new Error(
        `${name}: Please enter valid numbers.`
      );
    }

    if (
      totalValue < 0 ||
      availableValue < 0
    ) {
      throw new Error(
        `${name}: Values cannot be negative.`
      );
    }

    if (availableValue > totalValue) {
      throw new Error(
        `${name}: Available cannot be greater than total.`
      );
    }
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      // --------------------------------------------------------
      // BASIC VALIDATION
      // --------------------------------------------------------

      if (!formData.hospital_name.trim()) {
        throw new Error(
          "Please enter the hospital name."
        );
      }

      if (!formData.address.trim()) {
        throw new Error(
          "Please enter the hospital address."
        );
      }

      if (!formData.city.trim()) {
        throw new Error(
          "Please enter the city."
        );
      }

      if (!formData.phone.trim()) {
        throw new Error(
          "Please enter the hospital phone number."
        );
      }

      // --------------------------------------------------------
      // RESOURCE VALIDATION
      // --------------------------------------------------------

      validateResource(
        "ICU",
        formData.icu_total,
        formData.icu_available
      );

      validateResource(
        "Blood",
        formData.blood_total,
        formData.blood_available
      );

      validateResource(
        "Oxygen",
        formData.oxygen_total,
        formData.oxygen_available
      );

      validateResource(
        "Emergency Service",
        formData.emergency_total,
        formData.emergency_available
      );

      validateResource(
        "Ambulance",
        formData.ambulance_total,
        formData.ambulance_available
      );

      // --------------------------------------------------------
      // REGISTER HOSPITAL
      // --------------------------------------------------------

      const response = await fetch(
        `${API_URL}/hospital/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            hospital_name:
              formData.hospital_name.trim(),

            address:
              formData.address.trim(),

            city:
              formData.city.trim(),

            state:
              formData.state.trim(),

            phone:
              formData.phone.trim(),

            latitude:
              formData.latitude !== ""
                ? Number(formData.latitude)
                : null,

            longitude:
              formData.longitude !== ""
                ? Number(formData.longitude)
                : null,

            designation:
              formData.designation.trim() ||
              "Hospital Administrator",

            icu_total:
              Number(formData.icu_total),

            icu_available:
              Number(formData.icu_available),

            blood_total:
              Number(formData.blood_total),

            blood_available:
              Number(formData.blood_available),

            oxygen_total:
              Number(formData.oxygen_total),

            oxygen_available:
              Number(formData.oxygen_available),

            emergency_total:
              Number(formData.emergency_total),

            emergency_available:
              Number(
                formData.emergency_available
              ),

            ambulance_total:
              Number(formData.ambulance_total),

            ambulance_available:
              Number(
                formData.ambulance_available
              ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to register hospital."
        );
      }

      // --------------------------------------------------------
      // SAVE UPDATED USER
      // --------------------------------------------------------

      if (data.user) {
        localStorage.setItem(
          "resq_hospital_user",
          JSON.stringify(data.user)
        );
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      setMessage(
        "Hospital registered successfully! Opening dashboard..."
      );

      // --------------------------------------------------------
      // OPEN DASHBOARD
      // --------------------------------------------------------

      setTimeout(() => {
        navigate("/hospital-dashboard");
      }, 800);

    } catch (err) {
      console.error(
        "Hospital registration error:",
        err
      );

      setError(
        err.message ||
          "Unable to register hospital."
      );

    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="add-hospital-container">

      <h1>
        Register Your Hospital
      </h1>

      <p>
        Complete your hospital information
        to activate your RESQ hospital dashboard.
      </p>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ======================================================
            HOSPITAL INFORMATION
        ======================================================= */}

        <h2>
          Hospital Information
        </h2>

        <div>
          <label>
            Hospital Name
          </label>

          <input
            type="text"
            name="hospital_name"
            value={formData.hospital_name}
            onChange={handleChange}
            placeholder="Enter hospital name"
            required
          />
        </div>

        <div>
          <label>
            Address
          </label>

          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter hospital address"
            required
          />
        </div>

        <div>
          <label>
            City
          </label>

          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
            required
          />
        </div>

        <div>
          <label>
            State
          </label>

          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter state"
          />
        </div>

        <div>
          <label>
            Hospital Phone
          </label>

          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Enter hospital phone"
            required
          />
        </div>

        <div>
          <label>
            Your Designation
          </label>

          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="Hospital Administrator"
          />
        </div>

        <div>
          <label>
            Latitude
          </label>

          <input
            type="number"
            step="any"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="Example: 21.1702"
          />
        </div>

        <div>
          <label>
            Longitude
          </label>

          <input
            type="number"
            step="any"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="Example: 72.8311"
          />
        </div>

        {/* ======================================================
            ICU
        ======================================================= */}

        <h2>
          ICU
        </h2>

        <div>
          <label>
            Total ICU Beds
          </label>

          <input
            type="number"
            min="0"
            name="icu_total"
            value={formData.icu_total}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>
            Available ICU Beds
          </label>

          <input
            type="number"
            min="0"
            name="icu_available"
            value={formData.icu_available}
            onChange={handleChange}
          />
        </div>

        {/* ======================================================
            BLOOD
        ======================================================= */}

        <h2>
          Blood
        </h2>

        <div>
          <label>
            Total Blood Units
          </label>

          <input
            type="number"
            min="0"
            name="blood_total"
            value={formData.blood_total}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>
            Available Blood Units
          </label>

          <input
            type="number"
            min="0"
            name="blood_available"
            value={formData.blood_available}
            onChange={handleChange}
          />
        </div>

        {/* ======================================================
            OXYGEN
        ======================================================= */}

        <h2>
          Oxygen
        </h2>

        <div>
          <label>
            Total Oxygen Cylinders
          </label>

          <input
            type="number"
            min="0"
            name="oxygen_total"
            value={formData.oxygen_total}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>
            Available Oxygen Cylinders
          </label>

          <input
            type="number"
            min="0"
            name="oxygen_available"
            value={formData.oxygen_available}
            onChange={handleChange}
          />
        </div>

        {/* ======================================================
            EMERGENCY SERVICE
        ======================================================= */}

        <h2>
          Emergency Service
        </h2>

        <div>
          <label>
            Total Emergency Service Slots
          </label>

          <input
            type="number"
            min="0"
            name="emergency_total"
            value={formData.emergency_total}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>
            Available Emergency Service Slots
          </label>

          <input
            type="number"
            min="0"
            name="emergency_available"
            value={formData.emergency_available}
            onChange={handleChange}
          />
        </div>

        {/* ======================================================
            AMBULANCE
        ======================================================= */}

        <h2>
          Ambulance
        </h2>

        <div>
          <label>
            Total Ambulances
          </label>

          <input
            type="number"
            min="0"
            name="ambulance_total"
            value={formData.ambulance_total}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>
            Available Ambulances
          </label>

          <input
            type="number"
            min="0"
            name="ambulance_available"
            value={formData.ambulance_available}
            onChange={handleChange}
          />
        </div>

        {/* ======================================================
            SUBMIT
        ======================================================= */}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Registering..."
            : "Register Hospital"}
        </button>

      </form>

      <button
        type="button"
        onClick={() =>
          navigate("/hospital-dashboard")
        }
        disabled={loading}
      >
        Back to Dashboard
      </button>

    </div>
  );
}

export default AddHospital;