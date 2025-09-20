import { useState } from "react";
import textToSpeech from "../../services/textToSpeechService";
import "./TextToSpeech.css";

export const TextToSpeech = ({ text, language }: { text: string; language: string }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await textToSpeech(text, language);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="iconContainer" onClick={handleClick}>
      <span className={loading ? "spinner" : "textToSpeechIcon"} />
    </span>
  );
};
