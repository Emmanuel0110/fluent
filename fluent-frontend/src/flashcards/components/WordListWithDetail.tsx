import { Flashcard, MultiLingualSentence, OpenFlashcardData, OpenWordData, Sentence, Word } from "../../types";
import { useNavigate, useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import WordList from "./WordList";
import { useContext, useEffect, useRef, useState } from "react";
import { ConfigContext, updateCacheWithNewWords } from "../../App";
import { Context } from "../../types";
import { getRemotePrerequisiteAndUsedIn } from "../flashcardActions";
import TabNav from "../../Layout/TabNav";
import WordDetail from "./WordDetail";

const MIN_USEDIN_LENGTH = 10;

const findWord = (words: { [key: string]: Word[] }, wordId: string) => {
  for (const key in words) {
    let word = words[key].find(({ _id }) => _id === wordId);
    if (word) return word;
  }
};

export default function WordListWithDetail({
  filteredWords,
  openedWords,
}: {
  filteredWords: Word[];
  openedWords: OpenWordData[];
}) {
  const {
    sourceLanguage,
    targetLanguage,
    words,
    setWords,
    sentences,
    setSentences,
    multiLingualSentences,
    setOpenedWords,
    setFlashcards,
    getMultiLingualSentenceById,
    fetchMoreUsedInMultiLingualSentences,
  } = useContext(ConfigContext) as Context;
  const wordId = useParams().wordId!;
  const [currentOpenedFlashcard, setCurrentOpenedFlashcard] = useState<OpenFlashcardData | null>(null);
  const [currentOpenedWord, setCurrentOpenedWord] = useState<OpenWordData | null>(null);
  const [prerequisites, setPrerequisites] = useState<Word[]>([]);
  const [sourcePrerequisites, setSourcePrerequisites] = useState<Word[]>([]);
  const [targetPrerequisites, setTargetPrerequisites] = useState<Word[]>([]);
  const [usedIn, setdUsedIn] = useState<MultiLingualSentence[]>([]);
  const loading = useRef(false);
  const usedInLoading = useRef(false);
  const navigate = useNavigate();

  useSplitPane(["#left", "#right"], "horizontal", [50, 50]);

  useEffect(() => {
    let currentOpenedWord = openedWords.find(({ id }) => id === wordId);
    if (currentOpenedWord) {
      setCurrentOpenedWord(currentOpenedWord);
    } else {
      const word = findWord(words, wordId);
      if (word) {
        currentOpenedWord = {
          id: word._id,
          data: word,
        };
        setOpenedWords([...openedWords, currentOpenedWord]);
        setCurrentOpenedWord(currentOpenedWord);
      }
    }
    if (currentOpenedWord) {
      const usedInMultiLingualSentences = fillUsedIn(currentOpenedWord);
      if (usedInMultiLingualSentences.length < MIN_USEDIN_LENGTH) {
        fetchMoreUsedInMultiLingualSentences(wordId);
      }
    }
  }, [words, wordId, openedWords]);

  useEffect(() => {
    if (currentOpenedWord) {
      fillUsedIn(currentOpenedWord);
    }
  }, [multiLingualSentences]);

  const fillUsedIn = (currentOpenedWord: OpenWordData) => {
    const usedInSentencesIds = sentences
      .filter((sentence) => sentence.prerequisites.includes(wordId))
      .map(({ _id }) => _id);
    const usedInMultiLingualSentences = multiLingualSentences.filter((multiLingualSentence) =>
      usedInSentencesIds.includes(multiLingualSentence[currentOpenedWord.data.sourceLanguage]!)
    );
    setdUsedIn(
      usedInMultiLingualSentences.map((multiLingualSentence) => ({
        ...multiLingualSentence,
        [sourceLanguage]: sentences.find(({ _id }) => _id === multiLingualSentence[sourceLanguage])?.text,
        [targetLanguage]: sentences.find(({ _id }) => _id === multiLingualSentence[targetLanguage])?.text,
      }))
    );
    return usedInMultiLingualSentences;
  };

  // const updateUnsavedData = (args: Partial<Word>) => {
  //   setOpenedWords((openedWords) =>
  //     openedWords.map((openedWord) =>
  //       openedWord.id === wordId && openedWord.unsavedData
  //         ? {
  //             ...openedWord,
  //             unsavedData: {
  //               ...openedWord.unsavedData,
  //               args,
  //             },
  //           }
  //         : openedWord
  //     )
  //   );
  // };

  const closeTab = (tabIndex: number) => {
    setOpenedWords((openedWords) => openedWords.filter((word, index) => index !== tabIndex));
    navigate(
      openedWords.length > 1 ? "/words/" + (openedWords[tabIndex + 1]?.id || openedWords[tabIndex - 1]?.id) : "/words"
    );
  };

  const closeOtherTabs = (e: React.MouseEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    navigate("/words/" + openedWords[index].id);
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
              tabsData={openedWords.map(({ id, data: { text }, unsavedData }) => ({
                id,
                text,
                unsaved: !!unsavedData,
              }))}
              selectedId={wordId}
              closeTab={closeTab}
              closeOtherTabs={closeOtherTabs}
              closeAllTabs={closeAllTabs}
              selectTab={selectTab}
            />
            {/* {currentOpenedWord.unsavedData ? (
              <FlashcardForm
                updateUnsavedData={updateUnsavedData}
                multiLingualSentenceId={wordId}
                sourceSentence={currentOpenedWord.unsavedData[sourceLanguage]}
                sourcePrerequisites={sourcePrerequisites}
                targetSentence={currentOpenedWord.unsavedData[targetLanguage]}
                targetPrerequisites={targetPrerequisites}
              />
            ) : ( */}
              <WordDetail word={currentOpenedWord.data} usedIn={usedIn} />
            {/* )} */}
          </div>
        )}
      </div>
    </div>
  );
}
