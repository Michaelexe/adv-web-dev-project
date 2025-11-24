import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { clubAPI } from "../services/api";
import Navbar from "../components/Navbar";
import "./ClubManagement.css";

function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [clubUid, setClubUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchClub = async () => {
    if (!clubUid.trim()) return;
    setError("");
    setLoading(true);

    try {
      const response = await clubAPI.get(clubUid);
      setSelectedClub(response.data);

      // Fetch members
      const membersResponse = await clubAPI.getMembers(clubUid);
      setMembers(membersResponse.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to fetch club");
      setSelectedClub(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="page-header">
          <h1>Club Management</h1>
          <Link to="/clubs/create" className="btn-primary">
            + Create New Club
          </Link>
        </div>

        <div className="search-section">
          <h2>View Club Details</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Enter Club UID"
              value={clubUid}
              onChange={(e) => setClubUid(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchClub()}
            />
            <button
              onClick={fetchClub}
              className="btn-search"
              disabled={loading}
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        {selectedClub && (
          <div className="club-details">
            <div className="details-header">
              <h2>{selectedClub.name}</h2>
              <Link
                to={`/clubs/${selectedClub.uid}/edit`}
                className="btn-secondary"
              >
                Edit Club
              </Link>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">UID:</span>
                <span className="detail-value">{selectedClub.uid}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Budget:</span>
                <span className="detail-value">${selectedClub.budget}</span>
              </div>
              {selectedClub.social_links && (
                <div className="detail-item full-width">
                  <span className="detail-label">Social Links:</span>
                  <span className="detail-value">
                    {JSON.stringify(selectedClub.social_links, null, 2)}
                  </span>
                </div>
              )}
            </div>

            <div className="members-section">
              <h3>Members ({members.length})</h3>
              <div className="members-list">
                {members.map((member, idx) => (
                  <div key={idx} className="member-card">
                    <div className="member-info">
                      <span className="member-name">
                        {member.name || "Unknown"}
                      </span>
                      <span className="member-uid">{member.user_uid}</span>
                    </div>
                    <div className="member-badges">
                      <span
                        className={`badge ${
                          member.type === "exec" ? "badge-exec" : "badge-member"
                        }`}
                      >
                        {member.type}
                      </span>
                      {member.role && (
                        <span className="badge badge-role">{member.role}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClubManagement;
