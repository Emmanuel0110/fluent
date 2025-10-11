import { useContext } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context, Conversation, Word } from "../types";
import { ConversationLine } from "./ConversationLine";
import { useData } from "../contexts/DataContext";
import { WordDefinition } from "./WordDefinition";
import { useNavigate } from "react-router-dom";

export default function WordDetail({ word, usedIn }: { word: Word; usedIn: Conversation[] }) {
  const { wordTags } = useData();
  const { setTagFilter } = useContext(ConfigContext) as Context;
  const navigate = useNavigate();

  const searchTag = (tagId: string) => {
    setTagFilter(wordTags.find(({ _id }) => _id === tagId) || null);
    navigate("/words");
  };

  return (
    <div id="detail-container">
      <div id="detail-card">
        <div id="detail-card-main">
          <WordDefinition word={word} />
          <div id="tags">
            {word &&
              word.tags.map((tagId, index) => {
                const tag = wordTags.find((tag) => tag._id === tagId);
                if (tag)
                  return (
                    <div key={index} className="tag" onClick={(e) => searchTag(tag._id)}>
                      {"#" + tag.label}
                    </div>
                  );
              })}
          </div>
          {usedIn.length > 0 && (
            <div id="usedIn">
              <div className="usedInSection">Used in</div>
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
