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
          style={{ color: "#d0d9ff", fontSize: "17px", textDecoration: "underline" }}
          onClick={() => setIsOpen(true)}
        >
          Send a feedback
        </div>
      )}

      {isOpen && (
        <div
          style={{
            background: "white",
            padding: 15,
            borderRadius: 8,
            boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
            width: "100%",
          }}
        >
          {success ? (
            <div>Thanks for your feedback !</div>
          ) : (
            <>
              <textarea
                placeholder="Your feedback ..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                style={{ width: "100%" }}
              />
              <div className="language-selector-actions">
                <button onClick={() => setIsOpen(false)}>Cancel</button>
                <button onClick={sendFeedback} disabled={!comment}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
