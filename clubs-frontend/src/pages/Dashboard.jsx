import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useClub } from "../contexts/ClubContext";
import { authAPI, clubAPI, eventAPI } from "../services/api";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

// Charts (requires `chart.js` and `react-chartjs-2`)
import { Line, Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";

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
  const [stats, setStats] = useState(null);
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
        const [clubResponse, membersResponse, eventsResponse, statsResponse] =
          await Promise.all([
            clubAPI.get(selectedClub.uid),
            clubAPI.getMembers(selectedClub.uid),
            eventAPI.getClubEvents(selectedClub.uid),
            clubAPI.getStats(selectedClub.uid),
          ]);

        setClubData(clubResponse.data);
        setMembers(membersResponse.data);
        setEvents(eventsResponse.data);
        console.log(eventsResponse.data);

        setStats(statsResponse.data);
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

  // Prepare chart data if stats available
  const membersGrowthData = stats
    ? {
        labels: stats.members_by_day.map((d) => d.date),
        datasets: [
          {
            label: "New Members",
            data: stats.members_by_day.map((d) => d.count),
            borderColor: "#00a1ff",
            backgroundColor: "rgba(0,161,255,0.15)",
            fill: true,
          },
        ],
      }
    : null;

  const attendanceData = stats
    ? {
        labels: stats.attendance_by_event.map((e) => e.name),
        datasets: [
          {
            label: "Participants",
            data: stats.attendance_by_event.map((e) => e.count),
            backgroundColor: "#00a1ff",
          },
        ],
      }
    : null;

  const eventTypeData = stats
    ? {
        labels: Object.keys(stats.event_type_counts),
        datasets: [
          {
            data: Object.values(stats.event_type_counts),
            backgroundColor: ["#00a1ff", "#0066cc", "#99ddff"],
          },
        ],
      }
    : null;

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="grid content-wrapper">
        <div className="content-container">
          {/* Charts placed in main content */}
          {stats && (
            <div className="club-charts">
              <div className="chart-row">
                <div className="chart-card surface">
                  <h4>Members (last 30 days)</h4>
                  {membersGrowthData ? (
                    <Line data={membersGrowthData} />
                  ) : (
                    <div>Loading chart...</div>
                  )}
                </div>
                <div className="chart-card surface">
                  <h4>Attendance (recent events)</h4>
                  {attendanceData ? <Bar data={attendanceData} /> : <div />}
                </div>

                {/* <div className="chart-card surface">
                  <h4>Event Types</h4>
                  {eventTypeData ? <Pie data={eventTypeData} /> : <div />}
                </div> */}
              </div>
            </div>
          )}
          <div className="events-section">
            <div className="section-header">
              <h2>Upcoming Events</h2>
              <Link to="/events" className="view-all-link">
                View All →
              </Link>
            </div>

            <div className="events-grid">
              {events.length === 0 ? (
                <div className="no-events-placeholder surface">
                  <h3>No Upcoming Events</h3>
                  <p style={{ color: "var(--muted)", marginTop: 8 }}>
                    There are no upcoming events for this club. You can create a
                    new event or check past events.
                  </p>
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <Link to="/events/create" className="btn-primary">
                      Create Event
                    </Link>
                  </div>
                </div>
              ) : (
                events.map((event) => {
                  return (
                    <div key={event.uid} className={`event-card surface ${""}`}>
                      <div
                        className="event-banner-placeholder"
                        style={
                          event.banner_url
                            ? {
                                backgroundImage: `url(${event.banner_url})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : {}
                        }
                      >
                        {!event.banner_url && <span>🎉</span>}
                      </div>
                      <div className="event-content">
                        <h3 className="event-name">{event.name}</h3>
                        <div className="event-meta">
                          <div className="meta-item">
                            <span className="meta-icon">📅</span>
                            <span>
                              {new Date(
                                event.start_datetime
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
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
                          {event.description?.split(" ").slice(0, 25).join(" ")}
                          ...
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {/* Club Info Card */}
        <div className="club-info-card surface">
          <div className="club-header">
            <div className="club-logo-placeholder">
              {clubData?.icon_url ? (
                <img
                  src={clubData.icon_url}
                  alt="club icon"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    objectFit: "cover",
                  }}
                />
              ) : (
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
              )}
            </div>
            <div className="club-header-content">
              <h1 className="club-name">
                {clubData?.name || selectedClub.name}
              </h1>
              <div className="club-stats">
                <div className="stat-item">
                  <span className="stat-value">{generalMembers.length}</span>
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
            </div>
          </div>

          {clubData?.social_links && (
            <div className="club-socials">
              {clubData.social_links.Instagram && (
                <a
                  href={clubData.social_links.Instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                        fill="currentColor"
                      ></path>{" "}
                      <path
                        d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z"
                        fill="currentColor"
                      ></path>{" "}
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z"
                        fill="currentColor"
                      ></path>{" "}
                    </g>
                  </svg>
                </a>
              )}
              {clubData.social_links.Discord && (
                <a
                  href={clubData.social_links.Discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <svg
                    viewBox="0 0 192 192"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="12"
                        d="m68 138-8 16c-10.19-4.246-20.742-8.492-31.96-15.8-3.912-2.549-6.284-6.88-6.378-11.548-.488-23.964 5.134-48.056 19.369-73.528 1.863-3.334 4.967-5.778 8.567-7.056C58.186 43.02 64.016 40.664 74 39l6 11s6-2 16-2 16 2 16 2l6-11c9.984 1.664 15.814 4.02 24.402 7.068 3.6 1.278 6.704 3.722 8.567 7.056 14.235 25.472 19.857 49.564 19.37 73.528-.095 4.668-2.467 8.999-6.379 11.548-11.218 7.308-21.769 11.554-31.96 15.8l-8-16m-68-8s20 10 40 10 40-10 40-10"
                      ></path>
                      <ellipse
                        cx="71"
                        cy="101"
                        fill="currentColor"
                        rx="13"
                        ry="15"
                      ></ellipse>
                      <ellipse
                        cx="121"
                        cy="101"
                        fill="currentColor"
                        rx="13"
                        ry="15"
                      ></ellipse>
                    </g>
                  </svg>
                </a>
              )}
              {clubData.social_links.Linkedin && (
                <a
                  href={clubData.social_links.Linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g
                      id="SVGRepo_tracerCarrier"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                      {" "}
                      <path
                        d="M6.5 8C7.32843 8 8 7.32843 8 6.5C8 5.67157 7.32843 5 6.5 5C5.67157 5 5 5.67157 5 6.5C5 7.32843 5.67157 8 6.5 8Z"
                        fill="currentColor"
                      ></path>{" "}
                      <path
                        d="M5 10C5 9.44772 5.44772 9 6 9H7C7.55228 9 8 9.44771 8 10V18C8 18.5523 7.55228 19 7 19H6C5.44772 19 5 18.5523 5 18V10Z"
                        fill="currentColor"
                      ></path>{" "}
                      <path
                        d="M11 19H12C12.5523 19 13 18.5523 13 18V13.5C13 12 16 11 16 13V18.0004C16 18.5527 16.4477 19 17 19H18C18.5523 19 19 18.5523 19 18V12C19 10 17.5 9 15.5 9C13.5 9 13 10.5 13 10.5V10C13 9.44771 12.5523 9 12 9H11C10.4477 9 10 9.44772 10 10V18C10 18.5523 10.4477 19 11 19Z"
                        fill="currentColor"
                      ></path>{" "}
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M20 1C21.6569 1 23 2.34315 23 4V20C23 21.6569 21.6569 23 20 23H4C2.34315 23 1 21.6569 1 20V4C1 2.34315 2.34315 1 4 1H20ZM20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20Z"
                        fill="currentColor"
                      ></path>{" "}
                    </g>
                  </svg>
                </a>
              )}
              {/* {Object.entries(clubData.social_links).map(
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
                )} */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
