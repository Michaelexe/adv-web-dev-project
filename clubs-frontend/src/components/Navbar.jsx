import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClub } from "../contexts/ClubContext";
import "./Navbar.css";

function Navbar() {
  const { logout } = useAuth();
  const { selectedClub, myClubs, selectClub, loading } = useClub();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleClubSelect = (club) => {
    selectClub(club);
    setDropdownOpen(false);
  };

  return (
    <nav className="navbar-login">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          S.A.G.E. <span style={{ color: "white" }}>Executives Portal</span>
        </Link>

        <div className="navbar-center">
          <div className="club-selector" ref={dropdownRef}>
            <button
              className="club-selector-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={loading}
            >
              <span className="club-name">
                {loading
                  ? "Loading..."
                  : selectedClub
                  ? selectedClub.name
                  : "No Club Selected"}
              </span>
              <span className="dropdown-arrow">{dropdownOpen ? "▲" : "▼"}</span>
            </button>

            {dropdownOpen && (
              <div className="club-dropdown">
                {myClubs.length === 0 ? (
                  <div className="dropdown-empty">
                    <p>No clubs yet</p>
                    <Link
                      to="/clubs/create"
                      className="dropdown-create-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Create a club
                    </Link>
                  </div>
                ) : (
                  <>
                    {myClubs.map((club) => (
                      <button
                        key={club.uid}
                        className={`dropdown-item ${
                          selectedClub?.uid === club.uid ? "active" : ""
                        }`}
                        onClick={() => handleClubSelect(club)}
                      >
                        <div className="dropdown-item-content">
                          <span className="dropdown-club-name">
                            {club.name}
                          </span>
                          {club.role && (
                            <span className="dropdown-club-role">
                              {club.role}
                            </span>
                          )}
                        </div>
                        {selectedClub?.uid === club.uid && (
                          <span className="checkmark">✓</span>
                        )}
                      </button>
                    ))}
                    <div className="dropdown-divider"></div>
                    <Link
                      to="/clubs/create"
                      className="dropdown-create-link"
                      onClick={() => setDropdownOpen(false)}
                    >
                      + Create New Club
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/clubs" className="nav-link">
            Clubs
          </Link>
          <Link to="/events" className="nav-link">
            Events
          </Link>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
