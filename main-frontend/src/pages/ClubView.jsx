import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { clubAPI, eventAPI } from "../services/api";
import Navbar from "../components/Navbar";
import "./ClubView.css";

function ClubView() {
  const { clubUid } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

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
      const membersData = membersResponse.data || [];
      setMembers(membersData);
      setEvents(eventsResponse.data || []);

      // Check if current user is a member
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      const currentUserUid = userData.uid;
      console.log("Current user UID:", currentUserUid);
      console.log("Members:", membersData);
      const userIsMember = membersData.some(
        (member) => member.user_uid === currentUserUid
      );
      console.log("Is member:", userIsMember);
      setIsMember(userIsMember);
    } catch (err) {
      console.error("Failed to fetch club data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    setJoining(true);
    try {
      if (isMember) {
        await clubAPI.leave(clubUid);
        setIsMember(false);
      } else {
        await clubAPI.join(clubUid);
        setIsMember(true);
      }
      // Refresh members list
      const membersResponse = await clubAPI.getMembers(clubUid);
      setMembers(membersResponse.data || []);
    } catch (err) {
      alert(
        err.response?.data?.msg ||
          `Failed to ${isMember ? "leave" : "join"} club`
      );
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
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Back
        </button>
        <div className="club-header-section">
          <div className="club-info-card">
            <div className="club-info-header">
              <div className="club-header-left">
                {club.icon_url ? (
                  <img
                    src={club.icon_url}
                    alt="club icon"
                    className="club-icon-img"
                  />
                ) : (
                  <div className="club-icon-placeholder">
                    {club.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h1>{club.name}</h1>
              </div>
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
              onClick={handleJoinLeave}
              disabled={joining}
              className={`btn-join-club ${isMember ? "joined" : ""}`}
            >
              {isMember
                ? "✓ Joined as Member"
                : joining
                ? "Joining..."
                : "Join as Member"}
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
                  const isAttending = event.is_attending;

                  if (isUpcoming) {
                    return (
                      <Link
                        key={event.uid}
                        to={`/event/${event.uid}`}
                        className="event-card"
                      >
                        <div className="event-card-header">
                          <h3>{event.name}</h3>
                          <div className="status-badges">
                            <span
                              className={`status-badge status-${event.status}`}
                            >
                              {event.status}
                            </span>
                            {isAttending && (
                              <span className="status-badge status-attending">
                                Attending
                              </span>
                            )}
                          </div>
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
                        <div className="status-badges">
                          <span
                            className={`status-badge status-${event.status}`}
                          >
                            {event.status}
                          </span>
                          {isAttending && (
                            <span className="status-badge status-attending">
                              Attending
                            </span>
                          )}
                        </div>
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
                      {/* <div className="status-overlay">{event.status}</div> */}
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
