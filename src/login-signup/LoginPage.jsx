import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSignup.css";

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Use navigate hook

  const handleSubmit = (e) => {
    e.preventDefault();

    // Hardcoded credentials for testing
    const validEmail = "hupes@hupes.com";
    const validPassword = "hupes123";

    // Check credentials
    if (email === validEmail && password === validPassword) {
      onLogin(); // Call onLogin prop to update authentication state in App.js
      navigate("/"); // Navigate to Dashboard
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="login-container">
      <h2 className="form-title">Log in with</h2>
      <div className="social-login">
        <div className="social-button">
          <img src="google.svg" alt="Google" className="social-icon" />
          Google
        </div>
        <div className="social-button">
          <img src="apple.svg" alt="Apple" className="social-icon" />
          Apple
        </div>
      </div>

      <p className="separator">
        <span>or</span>
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <input
            type="email"
            placeholder="Email address"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <i className="material-icons">mail</i>
        </div>
        <div className="input-wrapper">
          <input
            type="password"
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <i className="material-icons">lock</i>
        </div>

        {error && <p className="error-message">{error}</p>}

        <p className="forgot-password-link">Forgot password?</p>

        <button type="submit" className="login-button">
          Log In
        </button>
      </form>

      <p className="signup-prompt">
        Don&apos;t have an account? <span className="signup-link">Sign up</span>
      </p>
    </div>
  );
};

export default LoginPage;
