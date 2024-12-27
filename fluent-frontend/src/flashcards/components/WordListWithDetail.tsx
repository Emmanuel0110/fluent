import { Conversation, Word } from "../../types";
import { useNavigate, useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import WordList from "./WordList";
import { useContext, useEffect, useRef, useState } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import { getRemotePrerequisiteAndUsedIn } from "../flashcardActions";
import TabNav from "../../Layout/TabNav";
import WordDetail from "./WordDetail";

const MIN_USEDIN_LENGTH = 10;

export default function WordListWithDetail({
  filteredWords,
  openedWords,
}: {
  filteredWords: Word[];
  openedWords: Word[];
}) {
  const {
    sourceLanguage,
    targetLanguage,
    words,
    setWords,
    setOpenedWords,
    conversations,
    fetchMoreUsedInConversations,
  } = useContext(ConfigContext) as Context;
  const wordId = useParams().wordId!;
  const [currentOpenedWord, setCurrentOpenedWord] = useState<Word | null>(null);
  const [prerequisites, setPrerequisites] = useState<Word[]>([]);
  const [sourcePrerequisites, setSourcePrerequisites] = useState<Word[]>([]);
  const [targetPrerequisites, setTargetPrerequisites] = useState<Word[]>([]);
  const [usedIn, setdUsedIn] = useState<Conversation[]>([]);
  const loading = useRef(false);
  const usedInLoading = useRef(false);
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
        <WordList filteredWords={filteredWords} />
      </div>
      <div id="right">
        {currentOpenedWord && (
          <div id="openedFlashcards">
            <TabNav
              tabsData={openedWords.map(({ _id, sourceLanguage }) => ({
                id: _id,
                text: sourceLanguage,
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
