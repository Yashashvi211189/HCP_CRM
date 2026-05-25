const recordGroups = [
  ["Prescriptions", "2 active prescriptions", "Upload or review current medications."],
  ["Lab Reports", "4 documents", "Track reports, diagnostics, and test history."],
  ["Previous Appointments", "6 visits", "Review past consultations and follow-up notes."],
  ["Doctor Notes", "3 summaries", "AI-ready visit notes and care instructions."],
];

const timeline = [
  ["Today", "Uploaded blood test report"],
  ["Yesterday", "Appointment summary generated"],
  ["Last week", "Prescription renewed"],
];

function HealthRecordsPage() {
  return (
    <main className="records-page">
      <section className="records-hero">
        <div>
          <p className="eyebrow">Health records</p>
          <h1>Your Medical Documents</h1>
          <p>Organize prescriptions, lab reports, doctor notes, and previous appointments in one secure dashboard.</p>
        </div>
        <button type="button">Upload Document</button>
      </section>

      <div className="records-search">
        <input placeholder="Search prescriptions, reports, notes, or appointments" />
        <button type="button">Search</button>
      </div>

      <section className="records-grid">
        {recordGroups.map(([title, count, description]) => (
          <article className="record-card" key={title}>
            <span>{count}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>

      <section className="timeline-card">
        <div className="section-heading">
          <p className="eyebrow">Timeline</p>
          <h2>Recent Health Activity</h2>
        </div>
        {timeline.map(([date, event]) => (
          <div className="timeline-row" key={event}>
            <span>{date}</span>
            <p>{event}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

export default HealthRecordsPage;
