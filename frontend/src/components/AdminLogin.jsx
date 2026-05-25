import { useState } from "react";

import { adminLogin } from "../hooks/api";

function AdminLogin({ onAdminLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    try {
      const response = await adminLogin(password);
      localStorage.removeItem("hcp_crm_token");
      localStorage.removeItem("hcp_crm_user");
      localStorage.setItem("hcp_admin_token", response.data.token);
      onAdminLogin(response.data.token);
    } catch (err) {
      setError("Invalid admin password");
    }
  };

  return (
    <div className="auth-form">
      <label>
        Admin Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {error && <div className="auth-error">{error}</div>}
      <button type="button" onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}

export default AdminLogin;
