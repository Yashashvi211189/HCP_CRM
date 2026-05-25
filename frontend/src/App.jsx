import "./App.css";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";

import AdminDashboard from "./components/AdminDashboard";
import AIChatPanel from "./components/AIChatPanel";
import LoginPage from "./components/LoginPage";
import LogInteractionForm from "./components/LogInteractionForm";
import ProtectedRoute from "./components/ProtectedRoute";
import store from "./store";
import { trackActivity } from "./hooks/api";

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
    setToken(null);
    setAdminToken(null);
  };

  return (
    <Provider store={store}>
      {adminToken ? (
        <AdminDashboard onLogout={logout} />
      ) : (
        <ProtectedRoute token={token} fallback={<LoginPage onLogin={setToken} onAdminLogin={setAdminToken} />}>
          <div className="top-bar">
            <div className="brand-lockup">
              <span className="brand-mark">HC</span>
              <div>
                <span className="brand-title">HCP CRM</span>
                <span className="brand-subtitle">Interaction intelligence workspace</span>
              </div>
            </div>
            <button type="button" onClick={logout}>
              Logout
            </button>
          </div>
          <main className="app-shell">
            <LogInteractionForm />
            <AIChatPanel />
          </main>
        </ProtectedRoute>
      )}
    </Provider>
  );
}

export default App;
