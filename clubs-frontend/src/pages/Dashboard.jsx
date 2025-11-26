import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClub } from "../contexts/ClubContext";
import { authAPI, clubAPI, eventAPI } from "../services/api";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

function Dashboard() {
  const { user, login } = useAuth();
  const {
    selectedClub,
    myClubs,
    fetchMyClubs,
    loading: clubsLoading,
  } = useClub();
  const [userData, setUserData] = useState(null);
  const [clubData, setClubData] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authAPI.me();
        setUserData(response.data);
        login(localStorage.getItem("token"), response.data);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchMyClubs();
  }, []);

  useEffect(() => {
    const fetchClubDetails = async () => {
      if (!selectedClub) return;

      try {
        const [clubResponse, membersResponse, eventsResponse] =
          await Promise.all([
            clubAPI.get(selectedClub.uid),
            clubAPI.getMembers(selectedClub.uid),
            eventAPI.getClubEvents(selectedClub.uid),
          ]);

        setClubData(clubResponse.data);
        setMembers(membersResponse.data);
        setEvents(eventsResponse.data);
      } catch (err) {
        console.error("Failed to fetch club details:", err);
      }
    };

    fetchClubDetails();
  }, [selectedClub]);

  if (loading || clubsLoading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!selectedClub || myClubs.length === 0) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="content-wrapper">
          <div className="no-clubs-banner">
            <div className="banner-icon">⚠️</div>
            <div className="banner-content">
              <h3>No Clubs Yet</h3>
              <p>
                Create a club to get started, or wait to be added as an
                executive to an existing club.
              </p>
              <Link to="/clubs/create" className="btn-primary-banner">
                Create Your First Club
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const execMembers = members.filter((m) => m.type === "exec");
  const generalMembers = members.filter((m) => m.type === "member");

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        {/* Club Info Card */}
        <div className="club-info-card surface">
          <div className="club-header">
            <div className="club-logo-placeholder">
              {/* <span>🏢</span> */}
              <svg
                width="50"
                height="50"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 14.984375 3 C 14.724601304025722 3.00414216643598 14.476635044366056 3.1092126713679304 14.292969 3.2929688 L 10.292969 7.2929688 C 10.10543266010477 7.480480474124582 10.000051125055938 7.7348010103704565 10 8 L 10 10 L 3 10 C 2.448 11 2 11.448 2 12 L 2 15 L 2 25 C 2.000055217905349 25.55226187620846 2.4477381237915408 25.99994478209465 3 26 L 11 26 L 19 26 L 27 26 C 27.55226187620846 25.99994478209465 27.99994478209465 25.55226187620846 28 25 L 28 13 L 28 12 C 28 11.448 27.552 11 27 10 L 20 10 L 20 8 C 19.99994887494406 7.734801010370456 19.89456733989523 7.480480474124581 19.707031 7.2929688 L 15.707031 3.2929688 C 15.5157077434134 3.101557031777612 15.254977804666554 2.9958556506519636 14.984375 3 z M 15 5.4140625 L 18 8.4140625 L 18 13 L 18 24 L 16 24 L 16 23 C 16 22.448 15.552 22 15 22 C 14.448 22 14 22.448 14 23 L 14 24 L 12 24 L 12 13 L 12 8.4140625 L 15 5.4140625 z M 15 9 C 14.447715250169207 9 14 9.447715250169207 14 10 C 14 10.552284749830793 14.447715250169207 11 15 11 C 15.552284749830793 11 16 10.552284749830793 16 10 C 16 9.447715250169207 15.552284749830793 9 15 9 z M 15 13 C 14.448 13 14 13.448 14 14 L 14 19 C 14 19.552 14.448 20 15 20 C 15.552 20 16 19.552 16 19 L 16 14 C 16 13.448 15.552 13 15 13 z M 4 15 L 10 15 L 10 24 L 8 24 L 8 23 C 8 22.448 7.552 22 7 22 C 6.448 22 6 22.448 6 23 L 6 24 L 4 24 L 4 15 z M 20 15 L 26 15 L 26 24 L 24 24 L 24 23 C 24 22.448 23.552 22 23 22 C 22.448 22 22 22.448 22 23 L 22 24 L 20 24 L 20 15 z M 7 17 C 6.448 17 6 17.448 6 18 L 6 19 C 6 19.552 6.448 20 7 20 C 7.552 20 8 19.552 8 19 L 8 18 C 8 17.448 7.552 17 7 17 z M 23 17 C 22.448 17 22 17.448 22 18 L 22 19 C 22 19.552 22.448 20 23 20 C 23.552 20 24 19.552 24 19 L 24 18 C 24 17.448 23.552 17 23 17 z"
                  transform="matrix(0.77 0 0 0.77 12 12) translate(-15, -14.5)"
                  fill="white"
                />
              </svg>
            </div>
            <div className="club-header-content">
              <h1 className="club-name">
                {clubData?.name || selectedClub.name}
              </h1>
              <div className="club-stats">
                <div className="stat-item">
                  <span className="stat-icon">👥</span>
                  <span className="stat-value">{generalMembers.length}</span>
                  <span className="stat-label">Members</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-value">{execMembers.length}</span>
                  <span className="stat-label">Executives</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">📅</span>
                  <span className="stat-value">{events.length}</span>
                  <span className="stat-label">Events</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">💰</span>
                  <span className="stat-value">
                    ${parseFloat(clubData?.budget).toFixed(2) || "0.00"}
                  </span>
                  <span className="stat-label">Budget</span>
                </div>
              </div>
            </div>
          </div>

          {clubData?.social_links && (
            <div className="club-socials">
              <h3>Connect With Us</h3>
              <div className="social-links">
                {Object.entries(clubData.social_links).map(
                  ([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      <span className="social-icon">
                        {getSocialIcon(platform)}
                      </span>
                      <span className="social-platform">{platform}</span>
                    </a>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Events Section */}
        <div className="events-section">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <Link to="/events" className="view-all-link">
              View All →
            </Link>
          </div>

          <div className="events-grid">
            {events.map((event) => (
              <div key={event.uid} className="event-card surface">
                <div className="event-banner-placeholder">
                  <span>🎉</span>
                </div>
                <div className="event-content">
                  <h3 className="event-name">{event.name}</h3>
                  <div className="event-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span>
                        {new Date(event.start_datetime).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>{event.location}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👥</span>
                      <span>{event.participant_count} participants</span>
                    </div>
                  </div>
                  <p className="event-description">
                    {event.description?.split(" ").slice(0, 25).join(" ")}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for social icons
function getSocialIcon(platform) {
  const icons = {
    instagram: "📷",
    twitter: "🐦",
    facebook: "📘",
    linkedin: "💼",
    discord: "💬",
    github: "⚙️",
    website: "🌐",
  };
  return icons[platform.toLowerCase()] || "🔗";
}

export default Dashboard;
