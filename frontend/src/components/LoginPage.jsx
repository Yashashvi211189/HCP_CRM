import { useState } from "react";

import AdminLogin from "./AdminLogin";
import OTPVerify from "./OTPVerify";
import UserLogin from "./UserLogin";

function LoginPage({ onLogin, onAdminLogin }) {
  const [mode, setMode] = useState("user");
  const [pendingOtp, setPendingOtp] = useState(null);

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand">HCP CRM</div>
        <h1>Log HCP Interaction</h1>
        <div className="login-tabs">
          <button type="button" className={mode === "user" ? "active" : ""} onClick={() => setMode("user")}>
            User
          </button>
          <button type="button" className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>
            Admin
          </button>
        </div>
        {mode === "user" && !pendingOtp && <UserLogin onOtpSent={(email, otp) => setPendingOtp({ email, otp })} />}
        {mode === "user" && pendingOtp && <OTPVerify email={pendingOtp.email} visibleOtp={pendingOtp.otp} onLogin={onLogin} />}
        {mode === "admin" && <AdminLogin onAdminLogin={onAdminLogin} />}
      </section>
    </main>
  );
}

export default LoginPage;
