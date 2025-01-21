import { useContext, useState } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import { useNavigate } from "react-router-dom";
import { updateLanguages } from "../flashcardActions";

export default function LanguageForm() {
  const { languages, setSourceLanguage, setTargetLanguage } = useContext(ConfigContext) as Context;
  const [localSourceLanguage, setLocalSourceLanguage] = useState<string | null>(null);
  const [localTargetLanguage, setLocalTargetLanguage] = useState<string | null>(null);
  const navigate = useNavigate();

  const chooseLanguage = async () => {
    if (localSourceLanguage !== null && localTargetLanguage !== null) {
      const sourceLanguage = languages.find(({ label }) => label === localSourceLanguage)?._id;
      const targetLanguage = languages.find(({ label }) => label === localTargetLanguage)?._id;
      if (sourceLanguage && targetLanguage) {
        const res = await updateLanguages({ sourceLanguage, targetLanguage });
        if (res && res.sourceLanguage && res.targetLanguage) {
          setSourceLanguage(res.sourceLanguage);
          setTargetLanguage(res.targetLanguage);
          navigate("/words");
        }
      }
    }
  };

  return (
    <div>
      <input type="text" onChange={(e) => setLocalSourceLanguage(e.target.value)} placeholder="Source language" />
      <input type="text" onChange={(e) => setLocalTargetLanguage(e.target.value)} placeholder="Target language" />
      <button onClick={chooseLanguage}>Choose languages</button>
    </div>
  );
}
