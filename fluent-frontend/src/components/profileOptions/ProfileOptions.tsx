import React, { useState, useEffect } from "react";
import "./ProfileOptions.css";
import { useReviewSettings } from "../../contexts/ReviewSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import { updateEmail, deleteAccount, exportUserData } from "../../auth/authActions";
import { ApiError } from "../../utils/http-helpers";

const ProfileOptions: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useReviewSettings();
  const { user, setUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tempTheme, setTempTheme] = useState<"light" | "dark">(theme);
  const [reviewMode, setReviewMode] = useState<"auto" | "manual">(settings.reviewMode);
  const [autoReviewDelay, setAutoReviewDelay] = useState<number>(settings.autoReviewDelay);
  const [isOpen, setIsOpen] = useState(false);
  const [tempEmail, setTempEmail] = useState(user?.email ?? "");
  const [emailError, setEmailError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

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
    setShowDeleteConfirm(false);
    setDeletePassword("");
    setDeleteError("");
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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportUserData();
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteAccount(user?.oauthProvider ? undefined : deletePassword);
      logout();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.userMessage : String(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletePassword("");
    setDeleteError("");
  };

  return (
    <>
      <div id="nameLabel" title={user?.username} onClick={handleOpen} />
      {isOpen && (
        <div id="profile-options-modal" onClick={() => setIsOpen(false)}>
          <div id="profile-options-content" onClick={(e) => e.stopPropagation()}>
            {showDeleteConfirm ? (
              <>
                <h3>{t("profile.delete_confirm_title")}</h3>
                <p className="profile-delete-warning">{t("profile.delete_confirm_warning")}</p>

                {!user?.oauthProvider && (
                  <div className="profile-field">
                    <label htmlFor="delete-password">{t("profile.delete_confirm_password")}</label>
                    <input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
                      className="delay-input"
                      style={{ width: "100%" }}
                      autoFocus
                    />
                  </div>
                )}

                {deleteError && <p className="profile-email-error">{deleteError}</p>}

                <div className="profile-options-actions">
                  <button onClick={cancelDelete}>{t("common.back")}</button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="profile-danger-action-btn"
                  >
                    {deleteLoading ? t("profile.deleting") : t("common.confirm")}
                  </button>
                </div>
              </>
            ) : (
              <>
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

                <div className="profile-section-divider" />

                <div className="profile-field">
                  <span className="profile-section-title">{t("profile.data_privacy")}</span>
                </div>
                <div className="profile-data-actions">
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="profile-link">
                    {t("profile.privacy_policy")}
                  </a>
                  <button onClick={handleExport} disabled={exportLoading} className="profile-action-btn">
                    {exportLoading ? t("profile.exporting") : t("profile.export_data")}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="profile-action-btn profile-danger-btn">
                    {t("profile.delete_account")}
                  </button>
                </div>

                <div className="profile-options-actions">
                  <button onClick={() => setIsOpen(false)}>{t("common.cancel")}</button>
                  <button onClick={handleSave}>{t("common.save")}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileOptions;
