import React, { useState, useEffect } from "react";
import "./ProfileOptions.css";
import { useReviewSettings } from "../../contexts/ReviewSettingsContext";
import { useAuth } from "../../contexts/AuthContext";

const ProfileOptions: React.FC = () => {
  const { settings, updateSettings } = useReviewSettings();
  const { user } = useAuth();
  const [reviewMode, setReviewMode] = useState<"auto" | "manual">(settings.mode);
  const [autoReviewDelay, setAutoReviewDelay] = useState<number>(settings.autoDelay);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setReviewMode(settings.mode);
    setAutoReviewDelay(settings.autoDelay);
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      mode: reviewMode,
      autoDelay: autoReviewDelay,
    });
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  return (
    <>
      <div id="nameLabel" title={user?.username} onClick={handleOpen} />
      {isOpen && (
        <div id="profile-options-modal">
          <div id="profile-options-content">
            <h3>Profile Options</h3>

            <div className="profile-field">
              <label>Review Answer Display:</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="reviewMode"
                    value="auto"
                    checked={reviewMode === "auto"}
                    onChange={(e) => setReviewMode(e.target.value as "auto" | "manual")}
                  />
                  Automatically after {autoReviewDelay} seconds
                </label>
                <label>
                  <input
                    type="radio"
                    name="reviewMode"
                    value="manual"
                    checked={reviewMode === "manual"}
                    onChange={(e) => setReviewMode(e.target.value as "auto" | "manual")}
                  />
                  Manually (click to reveal)
                </label>
              </div>
            </div>

            {reviewMode === "auto" && (
              <div className="profile-field">
                <label>Delay (seconds):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={autoReviewDelay}
                  onChange={(e) => setAutoReviewDelay(parseInt(e.target.value) || 10)}
                  className="delay-input"
                />
              </div>
            )}

            <div className="profile-options-actions">
              <button onClick={() => setIsOpen(false)}>Cancel</button>
              <button onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileOptions;
