import React, { useEffect, useState } from "react";
import { fetchFeedbacks } from "../APICalls";
import "./AdminFeedbacks.css";

interface Feedback {
  _id: string;
  comment: string;
  pageUrl: string;
  userId: string;
  createdAt: string;
}

function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeedbacks = async () => {
      try {
        setLoading(true);
        const data = await fetchFeedbacks();
        if (data && Array.isArray(data)) {
          setFeedbacks(data);
        } else {
          setError("Failed to load feedbacks");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load feedbacks");
      } finally {
        setLoading(false);
      }
    };
    loadFeedbacks();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-feedbacks-loading">
        <p>Loading feedbacks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-feedbacks-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="admin-feedbacks-container">
      <div className="admin-feedbacks-header">
        <h1>User Feedbacks</h1>
        <p className="admin-feedbacks-count">Total: {feedbacks.length}</p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="admin-feedbacks-empty">
          <p>No feedbacks available</p>
        </div>
      ) : (
        <div className="admin-feedbacks-list">
          {feedbacks.map((feedback) => (
            <div key={feedback._id} className="admin-feedback-item">
              <div className="admin-feedback-header">
                <div className="admin-feedback-meta">
                  <span className="admin-feedback-date">{formatDate(feedback.createdAt)}</span>
                  <span className="admin-feedback-user">User ID: {feedback.userId}</span>
                </div>
              </div>
              <div className="admin-feedback-content">
                <div className="admin-feedback-comment">
                  <strong>Comment:</strong>
                  <p>{feedback.comment}</p>
                </div>
                <div className="admin-feedback-url">
                  <strong>Page URL:</strong>
                  <a href={feedback.pageUrl} target="_blank" rel="noopener noreferrer">
                    {feedback.pageUrl}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminFeedbacks;
