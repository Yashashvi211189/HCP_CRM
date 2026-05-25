import "./App.css";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import AdminDashboard from "./components/AdminDashboard";
import AIChatPanel from "./components/AIChatPanel";
import DiscoveryPage from "./components/DiscoveryPage";
import HCPSelectionModal from "./components/HCPSelectionModal";
import HealthRecordsPage from "./components/HealthRecordsPage";
import HealthcareOverview from "./components/HealthcareOverview";
import LoginPage from "./components/LoginPage";
import LogInteractionForm from "./components/LogInteractionForm";
import ProtectedRoute from "./components/ProtectedRoute";
import store from "./store";
import { trackActivity } from "./hooks/api";

const readSelectedHcp = () => {
  try {
    return JSON.parse(sessionStorage.getItem("selected_hcp_context"));
  } catch (error) {
    return null;
  }
};

function AuthenticatedCRM({ onLogout }) {
  const [activePage, setActivePage] = useState("home");
  const [selectedHcp, setSelectedHcp] = useState(readSelectedHcp);
  const [showHcpModal, setShowHcpModal] = useState(() => !readSelectedHcp());

  const navigate = (page) => setActivePage(page);

  const handleHcpContinue = (hcp) => {
    setSelectedHcp(hcp);
    setShowHcpModal(false);
  };

  const handleHcpCancel = () => {
    setShowHcpModal(false);
  };

  return (
    <>
      <div className="top-bar">
        <div className="brand-lockup">
          <span className="brand-mark">HC</span>
          <div>
            <span className="brand-title">HealthConnect</span>
            <span className="brand-subtitle">Healthcare discovery platform</span>
          </div>
        </div>
        <nav className="main-nav" aria-label="Primary">
          {[
            ["home", "Home"],
            ["doctors", "Find Doctors"],
            ["clinics", "Clinics"],
            ["hospitals", "Hospitals"],
            ["appointments", "Appointments"],
            ["assistant", "AI Assistant"],
            ["records", "Health Records"],
          ].map(([page, label]) => (
            <button className={activePage === page ? "active" : ""} type="button" key={page} onClick={() => navigate(page)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={() => setShowHcpModal(true)}>
            {selectedHcp?.name || "Select Provider"}
          </button>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {activePage === "home" && (
        <HealthcareOverview selectedHcp={selectedHcp} onStartInteraction={() => navigate("appointments")} onNavigate={navigate} />
      )}
      {activePage === "doctors" && <DiscoveryPage type="doctors" />}
      {activePage === "clinics" && <DiscoveryPage type="clinics" />}
      {activePage === "hospitals" && <DiscoveryPage type="hospitals" />}
      {activePage === "records" && <HealthRecordsPage />}
      {(activePage === "appointments" || activePage === "assistant") && (
        <main className={`app-shell tab-view ${activePage === "assistant" ? "assistant-only" : ""}`}>
          {activePage === "appointments" && <LogInteractionForm selectedHcp={selectedHcp} />}
          <AIChatPanel selectedHcp={selectedHcp} />
        </main>
      )}

      {showHcpModal && <HCPSelectionModal onCancel={handleHcpCancel} onContinue={handleHcpContinue} />}
    </>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem("hcp_crm_token"));
  const [adminToken, setAdminToken] = useState(localStorage.getItem("hcp_admin_token"));

  useEffect(() => {
    if (token) {
      trackActivity("page_visit", "/crm").catch(() => {});
    }
  }, [token]);

  const logout = () => {
    localStorage.removeItem("hcp_crm_token");
    localStorage.removeItem("hcp_admin_token");
    localStorage.removeItem("hcp_crm_user");
    sessionStorage.removeItem("selected_hcp_context");
    setToken(null);
    setAdminToken(null);
  };

  return (
    <Provider store={store}>
      {adminToken ? (
        <AdminDashboard onLogout={logout} />
      ) : (
        <ProtectedRoute token={token} fallback={<LoginPage onLogin={setToken} onAdminLogin={setAdminToken} />}>
          <AuthenticatedCRM onLogout={logout} />
        </ProtectedRoute>
      )}
    </Provider>
  );
}

export default App;
