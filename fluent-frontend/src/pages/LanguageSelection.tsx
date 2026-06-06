import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { url } from "../App";
import "./LanguageSelection.css";

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

interface Language {
  _id: string;
  label: string;
}

export default function LanguageSelection() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [sourceLanguageId, setSourceLanguageId] = useState("");
  const [targetLanguageId, setTargetLanguageId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url + "languages")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setLanguages(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const sourceLanguageCode = languages.find((l) => l._id === sourceLanguageId)?.label;
  const getTargetLabel = (langCode: string) =>
    sourceLanguageCode ? (translatedNames[sourceLanguageCode]?.[langCode] ?? langCode) : nativeNames[langCode] ?? langCode;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceLanguageId || !targetLanguageId || sourceLanguageId === targetLanguageId) {
      setError(t("language.invalid_selection"));
      return;
    }
    navigate("/register", { state: { sourceLanguageId, targetLanguageId } });
  };

  if (isAuthenticated === true) return <Navigate to="/review" replace />;
  if (isAuthenticated === null) return null;

  return (
    <div className="lang-select-container">
      <h1 className="lang-select-app-title">Fluent</h1>
      <h2 className="lang-select-heading">{t("language.choose_title")}</h2>

      {loading ? (
        <p className="lang-select-loading">{t("common.loading")}</p>
      ) : (
        <form className="lang-select-form" onSubmit={handleContinue}>
          <div className="lang-select-field">
            <label className="lang-select-label">{t("language.source_label")}</label>
            <select
              className="lang-select-select"
              value={sourceLanguageId}
              onChange={(e) => {
                setSourceLanguageId(e.target.value);
                setError("");
              }}
            >
              <option value="">{t("language.select_source")}</option>
              {languages.map((lang) => (
                <option key={lang._id} value={lang._id}>
                  {nativeNames[lang.label] ?? lang.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lang-select-field">
            <label className="lang-select-label">{t("language.target_label")}</label>
            <select
              className="lang-select-select"
              value={targetLanguageId}
              onChange={(e) => {
                setTargetLanguageId(e.target.value);
                setError("");
              }}
            >
              <option value="">{t("language.select_target")}</option>
              {languages.map((lang) => (
                <option key={lang._id} value={lang._id}>
                  {getTargetLabel(lang.label)}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="lang-select-error">{error}</p>}

          <div className="lang-select-actions">
            <button type="submit" className="lang-select-btn-primary">
              {t("language.choose_btn")}
            </button>
            <Link to="/" className="lang-select-btn-secondary">
              {t("common.back")}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
