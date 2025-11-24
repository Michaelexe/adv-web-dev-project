import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClub } from "../contexts/ClubContext";
import "./ClubRequired.css";

function ClubRequired({ children }) {
  const { myClubs, loading, fetchMyClubs } = useClub();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyClubs();
  }, []);

  useEffect(() => {
    if (!loading && myClubs.length === 0) {
      // Navigate to create club page if user has no clubs
      navigate("/clubs/create", { replace: true });
    }
  }, [loading, myClubs, navigate]);

  if (loading) {
    return (
      <div className="club-required-loading">
        <div className="loading-spinner"></div>
        <p>Loading your clubs...</p>
      </div>
    );
  }

  if (myClubs.length === 0) {
    return null; // Will redirect in useEffect
  }

  return children;
}

export default ClubRequired;
