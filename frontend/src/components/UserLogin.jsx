import { useState } from "react";

import { sendOtp } from "../hooks/api";

function UserLogin({ onOtpSent }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    try {
      const response = await sendOtp(name, email);
      onOtpSent(email, response.data.otp || "12345");
    } catch (err) {
      setError("Could not send OTP");
    }
  };

  return (
    <div className="auth-form">
      <label>
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Email
        <input value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      {error && <div className="auth-error">{error}</div>}
      <button type="button" onClick={handleSubmit}>
        Send OTP
      </button>
      <div className="otp-hint">Temporary OTP: 12345</div>
    </div>
  );
}

export default UserLogin;
