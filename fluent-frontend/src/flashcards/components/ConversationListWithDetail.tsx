import {
  CompletedMultiLingualSentence,
  Conversation,
  Flashcard,
  MultiLingualSentence,
  OpenFlashcardData,
  OpenMultiLingualSentenceData,
  Sentence,
  Word,
} from "../../types";
import { useNavigate, useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import WordList from "./WordList";
import { useContext, useEffect, useRef, useState } from "react";
import { ConfigContext, updateCacheWithNewWords } from "../../App";
import { Context } from "../../types";
import { getRemotePrerequisiteAndUsedIn } from "../flashcardActions";
import TabNav from "../../Layout/TabNav";
import WordDetail from "./WordDetail";
import ConversationList from "./ConversationList";
import SentenceDetail from "./SentenceDetail";

const MIN_USEDIN_LENGTH = 10;

export default function ConversationListWithDetail({
  filteredConversations,
  openedMultiLingualSentences,
}: {
  filteredConversations: Conversation[];
  openedMultiLingualSentences: OpenMultiLingualSentenceData[];
}) {
  const {
    sourceLanguage,
    targetLanguage,
    words,
    setWords,
    sentences,
    setSentences,
    conversations,
    multiLingualSentences,
    setOpenedMultiLingualSentences,
    getMultiLingualSentenceById,
    fetchMoreUsedInConversations,
  } = useContext(ConfigContext) as Context;
  const multiLingualSentenceId = useParams().multiLingualSentenceId!;
  const [currentOpenedMultiLingualSentence, setCurrentOpenedMultiLingualSentence] =
    useState<OpenMultiLingualSentenceData | null>(null);
  const [sourcePrerequisites, setSourcePrerequisites] = useState<Word[]>([]);
  const [targetPrerequisites, setTargetPrerequisites] = useState<Word[]>([]);
  const [usedIn, setdUsedIn] = useState<any[]>([]);
  const loading = useRef(false);
  const navigate = useNavigate();
  const prerequisitesAndusedInLoading = useRef(false);

  useSplitPane(["#left", "#right"], "horizontal", [50, 50]);

  useEffect(() => {
    if (!loading.current) {
      const openedMultiLingualSentence = openedMultiLingualSentences.find(({ id }) => id === multiLingualSentenceId);
      if (openedMultiLingualSentence) {
        setCurrentOpenedMultiLingualSentence(openedMultiLingualSentence);
      } else {
        const multiLingualSentence = multiLingualSentences.find(({ _id }) => _id === multiLingualSentenceId);
        if (multiLingualSentence) {
          const openedMultiLingualSentence: OpenMultiLingualSentenceData = {
            id: multiLingualSentence._id,
            data: {
              _id: multiLingualSentence._id,
              nextReviewDate: multiLingualSentence.nextReviewDate,
              [sourceLanguage]: sentences.find(({ _id }) => _id === multiLingualSentence[sourceLanguage])!,
              [targetLanguage]: sentences.find(({ _id }) => _id === multiLingualSentence[targetLanguage])!,
            },
          };
          setOpenedMultiLingualSentences([...openedMultiLingualSentences, openedMultiLingualSentence]); //Why is it too slow when I use function in setOpenedFlashcards ?
          setCurrentOpenedMultiLingualSentence(openedMultiLingualSentence);
        } else {
          loading.current = true;
          getMultiLingualSentenceById(multiLingualSentenceId).then(() => (loading.current = false));
        }
      }
    }
    if (currentOpenedMultiLingualSentence) {
      const usedInMultiLingualSentences = fillUsedIn();
      if (usedInMultiLingualSentences.length < MIN_USEDIN_LENGTH) {
        fetchMoreUsedInConversations(multiLingualSentenceId);
      }
    }
  }, [multiLingualSentences, multiLingualSentenceId, openedMultiLingualSentences]);

  useEffect(() => {
    if (currentOpenedMultiLingualSentence && !prerequisitesAndusedInLoading.current) {
      const [sourcePrerequisites, targetPrerequisites] = getPrerequisites(currentOpenedMultiLingualSentence.data);
      setSourcePrerequisites(sourcePrerequisites);
      setTargetPrerequisites(targetPrerequisites);
    }
  }, [currentOpenedMultiLingualSentence, multiLingualSentences]);

  useEffect(() => {
    if (currentOpenedMultiLingualSentence) {
      fillUsedIn();
    }
  }, [conversations]);

  const getPrerequisites = (multiLingualSentence: CompletedMultiLingualSentence) => {
    return [
      multiLingualSentence[sourceLanguage]!.prerequisites.map(
        (prerequisiteId) => words[sourceLanguage].find(({ _id }) => _id === prerequisiteId)!
      ),
      multiLingualSentence[targetLanguage]!.prerequisites.map(
        (prerequisiteId) => words[targetLanguage].find(({ _id }) => _id === prerequisiteId)!
      ),
    ];
  };

  const fillUsedIn = () => {
    const usedInConversations = conversations.filter((conversation) =>
      conversation.multiLingualSentences.includes(multiLingualSentenceId)
    );
    setdUsedIn(
      usedInConversations.map((usedInConversation) => ({
        ...usedInConversation,
        multiLingualSentences: usedInConversation.multiLingualSentences.map((multiLingualSentenceId) => {
          const multiLingualSentence = multiLingualSentences.find(({ _id }) => _id === multiLingualSentenceId)!;
          return {
            ...multiLingualSentence,
            [sourceLanguage]: sentences.find(({ _id }) => _id === multiLingualSentence[sourceLanguage])?.text,
            [targetLanguage]: sentences.find(({ _id }) => _id === multiLingualSentence[targetLanguage])?.text,
          };
        }),
      }))
    );
    return usedInConversations;
  };

  // const updateUnsavedData = (language: string, args: Partial<Sentence>) => {
  //   setOpenedMultiLingualSentences((openedMultiLingualSentences) =>
  //     openedMultiLingualSentences.map((openedMultiLingualSentence) =>
  //       openedMultiLingualSentence.id === multiLingualSentenceId &&
  //       openedMultiLingualSentence.unsavedData![language as keyof OpenFlashcardData]
  //         ? {
  //             ...openedMultiLingualSentence,
  //             unsavedData: {
  //               ...openedMultiLingualSentence.unsavedData,
  //               [language]: { ...openedMultiLingualSentence.unsavedData![language], args },
  //             },
  //           }
  //         : openedMultiLingualSentence
  //     )
  //   );
  // };

  const closeTab = (tabIndex: number) => {
    setOpenedMultiLingualSentences((openedMultiLingualSentence) =>
      openedMultiLingualSentence.filter((multiLingualSentence, index) => index !== tabIndex)
    );
    navigate(
      openedMultiLingualSentences.length > 1
        ? "/multilingualsentences/" +
            (openedMultiLingualSentences[tabIndex + 1]?.id || openedMultiLingualSentences[tabIndex - 1]?.id)
        : "/multilingualsentences"
    );
  };

  const closeOtherTabs = (e: React.MouseEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    navigate("/multilingualsentences/" + openedMultiLingualSentences[index].id);
    setOpenedMultiLingualSentences([openedMultiLingualSentences[index]]);
  };

  const closeAllTabs = () => {
    navigate("/multilingualsentences");
    setOpenedMultiLingualSentences([]);
  };

  const selectTab = (id: string | null) => navigate("/multilingualsentences/" + id!);

  return (
    <div id="splitContainer">
      <div id="left">
        <ConversationList filteredConversations={filteredConversations} />
      </div>
      <div id="right">
        {currentOpenedMultiLingualSentence && (
          <div id="openedFlashcards">
            <TabNav
              tabsData={openedMultiLingualSentences.map(({ id, data, unsavedData }) => {
                return {
                  id,
                  text: data[sourceLanguage]?.text || "",
                  unsaved: !!unsavedData,
                };
              })}
              selectedId={multiLingualSentenceId}
              closeTab={closeTab}
              closeOtherTabs={closeOtherTabs}
              closeAllTabs={closeAllTabs}
              selectTab={selectTab}
            />
            {/* {currentOpenedMultiLingualSentence.unsavedData ? (
              <FlashcardForm
                updateUnsavedData={updateUnsavedData}
                multiLingualSentenceId={multiLingualSentenceId}
                sourceSentence={currentOpenedMultiLingualSentence.unsavedData[sourceLanguage]}
                sourcePrerequisites={sourcePrerequisites}
                targetSentence={currentOpenedMultiLingualSentence.unsavedData[targetLanguage]}
                targetPrerequisites={targetPrerequisites}
              />
            ) : ( */}
            <SentenceDetail
              multiLingualSentence={currentOpenedMultiLingualSentence.data}
              sourcePrerequisites={sourcePrerequisites}
              targetPrerequisites={targetPrerequisites}
              usedIn={usedIn}
            />
            {/* )} */}
          </div>
        )}
      </div>
    </div>
  );
}
