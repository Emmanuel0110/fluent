import { useContext } from "react";
import { ConfigContext } from "../App";
import { Context, Conversation, Word } from "../types";
import { ConversationLine } from "./ConversationLine";
import { useData } from "../contexts/DataContext";
import { WordDefinition } from "./WordDefinition";

export default function WordDetail({ word, usedIn }: { word: Word; usedIn: Conversation[] }) {
  const { words, wordTags } = useData();
  const { openWord, setSearchFilter } = useContext(ConfigContext) as Context;

  const searchTag = (tagLabel: string) => {
    setSearchFilter([{ isActive: true, data: ["#" + tagLabel] }]);
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
                    <div key={index} className="tag" onClick={(e) => searchTag(tag.label)}>
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
