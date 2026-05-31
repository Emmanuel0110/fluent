import React, { useState, useEffect } from "react";
import "./ProfileOptions.css";
import { useReviewSettings } from "../../contexts/ReviewSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import { updateEmail } from "../../auth/authActions";
import { ApiError } from "../../utils/http-helpers";

const ProfileOptions: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useReviewSettings();
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tempTheme, setTempTheme] = useState<"light" | "dark">(theme);
  const [reviewMode, setReviewMode] = useState<"auto" | "manual">(settings.reviewMode);
  const [autoReviewDelay, setAutoReviewDelay] = useState<number>(settings.autoReviewDelay);
  const [isOpen, setIsOpen] = useState(false);
  const [tempEmail, setTempEmail] = useState(user?.email ?? "");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    setReviewMode(settings.reviewMode);
    setAutoReviewDelay(settings.autoReviewDelay);
  }, [settings]);

  const handleOpen = () => {
    setTempTheme(theme);
    setReviewMode(settings.reviewMode);
    setAutoReviewDelay(settings.autoReviewDelay);
    setTempEmail(user?.email ?? "");
    setEmailError("");
    setIsOpen(true);
  };

  const handleSave = async () => {
    setTheme(tempTheme);
    updateSettings({ reviewMode, autoReviewDelay });

    const normalizedEmail = tempEmail.trim().toLowerCase();
    if (normalizedEmail !== (user?.email ?? "")) {
      try {
        const saved = await updateEmail(normalizedEmail);
        setUser({ ...user!, email: saved });
      } catch (err) {
        setEmailError(err instanceof ApiError ? err.userMessage : String(err));
        return;
      }
    }
    setIsOpen(false);
  };

  return (
    <>
      <div id="nameLabel" title={user?.username} onClick={handleOpen} />
      {isOpen && (
        <div id="profile-options-modal" onClick={() => setIsOpen(false)}>
          <div id="profile-options-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t("profile.title")}</h3>

            <div className="profile-field theme-field">
              <label htmlFor="theme-toggle">{t("profile.dark_mode")}</label>
              <label className="theme-toggle-switch">
                <input
                  type="checkbox"
                  id="theme-toggle"
                  checked={tempTheme === "dark"}
                  onChange={(e) => setTempTheme(e.target.checked ? "dark" : "light")}
                />
                <span className="theme-toggle-track" />
              </label>
            </div>

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

            <div className="profile-field">
              <label htmlFor="profile-email">{t("profile.email")}</label>
              <input
                id="profile-email"
                type="email"
                value={tempEmail}
                onChange={(e) => { setTempEmail(e.target.value); setEmailError(""); }}
                className="delay-input"
                style={{ width: "100%" }}
              />
              {emailError && <p className="profile-email-error">{emailError}</p>}
            </div>

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
