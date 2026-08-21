import { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker icons with Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const DEFAULT_LOCATION = [22.3039, 70.8022];

function LocationController({ position }) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.setView(position, 13);
        }
    }, [map, position]);

    return null;
}
function CurrentLocationButton({ position, onLocate }) {
    const map = useMap();

    function handleClick() {
        if (position) {
            map.flyTo(position, 15, {
                duration: 1.2,
            });
        }

        if (onLocate) {
            onLocate();
        }
    }

    return (
        <button
            type="button"
            className="resq-current-location-button"
            onClick={handleClick}
            title="Go to my current location"
        >
            📍
            <span>Current location</span>
        </button>
    );
}
function ResqLiveMap({
    hospitals = [],
    selectedHospital = null,
    onHospitalSelect,
}) {
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState("");

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError(
                "Location is not supported by this browser."
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation([
                    position.coords.latitude,
                    position.coords.longitude,
                ]);
            },
            () => {
                setLocationError(
                    "Location permission was not granted."
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 30000,
            }
        );
    }, []);

    const center = userLocation || DEFAULT_LOCATION;

    return (
        <div className="resq-live-map">

            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={true}
                className="resq-leaflet-map"
            >

                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <LocationController
                    position={userLocation}
                />
                <CurrentLocationButton
                    position={userLocation}
                    onLocate={() => {
                        if (!navigator.geolocation) {
                            setLocationError(
                                "Location is not supported by this browser."
                            );
                            return;
                        }

                        setLocationError("");

                        navigator.geolocation.getCurrentPosition(
                            (position) => {
                                setUserLocation([
                                    position.coords.latitude,
                                    position.coords.longitude,
                                ]);
                            },
                            () => {
                                setLocationError(
                                    "Unable to access your current location."
                                );
                            },
                            {
                                enableHighAccuracy: true,
                                timeout: 10000,
                                maximumAge: 30000,
                            }
                        );
                    }}
                />

                {/* ================= USER LOCATION ================= */}

                {userLocation && (
                    <Marker position={userLocation}>
                        <Popup>
                            <strong>You are here</strong>
                            <br />
                            Your current location
                        </Popup>
                    </Marker>
                )}

                {/* ================= HOSPITALS ================= */}

                {hospitals.map((hospital) => {

                    const latitude = Number(
                        hospital.latitude ??
                        hospital.lat ??
                        hospital.location_latitude
                    );

                    const longitude = Number(
                        hospital.longitude ??
                        hospital.lng ??
                        hospital.location_longitude
                    );

                    if (
                        Number.isNaN(latitude) ||
                        Number.isNaN(longitude)
                    ) {
                        return null;
                    }

                    const hospitalId =
                        hospital.hospital_id ??
                        hospital.id;

                    const selectedId =
                        selectedHospital?.hospital_id ??
                        selectedHospital?.id;

                    const isSelected =
                        selectedHospital &&
                        String(selectedId) === String(hospitalId);

                    return (
                        <Marker
                            key={
                                hospitalId ??
                                `${latitude}-${longitude}`
                            }
                            position={[
                                latitude,
                                longitude,
                            ]}
                        >

                            <Popup>

                                <div className="resq-map-popup">

                                    <strong>
                                        {hospital.name || "Hospital"}
                                    </strong>

                                    {hospital.address && (
                                        <p>
                                            {hospital.address}
                                        </p>
                                    )}

                                    {hospital.city && (
                                        <span>
                                            {hospital.city}
                                        </span>
                                    )}

                                    {isSelected && (
                                        <div>
                                            Selected hospital
                                        </div>
                                    )}

                                    {/* SELECT HOSPITAL */}

                                    {onHospitalSelect && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onHospitalSelect(hospital)
                                            }
                                        >
                                            Select this hospital
                                        </button>
                                    )}

                                </div>

                            </Popup>

                        </Marker>
                    );
                })}

            </MapContainer>

            {/* ================= MAP STATUS ================= */}

            <div className="resq-map-status">

                <div className="resq-map-status-dot"></div>

                {userLocation
                    ? "Your location detected"
                    : locationError
                        ? "Showing nearby map"
                        : "Finding your location..."}

            </div>

            {/* ================= SELECTED HOSPITAL ================= */}

            {selectedHospital && (
                <div className="resq-selected-hospital">

                    <span>
                        SELECTED HOSPITAL
                    </span>

                    <strong>
                        {selectedHospital.name}
                    </strong>

                    {selectedHospital.address && (
                        <p>
                            {selectedHospital.address}
                        </p>
                    )}

                </div>
            )}

        </div>
    );
}

export default ResqLiveMap;