import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSignup.css";

const SignupPage = ({ onSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();


    // Basic validation
    if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
    }

    // Additional validation for email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        setError("Please enter a valid email address.");
        return;
    }

    setLoading(true); // Set loading state

    try {
        const response = await fetch('http://localhost:5000/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to sign up');
        }

        const data = await response.json();
        console.log(data.message); // Handle success message
        onSignup(); // Call onSignup prop to update authentication state in App.js
        navigate("/"); // Navigate to Dashboard
    } catch (error) {
        setError(error.message); // Set error message to display
    } finally {
        setLoading(false); // Reset loading state
    }
};

  return (
    <div className="login-container">
      <h2 className="form-title">Sign up with</h2>
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
        <div className="input-wrapper">
          <input
            type="password"
            placeholder="Confirm Password"
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <i className="material-icons">lock</i>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="login-button" style={{ marginTop: "10px" }} disabled={loading}>
          {loading ? "Signing Up..." : "Sign Up"}
        </button>

        <p className="signup-prompt" style={{ marginTop: "5px", textAlign: "center" }}>
          Already have an account?{" "}
          <span
            className="signup-link"
            onClick={() => navigate("/login")}
            style={{ cursor: "pointer", color: "#6870fa" }}
          >
            Log in
          </span>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;