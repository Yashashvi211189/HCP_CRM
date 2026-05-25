import { useEffect, useState } from "react";

import { getAdminUserActivity, listAdminUsers } from "../hooks/api";

function AdminDashboard({ onLogout }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activity, setActivity] = useState([]);
  const [interactions, setInteractions] = useState([]);

  const loadUsers = async (q = "") => {
    const response = await listAdminUsers(q);
    setUsers(response.data.users);
  };

  const loadActivity = async (user) => {
    setSelected(user);
    const response = await getAdminUserActivity(user.id);
    setActivity(response.data.activity);
    setInteractions(response.data.interactions || []);
  };

  useEffect(() => {
    loadUsers().catch(() => {});
  }, []);

  const activeCount = users.filter((user) => user.active).length;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </header>
      <section className="admin-summary">
        <div>Users: {users.length}</div>
        <div>Active Users: {activeCount}</div>
        <div>Logged Interactions: {interactions.length}</div>
      </section>
      <section className="admin-grid">
        <div className="panel admin-panel">
          <div className="admin-search">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search/filter" />
            <button type="button" onClick={() => loadUsers(query)}>
              Search
            </button>
          </div>
          <div className="user-list">
            {users.map((user) => (
              <button type="button" key={user.id} onClick={() => loadActivity(user)}>
                <span>{user.name}</span>
                <span>{user.email}</span>
                <span>{user.active ? "Active" : ""}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel admin-panel">
          <h2>{selected ? selected.name : "User Activity Timeline"}</h2>
          <div className="admin-section-title">Written Interactions</div>
          <div className="interaction-audit-list">
            {interactions.map((interaction) => (
              <article className="interaction-audit-card" key={interaction.id}>
                <div className="interaction-audit-head">
                  <strong>{interaction.hcp_name || "Unnamed HCP"}</strong>
                  <span>{interaction.interaction_date} {interaction.interaction_time}</span>
                </div>
                <div className="interaction-audit-grid">
                  <span>Type</span>
                  <p>{interaction.interaction_type}</p>
                  <span>Attendees</span>
                  <p>{interaction.attendees}</p>
                  <span>Topics</span>
                  <p>{interaction.topics_discussed}</p>
                  <span>Materials</span>
                  <p>{interaction.materials_shared}</p>
                  <span>Samples</span>
                  <p>{interaction.samples_distributed}</p>
                  <span>Sentiment</span>
                  <p>{interaction.sentiment}</p>
                  <span>Outcomes</span>
                  <p>{interaction.outcomes}</p>
                  <span>Follow-ups</span>
                  <p>{interaction.followup_actions || interaction.ai_suggested_followups}</p>
                  <span>Chat Input</span>
                  <p>{interaction.raw_chat_input}</p>
                </div>
              </article>
            ))}
            {selected && interactions.length === 0 && <div className="empty-state">No interactions logged by this user yet.</div>}
          </div>
          <div className="admin-section-title">Activity Timeline</div>
          <div className="activity-list">
            {activity.map((item) => (
              <div className="activity-row" key={item.id}>
                <strong>{item.action}</strong>
                <span>{item.route}</span>
                <span>{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
