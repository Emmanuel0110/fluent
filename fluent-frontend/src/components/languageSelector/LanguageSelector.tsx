import React, { useState } from "react";
import "./LanguageSelector.css";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTranslation } from "react-i18next";

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

const LanguageSelector: React.FC = () => {
  const { t } = useTranslation();
  const { languages, sourceLanguage, targetLanguage, updateUserLanguages } = useLanguage();
  const [tempSourceLanguage, setTempSourceLanguage] = useState<string>(sourceLanguage);
  const [tempTargetLanguage, setTempTargetLanguage] = useState<string>(targetLanguage);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async () => {
    if (tempSourceLanguage && tempTargetLanguage && tempSourceLanguage !== tempTargetLanguage) {
      const success = await updateUserLanguages(tempSourceLanguage, tempTargetLanguage);
      if (success) setIsOpen(false);
    }
  };

  const sourceLanguageCode = languages.find((l) => l._id === tempSourceLanguage)?.label;

  const getTargetLabel = (langCode: string) =>
    sourceLanguageCode
      ? (translatedNames[sourceLanguageCode]?.[langCode] ?? langCode)
      : langCode;

  return (
    <>
      <div id="language-selector-button" onClick={() => setIsOpen(true)} />
      {isOpen && (
        <div id="language-selector-modal" onClick={() => setIsOpen(false)}>
          <div id="language-selector-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t("language.choose_title")}</h3>

            <div className="language-field">
              <label>{t("language.source_label")}</label>
              <select value={tempSourceLanguage} onChange={(e) => setTempSourceLanguage(e.target.value)}>
                <option value="">{t("language.select_source")}</option>
                {languages.map((lang) => (
                  <option key={lang._id} value={lang._id}>
                    {nativeNames[lang.label] ?? lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="language-field">
              <label>{t("language.target_label")}</label>
              <select value={tempTargetLanguage} onChange={(e) => setTempTargetLanguage(e.target.value)}>
                <option value="">{t("language.select_target")}</option>
                {languages.map((lang) => (
                  <option key={lang._id} value={lang._id}>
                    {getTargetLabel(lang.label)}
                  </option>
                ))}
              </select>
            </div>

            <div className="language-selector-actions">
              <button onClick={() => setIsOpen(false)}>{t("common.cancel")}</button>
              <button
                onClick={handleSave}
                disabled={!tempSourceLanguage || !tempTargetLanguage || tempSourceLanguage === tempTargetLanguage}
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageSelector;
