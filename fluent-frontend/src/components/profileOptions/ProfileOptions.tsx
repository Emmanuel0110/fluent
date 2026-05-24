import React, { useState, useEffect } from "react";
import "./ProfileOptions.css";
import { useReviewSettings } from "../../contexts/ReviewSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const ProfileOptions: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useReviewSettings();
  const { user } = useAuth();
  const [reviewMode, setReviewMode] = useState<"auto" | "manual">(settings.reviewMode);
  const [autoReviewDelay, setAutoReviewDelay] = useState<number>(settings.autoReviewDelay);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setReviewMode(settings.reviewMode);
    setAutoReviewDelay(settings.autoReviewDelay);
  }, [settings]);

  const handleSave = async () => {
    updateSettings({ reviewMode, autoReviewDelay });
    setIsOpen(false);
  };

  return (
    <>
      <div id="nameLabel" title={user?.username} onClick={() => setIsOpen(true)} />
      {isOpen && (
        <div id="profile-options-modal">
          <div id="profile-options-content">
            <h3>{t("profile.title")}</h3>

            <div className="profile-field">
              <label>{t("profile.review_display")}</label>
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="reviewMode"
                    value="auto"
                    checked={reviewMode === "auto"}
                    onChange={(e) => setReviewMode(e.target.value as "auto" | "manual")}
                  />
                  {t("profile.auto_after", { seconds: autoReviewDelay })}
                </label>
                <label>
                  <input
                    type="radio"
                    name="reviewMode"
                    value="manual"
                    checked={reviewMode === "manual"}
                    onChange={(e) => setReviewMode(e.target.value as "auto" | "manual")}
                  />
                  {t("profile.manually")}
                </label>
              </div>
            </div>

            {reviewMode === "auto" && (
              <div className="profile-field">
                <label>{t("profile.delay")}</label>
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
              <button onClick={() => setIsOpen(false)}>{t("common.cancel")}</button>
              <button onClick={handleSave}>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileOptions;
