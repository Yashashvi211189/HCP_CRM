import { useState } from "react";

import { verifyOtp } from "../hooks/api";

function OTPVerify({ email, visibleOtp, onLogin }) {
  const [otp, setOtp] = useState("12345");
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setError("");
    try {
      const response = await verifyOtp(email, otp);
      localStorage.setItem("hcp_crm_token", response.data.token);
      localStorage.setItem("hcp_crm_user", JSON.stringify(response.data.user));
      onLogin(response.data.token);
    } catch (err) {
      setError("Invalid or expired OTP");
    }
  };

  return (
    <div className="auth-form">
      <label>
        OTP
        <input value={otp} maxLength="6" onChange={(event) => setOtp(event.target.value)} />
      </label>
      {error && <div className="auth-error">{error}</div>}
      <button type="button" onClick={handleVerify}>
        Verify OTP
      </button>
      <div className="otp-hint">Temporary OTP: {visibleOtp || "12345"}</div>
    </div>
  );
}

export default OTPVerify;
