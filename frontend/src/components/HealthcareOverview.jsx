import { useEffect, useMemo, useState } from "react";

import GoogleMapPanel from "./GoogleMapPanel";

const capabilityCards = [
  ["Find Doctors", "Discover verified specialists by city, speciality, rating, and distance.", "FD"],
  ["Nearby Clinics", "Compare clinics, availability, photos, directions, and contact details.", "NC"],
  ["Hospitals", "Locate hospitals, emergency services, and consultation options near you.", "HP"],
  ["Appointments", "Schedule visits, view previous appointments, and manage follow-ups.", "AP"],
  ["AI Assistant", "Get specialist suggestions, reminders, provider recommendations, and visit guidance.", "AI"],
  ["Health Records", "Organize prescriptions, lab reports, notes, and medical documents.", "HR"],
];

const stats = [
  ["2500+", "Verified Providers"],
  ["120+", "Nearby Clinics"],
  ["40%", "Faster Booking"],
  ["24/7", "AI Health Guidance"],
];

const workflow = ["Find Provider", "Compare Options", "Book Appointment", "Visit Doctor", "Capture Notes", "Track Records"];

const reasons = [
  "Nearby doctors and hospitals",
  "Faster appointment booking",
  "Better visit follow-up management",
  "AI-assisted provider recommendations",
  "Health records in one place",
  "Directions and contact support",
];

function HealthcareOverview({ selectedHcp, onStartInteraction, onNavigate }) {
  const [locationStatus, setLocationStatus] = useState("Requesting location permission...");
  const [coordinates, setCoordinates] = useState(null);
  const homePlaces = useMemo(() => [
    { id: "home-1", name: "Apollo Hospital", latitude: coordinates?.latitude || 28.6139, longitude: coordinates?.longitude || 77.209 },
    { id: "home-2", name: "CityCare Medical Clinic", latitude: coordinates ? Number(coordinates.latitude) + 0.01 : 28.6239, longitude: coordinates ? Number(coordinates.longitude) + 0.01 : 77.219 },
    { id: "home-3", name: "Dr. Smith Clinic", latitude: coordinates ? Number(coordinates.latitude) - 0.01 : 28.6039, longitude: coordinates ? Number(coordinates.longitude) - 0.01 : 77.199 },
  ], [coordinates]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude.toFixed(4),
          longitude: position.coords.longitude.toFixed(4),
        });
        setLocationStatus("Location enabled");
      },
      () => {
        setLocationStatus("Manual city search available");
      },
      { timeout: 5000 }
    );
  }, []);

  return (
    <section className="overview-page">
      <div className="overview-hero">
        <div>
          <p className="eyebrow">Your healthcare dashboard</p>
          <h1>Find Trusted Healthcare Providers Near You</h1>
          <p>
            Search doctors, clinics, and hospitals near your location, manage appointments, and receive AI-powered
            healthcare assistance from a single platform.
          </p>
          <div className="overview-actions">
            <button type="button" onClick={() => onNavigate("doctors")}>Find Doctors</button>
            <button className="secondary-button" type="button" onClick={onStartInteraction}>Book Appointment</button>
            <button className="secondary-button" type="button" onClick={() => onNavigate("hospitals")}>Nearby Hospitals</button>
          </div>
        </div>
        <div className="overview-profile-card">
          <span>Your Healthcare Dashboard</span>
          <strong>{selectedHcp?.name || "Healthcare profile"}</strong>
          <p>Current Location: {coordinates ? `${coordinates.latitude}, ${coordinates.longitude}` : locationStatus}</p>
          <small>Nearest Hospital: Apollo Hospital | Upcoming Appointment: Today 4:00 PM | Health Status: Stable</small>
        </div>
      </div>

      <div className="home-map-card">
        <div>
          <p className="eyebrow">Nearby care map</p>
          <h2>Doctors, clinics, and hospitals around you</h2>
          <p>Location powers nearby discovery. If browser permission is blocked, use city or specialty search from the discovery pages.</p>
        </div>
        <GoogleMapPanel places={homePlaces} location={coordinates} compact />
      </div>

      <div className="overview-info-card">
        <div>
          <p className="eyebrow">Healthcare discovery</p>
          <h2>Find care faster</h2>
        </div>
        <p>
          This platform helps people discover healthcare professionals, clinics, and hospitals nearby. It combines
          provider search, appointment management, AI-assisted recommendations, directions, and health records while
          preserving the existing HCP CRM interaction logging engine behind the scenes.
        </p>
      </div>

      <div className="overview-section">
        <div className="section-heading">
          <p className="eyebrow">Capabilities</p>
          <h2>Key Capabilities</h2>
        </div>
        <div className="capability-grid">
          {capabilityCards.map(([title, description, icon]) => (
            <article className="capability-card" key={title}>
              <span>{icon}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(([value, label]) => (
          <div className="stat-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="overview-section">
        <div className="section-heading">
          <p className="eyebrow">Workflow</p>
          <h2>Workflow Overview</h2>
        </div>
        <div className="workflow-timeline">
          {workflow.map((step, index) => (
            <div className="workflow-step" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="overview-section">
        <div className="section-heading">
          <p className="eyebrow">Why teams use this platform</p>
          <h2>Built for healthcare engagement teams</h2>
        </div>
        <div className="reason-grid">
          {reasons.map((reason) => (
            <div className="reason-card" key={reason}>
              <span>OK</span>
              {reason}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HealthcareOverview;
