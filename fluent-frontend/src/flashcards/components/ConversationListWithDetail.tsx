import { Conversation, Flashcard, Sentence, Word } from "../../types";
import { useNavigate, useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import WordList from "./WordList";
import { useContext, useEffect, useRef, useState } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import { getRemotePrerequisiteAndUsedIn } from "../flashcardActions";
import TabNav from "../../Layout/TabNav";
import ConversationList from "./ConversationList";
import SentenceDetail from "./SentenceDetail";
import ConversationDetail from "./ConversationDetail";

const MIN_USEDIN_LENGTH = 10;

export default function ConversationListWithDetail({
  filteredConversations,
  openedConversations,
}: {
  filteredConversations: Conversation[];
  openedConversations: Conversation[];
}) {
  const {
    sourceLanguage,
    targetLanguage,
    words,
    setWords,
    conversations,
    setOpenedConversations,
    getConversationById,
  } = useContext(ConfigContext) as Context;
  const conversationId = useParams().conversationId!;
  const [currentOpenedConversation, setCurrentOpenedConversation] = useState<Conversation | null>(null);
  const [sourcePrerequisites, setSourcePrerequisites] = useState<Word[]>([]);
  const [targetPrerequisites, setTargetPrerequisites] = useState<Word[]>([]);
  const [usedIn, setdUsedIn] = useState<any[]>([]);
  const loading = useRef(false);
  const navigate = useNavigate();
  const prerequisitesAndusedInLoading = useRef(false);

  useSplitPane(["#left", "#right"], "horizontal", [50, 50]);

  useEffect(() => {
    if (!loading.current) {
      const openedConversation = openedConversations.find(({ _id }) => _id === conversationId);
      if (openedConversation) {
        setCurrentOpenedConversation(openedConversation);
      } else {
        const conversation = conversations.find(({ _id }) => _id === conversationId);
        if (conversation) {
          setOpenedConversations([...openedConversations, conversation]);
          setCurrentOpenedConversation(conversation);
        } else {
          loading.current = true;
          getConversationById(conversationId).then(() => (loading.current = false));
        }
      }
    }
  }, [conversations, conversationId, openedConversations]);

  const closeTab = (tabIndex: number) => {
    setOpenedConversations((openedConversation) =>
      openedConversation.filter((conversation, index) => index !== tabIndex)
    );
    navigate(
      openedConversations.length > 1
        ? "/conversations/" + (openedConversations[tabIndex + 1]?._id || openedConversations[tabIndex - 1]?._id)
        : "/conversations"
    );
  };

  const closeOtherTabs = (e: React.MouseEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    navigate("/conversations/" + openedConversations[index]._id);
    setOpenedConversations([openedConversations[index]]);
  };

  const closeAllTabs = () => {
    navigate("/conversations");
    setOpenedConversations([]);
  };

  const selectTab = (id: string | null) => navigate("/conversations/" + id!);

  return (
    <div id="splitContainer">
      <div id="left">
        <ConversationList filteredConversations={filteredConversations} />
      </div>
      <div id="right">
        {currentOpenedConversation && (
          <div id="openedFlashcards">
            <TabNav
              tabsData={openedConversations.map(({ _id, multiLingualSentences }) => {
                return {
                  id: _id,
                  text: multiLingualSentences[0]?.sourceLanguage?.text || "",
                };
              })}
              selectedId={conversationId}
              closeTab={closeTab}
              closeOtherTabs={closeOtherTabs}
              closeAllTabs={closeAllTabs}
              selectTab={selectTab}
            />
            <ConversationDetail conversation={currentOpenedConversation} />
          </div>
        )}
      </div>
    </div>
  );
}
