import "./Feedback.css";
import { useState } from "react";
import { saveFeedback } from "../../APICalls";

export default function Feedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);

  const pageUrl = window.location.href;

  const sendFeedback = async () => {
    const res = await saveFeedback(comment, pageUrl);

    if (res.success) {
      setSuccess(true);
      setComment("");
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    }
  };

  return (
    <div style={{ margin: "17px" }}>
      {!isOpen && (
        <div
          style={{ color: "#d0d9ff", fontSize: "14px", textDecoration: "underline", cursor: "pointer" }}
          onClick={() => setIsOpen(true)}
        >
          Send a feedback
        </div>
      )}

      {isOpen && (
        <div id="feedback-selector-modal">
          <div id="feedback-selector-content">
            {success ? (
              <div>Thanks for your feedback !</div>
            ) : (
              <>
                <textarea
                  placeholder="Your feedback ..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={4000}
                />
                <div className="feedback-selector-actions">
                  <button onClick={() => setIsOpen(false)}>Cancel</button>
                  <button onClick={sendFeedback} disabled={!comment}>
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
