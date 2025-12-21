import React from "react";
import ConversationForm from "./ConversationForm";
import WordForm from "./WordForm";
import LanguageForm from "./LanguageForm";
import "./CreationForm.css";

function CreationForm() {
  return (
    <div className="creation-form-container">
      <div className="creation-form-section">
        <h2 className="creation-form-section-title">Language Selection</h2>
        <LanguageForm />
      </div>
      <div className="creation-form-section">
        <h2 className="creation-form-section-title">Conversation</h2>
        <ConversationForm />
      </div>
      <div className="creation-form-section">
        <h2 className="creation-form-section-title">Words</h2>
        <WordForm />
      </div>
    </div>
  );
}

export default CreationForm;
