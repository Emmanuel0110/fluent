import { Context, Word } from "../../types";
import { useData } from "../../contexts/DataContext";
import { useContext } from "react";
import { ConfigContext } from "../../App";

interface WordDefinitionProps {
  word: Word;
}

export const WordDefinition = ({ word }: WordDefinitionProps) => {
  const { words } = useData();
  const { openWord } = useContext(ConfigContext) as Context;

  const onTranslationClick = (e: React.MouseEvent, wordId: string) => {
    e.stopPropagation();
    openWord(wordId);
  };

  return (
    <div className="wordDefinition">
      <span className="sourceLanguage">{word.text + " : "}</span>
      <span>
        {word.translations.map((wordId, index) => (
          <span key={index}>
            {index !== 0 && <span>{", "}</span>}
            <span className="translationLabel" onClick={(e) => onTranslationClick(e, wordId)}>
              {words[wordId]?.text}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
};
