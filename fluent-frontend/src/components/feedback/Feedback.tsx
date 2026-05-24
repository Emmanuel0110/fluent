import "./Feedback.css";
import { useState } from "react";
import { saveFeedback } from "../../APICalls";
import { useTranslation } from "react-i18next";

export default function Feedback() {
  const { t } = useTranslation();
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
          {t("feedback.send_link")}
        </div>
      )}

      {isOpen && (
        <div id="feedback-selector-modal">
          <div id="feedback-selector-content">
            {success ? (
              <div>{t("feedback.thanks")}</div>
            ) : (
              <>
                <textarea
                  placeholder={t("feedback.placeholder")}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={4000}
                />
                <div className="feedback-selector-actions">
                  <button onClick={() => setIsOpen(false)}>{t("common.cancel")}</button>
                  <button onClick={sendFeedback} disabled={!comment}>
                    {t("feedback.send")}
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
