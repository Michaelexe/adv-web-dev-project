import React, { useState } from "react";
import { Link } from "react-router-dom";
import { eventAPI } from "../services/api";
import Navbar from "../components/Navbar";
import "./EventManagement.css";

function EventManagement() {
  const [eventUid, setEventUid] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchEvent = async () => {
    if (!eventUid.trim()) return;
    setError("");
    setLoading(true);

    try {
      const response = await eventAPI.get(eventUid);
      setSelectedEvent(response.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to fetch event");
      setSelectedEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="page-header">
          <h1>Event Management</h1>
          <Link to="/events/create" className="btn-primary">
            + Create New Event
          </Link>
        </div>

        <div className="search-section">
          <h2>View Event Details</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Enter Event UID"
              value={eventUid}
              onChange={(e) => setEventUid(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && fetchEvent()}
            />
            <button
              onClick={fetchEvent}
              className="btn-search"
              disabled={loading}
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        {selectedEvent && (
          <div className="event-details">
            <div className="details-header">
              <div>
                <h2>{selectedEvent.name}</h2>
                <span className={`status-badge status-${selectedEvent.status}`}>
                  {selectedEvent.status}
                </span>
              </div>
              <Link
                to={`/events/${selectedEvent.uid}/edit`}
                className="btn-secondary"
              >
                Edit Event
              </Link>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Event UID</span>
                <span className="detail-value">{selectedEvent.uid}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Type</span>
                <span className="detail-value">{selectedEvent.type}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Start Time</span>
                <span className="detail-value">
                  {formatDateTime(selectedEvent.start_datetime)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">End Time</span>
                <span className="detail-value">
                  {formatDateTime(selectedEvent.end_datetime)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">
                  {selectedEvent.location || "Not specified"}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Participant Limit</span>
                <span className="detail-value">
                  {selectedEvent.limit || "No limit"}
                </span>
              </div>

              {selectedEvent.club_uid && (
                <div className="detail-item">
                  <span className="detail-label">Club UID</span>
                  <span className="detail-value">{selectedEvent.club_uid}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="detail-item full-width">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">
                    {selectedEvent.description}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventManagement;
