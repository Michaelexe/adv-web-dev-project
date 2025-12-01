import React, { useState, useEffect } from "react";
import { useTheme, PALETTES } from "../contexts/ThemeContext";
import { useClub } from "../contexts/ClubContext";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { clubAPI } from "../services/api";
import "./Settings.css";

const LABELS = {
  system: "System",
  dark: "Dark",
  light: "Light",
  ocean: "Ocean",
  sunset: "Sunset",
  "cherry-blossom": "Cherry Blossom",
};

export default function Settings() {
  const { palette, setPalette } = useTheme();
  const { selectedClub } = useClub();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newExecEmail, setNewExecEmail] = useState("");
  const [newExecRole, setNewExecRole] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (selectedClub) {
      fetchMembers();
    }
  }, [selectedClub]);

  const fetchMembers = async () => {
    try {
      const response = await clubAPI.getMembers(selectedClub.uid);
      setMembers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExec = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!newExecEmail.trim()) {
      alert("Email address is required");
      return;
    }

    if (!newExecRole.trim()) {
      alert("Role is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newExecEmail.trim())) {
      alert("Please enter a valid email address");
      return;
    }

    setAdding(true);
    try {
      await clubAPI.addExec(selectedClub.uid, {
        email: newExecEmail.trim(),
        role: newExecRole.trim(),
      });
      alert("Executive added successfully");
      setNewExecEmail("");
      setNewExecRole("");
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to add executive");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveExec = async (userUid) => {
    if (!confirm("Are you sure you want to remove this executive?")) return;

    try {
      await clubAPI.removeExec(selectedClub.uid, userUid);
      alert("Executive removed successfully");
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to remove executive");
    }
  };

  const execs = members.filter((m) => m.type === "exec");
  const founder = execs.find((m) => m.role === "founder");

  // Check if current user is founder or president
  const currentUserExec = execs.find((m) => m.user_uid === user?.uid);
  const canManageExecs =
    currentUserExec &&
    (currentUserExec.role === "founder" ||
      currentUserExec.role.toLowerCase() === "president");

  return (
    <div className="page-container">
      <Navbar />
      <div className="settings-container">
        <section className="settings-section">
          <h2>Appearance</h2>
          <p>Choose a color palette for the app.</p>
          <div className="palette-grid">
            {PALETTES.map((p) => (
              <button
                key={p}
                onClick={() => setPalette(p)}
                className={`palette-button ${palette === p ? "active" : ""}`}
              >
                <div className="palette-name">{LABELS[p]}</div>
                <div className="palette-id">{p}</div>
              </button>
            ))}
          </div>
        </section>

        {selectedClub && (
          <section className="settings-section">
            <h2>Club Management</h2>

            <div className="club-management-content">
              <div className="management-left">
                <div className="add-exec-section">
                  <h3>Add Executive</h3>
                  <form onSubmit={handleAddExec} className="add-exec-form">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={newExecEmail}
                      onChange={(e) => setNewExecEmail(e.target.value)}
                      className="input-exec-email"
                      required
                      disabled={!canManageExecs}
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g., President, Treasurer)"
                      value={newExecRole}
                      onChange={(e) => setNewExecRole(e.target.value)}
                      className="input-exec-role"
                      required
                      disabled={!canManageExecs}
                    />
                    <button
                      type="submit"
                      disabled={adding || !canManageExecs}
                      className="btn-add-exec"
                    >
                      {adding ? "Adding..." : "Add Executive"}
                    </button>
                  </form>
                  {!canManageExecs && (
                    <p className="permission-notice">
                      Only the founder and president can add executives.
                    </p>
                  )}
                </div>
              </div>

              <div className="management-right">
                {founder && (
                  <div className="founder-section">
                    <h3>Founder</h3>
                    <div className="exec-item founder-item">
                      <div className="exec-info">
                        <span className="exec-name">{founder.user_name}</span>
                        <span className="exec-role">Founder</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="execs-section">
                  <h3>Executives</h3>
                  {loading ? (
                    <p>Loading...</p>
                  ) : (
                    <>
                      {execs.filter((e) => e.role !== "founder").length ===
                      0 ? (
                        <p className="empty-state">No other executives</p>
                      ) : (
                        <div className="execs-list">
                          {execs
                            .filter((e) => e.role !== "founder")
                            .map((exec) => (
                              <div key={exec.user_uid} className="exec-item">
                                <div className="exec-info">
                                  <span className="exec-name">
                                    {exec.user_name}
                                  </span>
                                  <span className="exec-role">{exec.role}</span>
                                </div>
                                {canManageExecs && (
                                  <button
                                    onClick={() =>
                                      handleRemoveExec(exec.user_uid)
                                    }
                                    className="btn-remove-exec"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
