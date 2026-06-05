import React, { useState, useEffect } from "react";
import "./Profile.css";
import { useReviewSettings } from "../../contexts/ReviewSettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";
import { updateEmail, exportUserData } from "../../auth/authActions";
import { ApiError } from "../../utils/http-helpers";
import { useNavigate } from "react-router-dom";
import DeleteAccountConfirmDialog from "./DeleteAccountConfirmDialog";

const nativeNames: Record<string, string> = {
  en: "English",
  fr: "Français",
  ko: "한국어",
};

const translatedNames: Record<string, Record<string, string>> = {
  en: { en: "English", fr: "French", ko: "Korean" },
  fr: { en: "Anglais", fr: "Français", ko: "Coréen" },
  ko: { en: "영어", fr: "프랑스어", ko: "한국어" },
};

function Profile() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useReviewSettings();
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { languages, sourceLanguage, targetLanguage, updateUserLanguages } = useLanguage();
  const navigate = useNavigate();

  const [tempTheme, setTempTheme] = useState<"light" | "dark">(theme);
  const [reviewMode, setReviewMode] = useState<"auto" | "manual">(settings.reviewMode);
  const [autoReviewDelay, setAutoReviewDelay] = useState<number>(settings.autoReviewDelay);
  const [tempEmail, setTempEmail] = useState(user?.email ?? "");
  const [emailError, setEmailError] = useState("");
  const [tempSourceLanguage, setTempSourceLanguage] = useState<string>(sourceLanguage);
  const [tempTargetLanguage, setTempTargetLanguage] = useState<string>(targetLanguage);
  const [langError, setLangError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    setReviewMode(settings.reviewMode);
    setAutoReviewDelay(settings.autoReviewDelay);
  }, [settings]);

  const sourceLanguageCode = languages.find((l) => l._id === tempSourceLanguage)?.label;
  const getTargetLabel = (langCode: string) =>
    sourceLanguageCode ? (translatedNames[sourceLanguageCode]?.[langCode] ?? langCode) : langCode;

  const handleSave = async () => {
    setSaving(true);
    setEmailError("");
    setLangError("");

    setTheme(tempTheme);
    updateSettings({ reviewMode, autoReviewDelay });

    let hasError = false;

    if (tempSourceLanguage !== sourceLanguage || tempTargetLanguage !== targetLanguage) {
      if (!tempSourceLanguage || !tempTargetLanguage || tempSourceLanguage === tempTargetLanguage) {
        setLangError(t("language.invalid_selection"));
        hasError = true;
      } else {
        const success = await updateUserLanguages(tempSourceLanguage, tempTargetLanguage);
        if (!success) {
          setLangError(t("language.update_failed"));
          hasError = true;
        }
      }
    }

    const normalizedEmail = tempEmail.trim().toLowerCase();
    if (normalizedEmail !== (user?.email ?? "")) {
      try {
        const saved = await updateEmail(normalizedEmail);
        setUser({ ...user!, email: saved });
      } catch (err) {
        setEmailError(err instanceof ApiError ? err.userMessage : String(err));
        hasError = true;
      }
    }

    setSaving(false);
    if (!hasError) navigate(-1);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportUserData();
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-content">
        <button className="profile-back" onClick={() => navigate(-1)}>
          ← {t("common.back")}
        </button>

        <h1 className="profile-page-title">{t("profile.title")}</h1>

        <section className="profile-section">
          <h2 className="profile-section-heading">{t("profile.section_languages")}</h2>
          <div className="profile-field">
            <label>{t("language.source_label")}</label>
            <select
              value={tempSourceLanguage}
              onChange={(e) => {
                setTempSourceLanguage(e.target.value);
                setLangError("");
              }}
              className="profile-select"
            >
              <option value="">{t("language.select_source")}</option>
              {languages.map((lang) => (
                <option key={lang._id} value={lang._id}>
                  {nativeNames[lang.label] ?? lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="profile-field">
            <label>{t("language.target_label")}</label>
            <select
              value={tempTargetLanguage}
              onChange={(e) => {
                setTempTargetLanguage(e.target.value);
                setLangError("");
              }}
              className="profile-select"
            >
              <option value="">{t("language.select_target")}</option>
              {languages.map((lang) => (
                <option key={lang._id} value={lang._id}>
                  {getTargetLabel(lang.label)}
                </option>
              ))}
            </select>
          </div>
          {langError && <p className="profile-error">{langError}</p>}
        </section>

        <section className="profile-section">
          <h2 className="profile-section-heading">{t("profile.section_appearance")}</h2>
          <div className="profile-field profile-field-row">
            <label htmlFor="theme-toggle">{t("profile.dark_mode")}</label>
            <label className="profile-toggle-switch">
              <input
                type="checkbox"
                id="theme-toggle"
                checked={tempTheme === "dark"}
                onChange={(e) => setTempTheme(e.target.checked ? "dark" : "light")}
              />
              <span className="profile-toggle-track" />
            </label>
          </div>
        </section>

        <section className="profile-section">
          <h2 className="profile-section-heading">{t("profile.section_review")}</h2>
          <div className="profile-field">
            <label>{t("profile.review_display")}</label>
            <div className="profile-radio-group">
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
                className="profile-input profile-input-short"
              />
            </div>
          )}
        </section>

        <section className="profile-section">
          <h2 className="profile-section-heading">{t("profile.section_account")}</h2>
          <div className="profile-field">
            <label htmlFor="profile-email">{t("profile.email")}</label>
            <input
              id="profile-email"
              type="email"
              value={tempEmail}
              onChange={(e) => {
                setTempEmail(e.target.value);
                setEmailError("");
              }}
              className="profile-input"
            />
            {emailError && <p className="profile-error">{emailError}</p>}
          </div>
        </section>

        <div className="profile-actions">
          <button className="profile-btn profile-btn-secondary" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </button>
          <button className="profile-btn profile-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>

        <section className="profile-section">
          <h2 className="profile-section-heading">{t("profile.data_privacy")}</h2>
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
        </section>
      </div>

      {showDeleteConfirm && <DeleteAccountConfirmDialog onClose={() => setShowDeleteConfirm(false)} />}
    </div>
  );
}

export default Profile;
