import { useContext } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context, Conversation, Word } from "../types";
import { ConversationLine } from "./ConversationLine";
import { useData } from "../contexts/DataContext";
import { WordDefinition } from "./WordDefinition";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";

export default function WordDetail({ word, usedIn }: { word: Word; usedIn: Conversation[] }) {
  const { t } = useTranslation();
  const { wordTags } = useData();
  const { setTagFilter, setSearchFilter, editWord } = useContext(ConfigContext) as Context;
  const { user } = useAuth();
  const navigate = useNavigate();

  const searchTag = (tagId: string) => {
    setTagFilter(wordTags.find(({ _id }) => _id === tagId) || null);
    setSearchFilter("");
    navigate("/words");
  };

  return (
    <div id="detail-container">
      <div id="detail-card">
        {user?.isAdmin && (
          <div id="detail-card-left">
            <div className="edit" onClick={() => editWord(word._id)}></div>
          </div>
        )}
        <div id="detail-card-main">
          <WordDefinition word={word} />
          <div id="word-tags">
            {word &&
              word.tags.map((tagId, index) => {
                const tag = wordTags.find((tag) => tag._id === tagId);
                if (tag)
                  return (
                    <div
                      key={index}
                      className="word-tag"
                      style={{ cursor: "pointer" }}
                      onClick={() => searchTag(tag._id)}
                    >
                      {"#" + tag.label}
                    </div>
                  );
              })}
          </div>
          {usedIn.length > 0 && (
            <div id="usedIn">
              <div className="usedInSection">{t("word.used_in")}</div>
              {usedIn.map((conversation, index) => (
                <ConversationLine key={index} conversation={conversation} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
