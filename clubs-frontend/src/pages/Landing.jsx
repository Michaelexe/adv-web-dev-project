import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-header">
          <div className="logo">🎓</div>
          <h1>Club Executive Portal</h1>
          <p className="tagline">Manage your clubs and events with ease</p>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">🏢</span>
            <h3>Club Management</h3>
            <p>
              Create and manage clubs, track members, and organize your team
            </p>
          </div>
          <div className="feature">
            <span className="feature-icon">📅</span>
            <h3>Event Planning</h3>
            <p>Schedule events, manage attendees, and track participation</p>
          </div>
          <div className="feature">
            <span className="feature-icon">👥</span>
            <h3>Member Coordination</h3>
            <p>Keep your team organized with executive and member roles</p>
          </div>
        </div>

        <div className="cta-buttons">
          <Link to="/login" className="btn-primary-large">
            Login
          </Link>
          <Link to="/register" className="btn-secondary-large">
            Register
          </Link>
        </div>

        <p className="landing-footer">Start managing your clubs today</p>
      </div>
    </div>
  );
}

export default Landing;
