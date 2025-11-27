import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { clubAPI, mediaAPI } from "../services/api";
import Navbar from "../components/Navbar";
import "../pages/CreateClub.css";

function EditClub() {
  const { clubUid } = useParams();
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [iconFile, setIconFile] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const response = await clubAPI.get(clubUid);
        setName(response.data.name);
        setBudget(response.data.budget);
        setIconFile(null);
        setBannerFile(null);
        if (response.data.social_links) {
          setSocialLinks(JSON.stringify(response.data.social_links, null, 2));
        }
      } catch (err) {
        setError("Failed to fetch club details");
      } finally {
        setFetching(false);
      }
    };

    fetchClub();
  }, [clubUid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let parsedLinks = null;
      if (socialLinks.trim()) {
        try {
          parsedLinks = JSON.parse(socialLinks);
        } catch (err) {
          setError("Invalid JSON format for social links");
          setLoading(false);
          return;
        }
      }

      const data = {
        name,
        budget: parseFloat(budget) || 0,
        social_links: parsedLinks,
      };

      // upload any new files (icons use 'logo' preset)
      if (iconFile) {
        const up = await mediaAPI.upload(iconFile, "logo");
        data.icon_url = up.data.url;
      }

      await clubAPI.update(clubUid, data);
      navigate("/clubs");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to update club");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading">Loading club details...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="form-container">
          <h1>Edit Club</h1>
          <p className="form-subtitle">
            Update club information (executives only)
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Club Name *</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Chess Club"
              />
            </div>

            <div className="form-group">
              <label htmlFor="budget">Budget</label>
              <input
                type="number"
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label htmlFor="socialLinks">Social Media Links (JSON)</label>
              <textarea
                id="socialLinks"
                value={socialLinks}
                onChange={(e) => setSocialLinks(e.target.value)}
                placeholder='{"twitter": "https://twitter.com/club", "instagram": "https://instagram.com/club"}'
                rows="4"
              />
              <span className="form-hint">
                Optional: Enter valid JSON format
              </span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate("/clubs")}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Updating..." : "Update Club"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditClub;
