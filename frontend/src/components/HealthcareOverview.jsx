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
  return (
    <section className="overview-page">
      <div className="overview-hero">
        <div>
          <p className="eyebrow">Your healthcare dashboard</p>
          <h1>Find Trusted Doctors Near You</h1>
          <p>
            Discover verified doctors, clinics, hospitals, and healthcare specialists across India. Compare ratings,
            availability, and instantly book appointments with AI-assisted recommendations.
          </p>
          <div className="overview-actions">
            <button type="button" onClick={() => onNavigate("doctors")}>Find Doctors</button>
            <button className="secondary-button" type="button" onClick={onStartInteraction}>Book Appointment</button>
            <button className="secondary-button" type="button" onClick={() => onNavigate("clinics")}>View Nearby Clinics</button>
          </div>
        </div>
        <div className="overview-profile-card">
          <span>Your Healthcare Dashboard</span>
          <strong>{selectedHcp?.name || "Healthcare profile"}</strong>
          <p>Current Location: Bengaluru, India</p>
          <small>Nearest Hospital: Apollo Hospital | Upcoming Appointment: Today 4:00 PM | Health Status: Stable</small>
        </div>
      </div>

      <div className="overview-info-card">
        <div>
          <p className="eyebrow">Healthcare discovery</p>
          <h2>Find care faster</h2>
        </div>
        <p>
          This platform helps people discover healthcare professionals, clinics, and hospitals nearby. It combines
          provider search, appointment management, AI-assisted recommendations, directions, and health records while
          preserving the existing appointment logging engine behind the scenes.
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
              <span>✓</span>
              {reason}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HealthcareOverview;
