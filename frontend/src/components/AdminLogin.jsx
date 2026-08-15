import { useState } from "react";

function AdminLogin({ onLogin, onBack }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const ADMIN_PASSWORD = "admin123";

  const handleLogin = (event) => {
    event.preventDefault();

    if (password === ADMIN_PASSWORD) {
      setError("");
      onLogin();
    } else {
      setError("Incorrect admin password.");
      setPassword("");
    }
  };

  return (
    <div className="admin-login-page">

      <div className="admin-login-card">

        <div className="admin-login-icon">
          🔐
        </div>

        <p className="small-title">
          CAMPUSFIND
        </p>

        <h1>
          Admin Login
        </h1>

        <p className="admin-login-subtitle">
          Enter the administrator password to
          access the dashboard.
        </p>

        <form onSubmit={handleLogin}>

          <div className="form-group">

            <label>
              Admin Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              placeholder="Enter password"
              required
            />

          </div>

          {error && (
            <div className="admin-login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-btn"
          >
            Login
          </button>

        </form>

        <button
          className="admin-back-btn"
          onClick={onBack}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default AdminLogin;