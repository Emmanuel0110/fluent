import { useState } from "react";
import { updateLanguages } from "../APICalls";
import { useLanguage } from "../contexts/LanguageContext";
import { useTranslation } from "react-i18next";
import { nativeNames } from "../constants/languages";

export default function LanguageForm() {
  const { t } = useTranslation();
  const { languages, setSourceLanguage, setTargetLanguage } = useLanguage();
  const [localSourceId, setLocalSourceId] = useState("");
  const [localTargetId, setLocalTargetId] = useState("");

  const chooseLanguage = async () => {
    if (localSourceId && localTargetId && localSourceId !== localTargetId) {
      const res = await updateLanguages({ sourceLanguage: localSourceId, targetLanguage: localTargetId });
      if (res && res.sourceLanguage && res.targetLanguage) {
        setSourceLanguage(res.sourceLanguage);
        setTargetLanguage(res.targetLanguage);
      }
    }
  };

  return (
    <div className="language-form">
      <div className="language-form-inputs">
        <select
          className="language-form-select"
          value={localSourceId}
          onChange={(e) => setLocalSourceId(e.target.value)}
        >
          <option value="">{t("language.select_source")}</option>
          {languages.map((lang) => (
            <option key={lang._id} value={lang._id}>
              {nativeNames[lang.label] ?? lang.label}
            </option>
          ))}
        </select>
        <select
          className="language-form-select"
          value={localTargetId}
          onChange={(e) => setLocalTargetId(e.target.value)}
        >
          <option value="">{t("language.select_target")}</option>
          {languages.map((lang) => (
            <option key={lang._id} value={lang._id}>
              {nativeNames[lang.label] ?? lang.label}
            </option>
          ))}
        </select>
      </div>
      <button onClick={chooseLanguage}>{t("language.choose_btn")}</button>
    </div>
  );
}
