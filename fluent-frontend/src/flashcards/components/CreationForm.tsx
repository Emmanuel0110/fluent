import React, { Fragment } from "react";
import ConversationForm from "./ConversationForm";
import WordForm from "./WordForm";
import LanguageForm from "./LanguageForm";

function CreationForm() {
  return (
    <Fragment>
      <LanguageForm />
      <ConversationForm />
      <WordForm />
    </Fragment>
  );
}

export default CreationForm;
