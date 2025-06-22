import React, { useState } from "react";
import "./LanguageSelector.css";
import { useLanguage } from "../../contexts/LanguageContext";

const LanguageSelector: React.FC = () => {
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

  const handleOpen = () => {
    setTempSourceLanguage(sourceLanguage);
    setTempTargetLanguage(targetLanguage);
    setIsOpen(true);
  };

  return (
    <>
      <div className="language-selector-button" onClick={handleOpen} />
      {isOpen && (
        <div className="language-selector-modal">
          <div className="language-selector-content">
            <h3>Choose Your Languages</h3>

            <div className="language-field">
              <label>Source Language (you know):</label>
              <select value={tempSourceLanguage} onChange={(e) => setTempSourceLanguage(e.target.value)}>
                <option value="">Select source language</option>
                {languages.map((lang) => (
                  <option key={lang._id} value={lang._id}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="language-field">
              <label>Target Language (you're learning):</label>
              <select value={tempTargetLanguage} onChange={(e) => setTempTargetLanguage(e.target.value)}>
                <option value="">Select target language</option>
                {languages.map((lang) => (
                  <option key={lang._id} value={lang._id}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="language-selector-actions">
              <button onClick={() => setIsOpen(false)}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={!tempSourceLanguage || !tempTargetLanguage || tempSourceLanguage === tempTargetLanguage}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageSelector;
