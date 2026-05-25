const capabilityCards = [
  ["Interaction Tracking", "Record meetings, calls, events, and engagement history.", "IT"],
  ["AI Assistant", "Generate summaries, recommendations, follow-up actions, and insights.", "AI"],
  ["HCP Profiles", "Maintain comprehensive physician and healthcare professional records.", "HP"],
  ["Compliance Management", "Support documentation, audit readiness, and regulated workflows.", "CM"],
  ["Analytics & Reporting", "Track engagement performance and field activity trends.", "AR"],
  ["Collaboration", "Enable coordination across medical, commercial, and field teams.", "CO"],
];

const stats = [
  ["2500+", "Managed HCP Profiles"],
  ["95%", "Interaction Capture Rate"],
  ["40%", "Faster Documentation"],
  ["24/7", "AI Assistance"],
];

const workflow = ["Identify HCP", "Schedule Interaction", "Conduct Meeting", "Capture Discussion", "AI Generates Insights", "Save To CRM"];

const reasons = [
  "Centralized HCP information",
  "Faster field reporting",
  "Better follow-up management",
  "Improved engagement visibility",
  "AI-assisted documentation",
  "Scalable healthcare operations",
];

function HealthcareOverview({ selectedHcp, onStartInteraction }) {
  return (
    <section className="overview-page">
      <div className="overview-hero">
        <div>
          <p className="eyebrow">Healthcare CRM platform</p>
          <h1>Healthcare Provider Relationship Management</h1>
          <p>
            Centralize healthcare professional engagement, interaction tracking, compliance management, and AI-assisted
            insights within a single intelligent workspace.
          </p>
          <div className="overview-actions">
            <button type="button" onClick={onStartInteraction}>Start Interaction</button>
            <button className="secondary-button" type="button" onClick={onStartInteraction}>View HCP Directory</button>
          </div>
        </div>
        <div className="overview-profile-card">
          <span>Current HCP workspace</span>
          <strong>{selectedHcp?.name || "No HCP selected"}</strong>
          <p>{selectedHcp?.specialty || "Specialty not selected"}</p>
          <small>{selectedHcp?.organization || "Organization not available"}</small>
        </div>
      </div>

      <div className="overview-info-card">
        <div>
          <p className="eyebrow">What is HCP CRM?</p>
          <h2>What is an HCP CRM?</h2>
        </div>
        <p>
          An HCP CRM platform helps pharmaceutical, biotechnology, medical device, and healthcare organizations manage
          relationships with healthcare professionals. It centralizes provider information, tracks interactions, improves
          collaboration, supports compliance requirements, and enables more personalized engagement.
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
