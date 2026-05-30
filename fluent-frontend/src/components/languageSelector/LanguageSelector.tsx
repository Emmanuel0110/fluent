import React, { useState } from "react";
import "./LanguageSelector.css";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTranslation } from "react-i18next";

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
                    {lang.label}
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
                    {lang.label}
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
