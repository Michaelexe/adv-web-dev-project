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
        const [clubResponse, membersResponse] = await Promise.all([
          clubAPI.get(selectedClub.uid),
          clubAPI.getMembers(selectedClub.uid),
        ]);

        setClubData(clubResponse.data);
        setMembers(membersResponse.data);

        // Mock events for now - you'll need to add an endpoint to get club events
        setEvents([
          {
            uid: "1",
            name: "Annual Tech Conference",
            start_datetime: "2025-12-15T10:00:00",
            location: "Main Auditorium",
            description:
              "Join us for our biggest tech conference of the year featuring keynote speakers, workshops, and networking opportunities with industry leaders.",
            participant_count: 156,
          },
          {
            uid: "2",
            name: "Workshop: Web Development",
            start_datetime: "2025-12-20T14:00:00",
            location: "Computer Lab A",
            description:
              "Learn modern web development with React, Node.js, and best practices for building scalable applications from scratch.",
            participant_count: 45,
          },
          {
            uid: "3",
            name: "Networking Mixer",
            start_datetime: "2025-12-22T18:00:00",
            location: "Student Center",
            description:
              "Connect with fellow club members and industry professionals in a casual networking environment with refreshments provided.",
            participant_count: 89,
          },
        ]);
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
              <span>🏢</span>
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
