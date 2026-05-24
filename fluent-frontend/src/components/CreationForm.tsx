import React from "react";
import ConversationForm from "./ConversationForm";
import WordForm from "./WordForm";
import LanguageForm from "./LanguageForm";
import ConversationTagForm from "./ConversationTagForm";
import "./CreationForm.css";
import { useTranslation } from "react-i18next";

function CreationForm() {
  const { t } = useTranslation();
  return (
    <div className="creation-form-container">
      <div className="creation-form-section">
        <h2 className="creation-form-section-title">{t("creation.language_section")}</h2>
        <LanguageForm />
      </div>
      <div className="creation-form-section">
        <h2 className="creation-form-section-title">{t("creation.conversation_section")}</h2>
        <ConversationForm />
      </div>
      <div className="creation-form-section">
        <h2 className="creation-form-section-title">{t("creation.words_section")}</h2>
        <WordForm />
      </div>
      <div className="creation-form-section">
        <h2 className="creation-form-section-title">{t("creation.tags_section")}</h2>
        <ConversationTagForm />
      </div>
    </div>
  );
}

export default CreationForm;
