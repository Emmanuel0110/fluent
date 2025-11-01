import { Conversation } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";
import TabNav from "./layout/TabNav";
import ConversationList from "./ConversationList";
import ConversationDetail from "./ConversationDetail";
import { useData } from "../contexts/DataContext";

export default function ConversationListWithDetail() {
  const { conversations, getConversationById } = useData();
  const { setOpenedConversations, filteredConversations, openedConversations } = useContext(ConfigContext) as Context;
  const conversationId = useParams().conversationId!;
  const [currentOpenedConversation, setCurrentOpenedConversation] = useState<Conversation | null>(null);
  const loading = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading.current) {
      if (conversationId) {
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
      } else {
        setCurrentOpenedConversation(null);
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
        : "/suggestions"
    );
  };

  const closeOtherTabs = (e: React.MouseEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    navigate("/conversations/" + openedConversations[index]._id);
    setOpenedConversations([openedConversations[index]]);
  };

  const closeAllTabs = () => {
    navigate("/suggestions");
    setOpenedConversations([]);
  };

  const selectTab = (id: string | null) => navigate("/conversations/" + id!);

  return (
    <div id="splitContainer" className={currentOpenedConversation ? "openRightPannel" : "closeRightPannel"}>
      <div id="left">
        <ConversationList />
      </div>
      <div id="right">
        <div id="detailRightPanel" className={currentOpenedConversation ? "open" : "close"}>
          {currentOpenedConversation && (
            <div id="openedConversations">
              <TabNav
                tabsData={openedConversations.map(({ _id, multiLingualSentences }) => ({
                  id: _id,
                  text: multiLingualSentences[0]?.sourceLanguage?.text || "",
                }))}
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
    </div>
  );
}
