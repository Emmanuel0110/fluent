import { useState } from "react";
import { Tab, Tabs } from "react-bootstrap";
import "../App.css";
import { useParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { useWordLists } from "../hooks/useWordLists";
import { useTranslation } from "react-i18next";
import WordPanel from "./WordPanel";

function WordForm() {
  const { t } = useTranslation();
  const { wordId } = useParams();
  const { sourceLanguage, targetLanguage } = useLanguage();
  const { words } = useData();
  const { sourceWords, targetWords } = useWordLists();
  const [activeTab, setActiveTab] = useState<"source" | "target">("source");

  const initialWord = wordId ? words[wordId] : undefined;
  const sourceInitial = initialWord?.language === sourceLanguage ? initialWord : undefined;
  const targetInitial = initialWord?.language === targetLanguage ? initialWord : undefined;

  return (
    <div className="word-form">
      <div id="sourceLanguage">
        <Tabs fill activeKey={activeTab} onSelect={(k) => setActiveTab(k as "source" | "target")}>
          <Tab eventKey="source" title={t("word.source_language")}>
            <WordPanel
              initialWord={sourceInitial}
              ownLanguage={sourceLanguage}
              otherLanguage={targetLanguage}
              ownWords={sourceWords}
              otherWords={targetWords}
              emptyPlaceholder={t("word.add_source")}
            />
          </Tab>
          <Tab eventKey="target" title={t("word.target_language")}>
            <WordPanel
              initialWord={targetInitial}
              ownLanguage={targetLanguage}
              otherLanguage={sourceLanguage}
              ownWords={targetWords}
              otherWords={sourceWords}
              emptyPlaceholder={t("word.add_target")}
            />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

export default WordForm;
