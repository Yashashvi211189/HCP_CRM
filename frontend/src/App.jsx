import "./App.css";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import AdminDashboard from "./components/AdminDashboard";
import AIChatPanel from "./components/AIChatPanel";
import HCPSelectionModal from "./components/HCPSelectionModal";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedHcp, setSelectedHcp] = useState(readSelectedHcp);
  const [showHcpModal, setShowHcpModal] = useState(() => !readSelectedHcp());

  const selectTab = (tab) => setActiveTab(tab);

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
            <span className="brand-title">HCP CRM</span>
            <span className="brand-subtitle">Interaction intelligence workspace</span>
          </div>
        </div>
        <nav className="main-nav" aria-label="Primary">
          <button type="button">Platform</button>
          <button type="button">Solutions</button>
          <button type="button">Industries</button>
          <button type="button">Resources</button>
        </nav>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={() => setShowHcpModal(true)}>
            {selectedHcp?.name || "Select HCP"}
          </button>
          <button type="button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-tabs" role="tablist" aria-label="CRM dashboard sections">
        <button className={activeTab === "overview" ? "active" : ""} type="button" onClick={() => selectTab("overview")}>
          Overview
        </button>
        <button className={activeTab === "assistant" ? "active" : ""} type="button" onClick={() => selectTab("assistant")}>
          AI Assistant
        </button>
      </div>

      {activeTab === "overview" ? (
        <HealthcareOverview selectedHcp={selectedHcp} onStartInteraction={() => selectTab("assistant")} />
      ) : (
        <main className="app-shell tab-view">
          <LogInteractionForm selectedHcp={selectedHcp} />
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
