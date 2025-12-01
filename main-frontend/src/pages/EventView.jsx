import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { eventAPI, commentAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import "./EventView.css";

function EventView() {
  const { eventUid } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, [eventUid]);

  const fetchEventData = async () => {
    try {
      const [eventResponse, commentsResponse] = await Promise.all([
        eventAPI.get(eventUid),
        commentAPI.getEventComments(eventUid),
      ]);
      setEvent(eventResponse.data);
      setComments(commentsResponse.data || []);
    } catch (err) {
      console.error("Failed to fetch event data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    setJoining(true);
    try {
      if (event.is_attending) {
        await eventAPI.leave(eventUid);
      } else {
        await eventAPI.join(eventUid);
      }
      // Refresh event data to get updated is_attending status
      const eventResponse = await eventAPI.get(eventUid);
      setEvent(eventResponse.data);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to update event registration");
    } finally {
      setJoining(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await commentAPI.create({
        event_uid: eventUid,
        content: newComment,
      });
      setComments([response.data, ...comments]);
      setNewComment("");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (commentUid) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await commentAPI.reply(commentUid, {
        content: replyContent,
      });

      // Update the comments tree with the new reply
      const updateReplies = (commentsList) => {
        return commentsList.map((comment) => {
          if (comment.uid === commentUid) {
            return {
              ...comment,
              replies: [...comment.replies, response.data],
            };
          }
          if (comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateReplies(comment.replies),
            };
          }
          return comment;
        });
      };

      setComments(updateReplies(comments));
      setReplyContent("");
      setReplyTo(null);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return "TBD";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
  };

  const formatCommentTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const CommentItem = ({ comment, depth = 0 }) => (
    <div className="comment-item" style={{ marginLeft: depth * 32 }}>
      <div className="comment-header">
        <span className="comment-author">{comment.user_name}</span>
        <span className="comment-time">
          {formatCommentTime(comment.created_at)}
        </span>
      </div>
      <p className="comment-content">{comment.content}</p>
      {user && (
        <button className="btn-reply" onClick={() => setReplyTo(comment.uid)}>
          💬 Reply
        </button>
      )}

      {replyTo === comment.uid && (
        <div className="reply-form">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            rows="2"
          />
          <div className="reply-actions">
            <button
              onClick={() => handleSubmitReply(comment.uid)}
              disabled={submitting || !replyContent.trim()}
              className="btn-submit-reply"
            >
              {submitting ? "Posting..." : "Post Reply"}
            </button>
            <button
              onClick={() => {
                setReplyTo(null);
                setReplyContent("");
              }}
              className="btn-cancel-reply"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.uid} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="loading">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="error-state">Event not found</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="event-view-container">
        {event.banner_url && (
          <div
            className="event-banner"
            style={{
              backgroundImage: `url(${event.banner_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <div className="event-details-section">
          <div className="event-header">
            <div className="event-title-section">
              <h1>{event.name}</h1>
              <span className={`status-badge status-${event.status}`}>
                {event.status}
              </span>
            </div>

            {user &&
              (() => {
                const isUpcoming = event.status === "upcoming";
                const disabled = joining || !isUpcoming;
                const label = event.is_attending
                  ? "✓ Registered"
                  : joining
                  ? "Joining..."
                  : !isUpcoming
                  ? "Registration closed"
                  : "Join Event";

                return (
                  <button
                    onClick={handleJoinLeave}
                    disabled={disabled}
                    className={`btn-join-event ${
                      event.is_attending ? "joined" : ""
                    }`}
                    title={
                      !isUpcoming
                        ? "Sign-ups are only open for upcoming events"
                        : ""
                    }
                  >
                    {label}
                  </button>
                );
              })()}
          </div>

          <div className="event-info-grid">
            <div className="info-card">
              <div className="info-icon">📅</div>
              <div>
                <div className="info-label">Start Time</div>
                <div className="info-value">
                  {formatDateTime(event.start_datetime)}
                </div>
              </div>
            </div>

            {event.end_datetime && (
              <div className="info-card">
                <div className="info-icon">🕐</div>
                <div>
                  <div className="info-label">End Time</div>
                  <div className="info-value">
                    {formatDateTime(event.end_datetime)}
                  </div>
                </div>
              </div>
            )}

            <div className="info-card">
              <div className="info-icon">📍</div>
              <div>
                <div className="info-label">Location</div>
                <div className="info-value">{event.location || "TBD"}</div>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">👥</div>
              <div>
                <div className="info-label">Type</div>
                <div className="info-value">{event.type}</div>
              </div>
            </div>

            {event.limit && (
              <div className="info-card">
                <div className="info-icon">🎯</div>
                <div>
                  <div className="info-label">Capacity</div>
                  <div className="info-value">{event.limit} people</div>
                </div>
              </div>
            )}
          </div>

          {event.description && (
            <div className="event-description-section">
              <h2>About This Event</h2>
              <p>{event.description}</p>
            </div>
          )}
        </div>

        <div className="comments-section">
          <h2>Discussion ({comments.length})</h2>

          {user ? (
            <form onSubmit={handleSubmitComment} className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this event..."
                rows="3"
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="btn-submit-comment"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </form>
          ) : (
            <div className="login-prompt">
              Please log in to join the discussion
            </div>
          )}

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="empty-comments">
                No comments yet. Be the first to share your thoughts!
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem key={comment.uid} comment={comment} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventView;
