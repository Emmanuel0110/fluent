import { Conversation, Word } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import useSplitPane from "../utils/useSplitPane";
import WordList from "./WordList";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";
import TabNav from "./layout/TabNav";
import WordDetail from "./WordDetail";
import { useData } from "../contexts/DataContext";

const MIN_USEDIN_LENGTH = 10;

export default function WordListWithDetail() {
  const { words, conversations, fetchMoreUsedInConversations } = useData();
  const { setOpenedWords, filteredWords, openedWords } = useContext(ConfigContext) as Context;
  const wordId = useParams().wordId!;
  const [currentOpenedWord, setCurrentOpenedWord] = useState<Word | null>(null);
  const [usedIn, setdUsedIn] = useState<Conversation[]>([]);
  const navigate = useNavigate();

  useSplitPane(["#left", "#right"], "horizontal", [50, 50]);

  useEffect(() => {
    let currentOpenedWord = openedWords.find(({ _id }) => _id === wordId);
    if (currentOpenedWord) {
      setCurrentOpenedWord(currentOpenedWord);
    } else {
      const word = words[wordId];
      if (word) {
        currentOpenedWord = word;
        setOpenedWords([...openedWords, currentOpenedWord]);
        setCurrentOpenedWord(currentOpenedWord);
      }
    }
    if (currentOpenedWord) {
      const usedInMultiLingualSentences = fillUsedIn();
      if (usedInMultiLingualSentences.length < MIN_USEDIN_LENGTH) {
        fetchMoreUsedInConversations(wordId);
      }
    }
  }, [words, wordId, openedWords]);

  useEffect(() => {
    if (currentOpenedWord) {
      fillUsedIn();
    }
  }, [conversations]);

  const fillUsedIn = () => {
    const usedInConversations = conversations.filter(({ multiLingualSentences }) =>
      multiLingualSentences.some(
        (sentence) =>
          sentence.sourceLanguage.prerequisites.includes(wordId) ||
          sentence.targetLanguage.prerequisites.includes(wordId)
      )
    );
    setdUsedIn(usedInConversations);
    return usedInConversations;
  };

  const closeTab = (tabIndex: number) => {
    setOpenedWords((openedWords) => openedWords.filter((word, index) => index !== tabIndex));
    navigate(
      openedWords.length > 1 ? "/words/" + (openedWords[tabIndex + 1]?._id || openedWords[tabIndex - 1]?._id) : "/words"
    );
  };

  const closeOtherTabs = (e: React.MouseEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    navigate("/words/" + openedWords[index]._id);
    setOpenedWords([openedWords[index]]);
  };

  const closeAllTabs = () => {
    navigate("/words");
    setOpenedWords([]);
  };

  const selectTab = (id: string | null) => navigate("/words/" + id!);

  return (
    <div id="splitContainer">
      <div id="left">
        <WordList />
      </div>
      <div id="right">
        {currentOpenedWord && (
          <div id="openedWords">
            <TabNav
              tabsData={openedWords.map(({ _id, text }) => ({
                id: _id,
                text,
              }))}
              selectedId={wordId}
              closeTab={closeTab}
              closeOtherTabs={closeOtherTabs}
              closeAllTabs={closeAllTabs}
              selectTab={selectTab}
            />
            <WordDetail word={currentOpenedWord} usedIn={usedIn} />
            {/* )} */}
          </div>
        )}
      </div>
    </div>
  );
}
