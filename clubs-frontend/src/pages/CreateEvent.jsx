import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { eventAPI, mediaAPI } from "../services/api";
import { useClub } from "../contexts/ClubContext";
import Navbar from "../components/Navbar";
import "./CreateEvent.css";

// Dummy heatmap data - showing class density by day/time
const generateDummyHeatmapData = () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const timeSlots = [];

  // Generate time slots from 8 AM to 8 PM
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push({
      time: `${hour}:00`,
      display: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "PM" : "AM"}`,
    });
  }

  // Generate random density data
  const data = {};
  days.forEach((day) => {
    data[day] = {};
    timeSlots.forEach((slot) => {
      // Random student count between 0-500
      data[day][slot.time] = Math.floor(Math.random() * 500);
    });
  });

  return { days, timeSlots, data };
};

function CreateEvent() {
  const [name, setName] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [limit, setLimit] = useState("");
  const [type, setType] = useState("in-person");
  const [status, setStatus] = useState("scheduled");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [heatmapData, setHeatmapData] = useState(generateDummyHeatmapData());
  const navigate = useNavigate();
  const { selectedClub } = useClub();

  // Calculate color intensity based on student count
  const getHeatmapColor = (count) => {
    if (count === 0) return "rgba(0, 161, 255, 0.05)";
    if (count < 100) return "rgba(0, 161, 255, 0.2)";
    if (count < 200) return "rgba(0, 161, 255, 0.4)";
    if (count < 300) return "rgba(0, 161, 255, 0.6)";
    if (count < 400) return "rgba(0, 161, 255, 0.8)";
    return "rgba(0, 161, 255, 1)";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = {
        name,
        start_datetime: startDateTime,
        end_datetime: endDateTime || null,
        description: description || null,
        location: location || null,
        limit: limit ? parseInt(limit) : null,
        type,
        status,
        club_uid: selectedClub?.uid || null,
      };

      // Event only uses a banner; upload with 'banner' preset
      if (bannerFile) {
        const up = await mediaAPI.upload(bannerFile, "banner");
        data.banner_url = up.data.url;
      }

      const response = await eventAPI.create(data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="split-layout">
          {/* Left: Event Form */}
          <div className="form-section">
            <div className="form-container">
              <h1>Create New Event</h1>
              <p className="form-subtitle">
                {selectedClub
                  ? `Creating event for ${selectedClub.name}`
                  : "Create a standalone event"}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Event Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g., Annual Tech Conference"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="type">Event Type *</label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required
                    >
                      <option value="in-person">In Person</option>
                      <option value="online">Online</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDateTime">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="startDateTime"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endDateTime">End Date & Time</label>
                    <input
                      type="datetime-local"
                      id="endDateTime"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Building A, Room 101"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="limit">Participant Limit</label>
                  <input
                    type="number"
                    id="limit"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    min="1"
                    placeholder="Leave empty for no limit"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your event..."
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label>Event Banner</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files[0])}
                  />
                  <span className="form-hint">
                    Wide banner recommended (1200x400)
                  </span>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => navigate("/events")}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Calendar Heatmap */}
          <div className="heatmap-section">
            <div className="heatmap-container">
              <h2>Student Activity Heatmap</h2>
              <p className="heatmap-subtitle">
                Choose times with lower activity for better attendance
              </p>

              <div className="heatmap-legend">
                <span>Low Activity</span>
                <div className="legend-gradient"></div>
                <span>High Activity</span>
              </div>

              <div className="heatmap-grid">
                {/* Time labels column */}
                <div className="time-labels">
                  <div className="corner-cell"></div>
                  {heatmapData.timeSlots.map((slot) => (
                    <div key={slot.time} className="time-label">
                      {slot.display}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {heatmapData.days.map((day) => (
                  <div key={day} className="day-column">
                    <div className="day-header">{day}</div>
                    {heatmapData.timeSlots.map((slot) => {
                      const count = heatmapData.data[day][slot.time];
                      return (
                        <div
                          key={`${day}-${slot.time}`}
                          className="heatmap-cell"
                          style={{ backgroundColor: getHeatmapColor(count) }}
                          title={`${day} ${slot.display}: ${count} students in classes`}
                        >
                          {count > 300 && (
                            <span className="cell-count">{count}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="heatmap-note">
                💡 Tip: Schedule events during lighter colored time slots for
                better availability
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateEvent;
