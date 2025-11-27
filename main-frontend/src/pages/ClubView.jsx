import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { clubAPI, eventAPI } from "../services/api";
import Navbar from "../components/Navbar";
import "./ClubView.css";

function ClubView() {
  const { clubUid } = useParams();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetchClubData();
  }, [clubUid]);

  const fetchClubData = async () => {
    try {
      const [clubResponse, membersResponse, eventsResponse] = await Promise.all(
        [
          clubAPI.get(clubUid),
          clubAPI.getMembers(clubUid),
          eventAPI.getClubEvents(clubUid),
        ]
      );

      setClub(clubResponse.data);
      setMembers(membersResponse.data || []);
      setEvents(eventsResponse.data || []);
    } catch (err) {
      console.error("Failed to fetch club data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await clubAPI.join(clubUid);
      setJoined(true);
      // Refresh members list
      const membersResponse = await clubAPI.getMembers(clubUid);
      setMembers(membersResponse.data || []);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to join club");
    } finally {
      setJoining(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "TBD";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading">Loading club...</div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="error-state">Club not found</div>
      </div>
    );
  }

  const execMembers = members.filter((m) => m.type === "exec");
  const generalMembers = members.filter((m) => m.type === "member");

  return (
    <div className="page-container">
      <Navbar />
      {/* Club banners are not used — banners are only for events. */}
      <div className="club-view-container">
        <div className="club-header-section">
          <div className="club-info-card">
            <div className="club-title-row">
              {club.icon_url && (
                <img
                  src={club.icon_url}
                  alt="club icon"
                  className="club-icon-img"
                />
              )}
              <h1>{club.name}</h1>
              <span className="club-status-badge">
                {club.status || "Active"}
              </span>
            </div>
            {club.description && (
              <p className="club-description">{club.description}</p>
            )}

            <div className="club-stats">
              <div className="stat-item">
                <span className="stat-value">{members.length}</span>
                <span className="stat-label">Members</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{execMembers.length}</span>
                <span className="stat-label">Executives</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{events.length}</span>
                <span className="stat-label">Events</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">${club.budget || 0}</span>
                <span className="stat-label">Budget</span>
              </div>
            </div>

            {club.social_links && Object.keys(club.social_links).length > 0 && (
              <div className="social-links">
                <h3>Connect With Us</h3>
                <div className="social-buttons">
                  {Object.entries(club.social_links).map(([platform, link]) => (
                    <a
                      key={platform}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      🔗 {platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining || joined}
              className="btn-join-club"
            >
              {joined ? "✓ Joined" : joining ? "Joining..." : "Join as Member"}
            </button>
          </div>
          <div className="members-section">
            <h2>Club Members</h2>
            <div className="members-list">
              {execMembers.length > 0 && (
                <div className="member-group">
                  <h3>Executives</h3>
                  {execMembers.map((member) => (
                    <div key={member.user_uid} className="member-item">
                      <span className="member-name">{member.user_name}</span>
                      {member.role && (
                        <span className="member-role">{member.role}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {generalMembers.length > 0 && (
                <div className="member-group">
                  <h3>General Members</h3>
                  {generalMembers.map((member) => (
                    <div key={member.user_uid} className="member-item">
                      <span className="member-name">{member.user_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="club-content">
          <div className="events-section">
            <h2>Upcoming Events</h2>
            {events.length === 0 ? (
              <div className="empty-state">No events scheduled</div>
            ) : (
              <div className="events-grid">
                {events.map((event) => {
                  const isUpcoming = event.status === "upcoming";
                  if (isUpcoming) {
                    return (
                      <Link
                        key={event.uid}
                        to={`/event/${event.uid}`}
                        className="event-card"
                      >
                        <div className="event-card-header">
                          <h3>{event.name}</h3>
                          <span
                            className={`status-badge status-${event.status}`}
                          >
                            {event.status}
                          </span>
                        </div>
                        <div className="event-card-body">
                          <p className="event-info">
                            📅 {formatDateTime(event.start_datetime)}
                          </p>
                          <p className="event-info">
                            📍 {event.location || "Location TBD"}
                          </p>
                          <p className="event-info">
                            👥 {event.participant_count} participants
                          </p>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <div key={event.uid} className="event-card disabled">
                      <div className="event-card-header">
                        <h3>{event.name}</h3>
                        <span className={`status-badge status-${event.status}`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="event-card-body">
                        <p className="event-info">
                          📅 {formatDateTime(event.start_datetime)}
                        </p>
                        <p className="event-info">
                          📍 {event.location || "Location TBD"}
                        </p>
                        <p className="event-info">
                          👥 {event.participant_count} participants
                        </p>
                      </div>
                      <div className="status-overlay">{event.status}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClubView;
