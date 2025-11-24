import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clubAPI } from "../services/api";
import { useClub } from "../contexts/ClubContext";
import Navbar from "../components/Navbar";
import "./CreateClub.css";

function CreateClub() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [socialLinks, setSocialLinks] = useState([{ key: "", value: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { fetchMyClubs } = useClub();
  const navigate = useNavigate();

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { key: "", value: "" }]);
  };

  const removeSocialLink = (index) => {
    const newLinks = socialLinks.filter((_, i) => i !== index);
    setSocialLinks(newLinks.length === 0 ? [{ key: "", value: "" }] : newLinks);
  };

  const updateSocialLink = (index, field, value) => {
    const newLinks = [...socialLinks];
    newLinks[index][field] = value;
    setSocialLinks(newLinks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Convert social links array to object
      const socialLinksObj = socialLinks.reduce((acc, link) => {
        if (link.key.trim() && link.value.trim()) {
          acc[link.key.trim()] = link.value.trim();
        }
        return acc;
      }, {});

      const data = {
        name,
        description: description.trim() || null,
        social_links:
          Object.keys(socialLinksObj).length > 0 ? socialLinksObj : null,
      };

      const response = await clubAPI.create(data);
      // Refresh clubs list
      await fetchMyClubs();
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to create club");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper">
        <div className="form-container">
          <h1>Create New Club</h1>
          <p className="form-subtitle">
            You will be set as an executive with founder role
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
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your club's mission and activities..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Social Media Links</label>
              <div className="social-links-container">
                {socialLinks.map((link, index) => (
                  <div key={index} className="social-link-row">
                    <input
                      type="text"
                      value={link.key}
                      onChange={(e) =>
                        updateSocialLink(index, "key", e.target.value)
                      }
                      placeholder="Platform (e.g., instagram)"
                      className="social-key-input"
                    />
                    <input
                      type="url"
                      value={link.value}
                      onChange={(e) =>
                        updateSocialLink(index, "value", e.target.value)
                      }
                      placeholder="https://..."
                      className="social-value-input"
                    />
                    <button
                      type="button"
                      onClick={() => removeSocialLink(index)}
                      className="btn-remove"
                      title="Remove link"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSocialLink}
                  className="btn-add-link"
                >
                  + Add Social Link
                </button>
              </div>
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
                {loading ? "Creating..." : "Create Club"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateClub;
