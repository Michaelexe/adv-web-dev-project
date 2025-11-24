import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { eventAPI } from "../services/api";
import Navbar from "../components/Navbar";
import "../pages/CreateEvent.css";

function EditEvent() {
  const { eventUid } = useParams();
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
  const [fetching, setFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await eventAPI.get(eventUid);
        const event = response.data;
        setName(event.name);
        setStartDateTime(
          event.start_datetime ? event.start_datetime.slice(0, 16) : ""
        );
        setEndDateTime(
          event.end_datetime ? event.end_datetime.slice(0, 16) : ""
        );
        setDescription(event.description || "");
        setLocation(event.location || "");
        setLimit(event.limit || "");
        setType(event.type);
        setStatus(event.status);
      } catch (err) {
        setError("Failed to fetch event details");
      } finally {
        setFetching(false);
      }
    };

    fetchEvent();
  }, [eventUid]);

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
      };

      await eventAPI.update(eventUid, data);
      navigate("/events");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading">Loading event details...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="form-container">
          <h1>Edit Event</h1>
          <p className="form-subtitle">
            Update event information (executives only)
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

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate("/events")}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Updating..." : "Update Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditEvent;
