import { useContext } from "react";
import { ConfigContext } from "../../App";
import { Context, Conversation, Word } from "../../types";
import { ConversationLine } from "./ConversationLine";

export default function WordDetail({ word, usedIn }: { word: Word; usedIn: Conversation[] }) {
  const {
    openWord,
    wordTags,
    setSearchFilter,
  } = useContext(ConfigContext) as Context;

  const searchTag = (tagLabel: string) => {
    setSearchFilter([{ isActive: true, data: ["#" + tagLabel] }]);
  };

  return (
    <div id="flashCardComponent">
      <div id="flashcard">
        <div id="previous">
          <div
            className={"subscribe" + (word.subscribed ? " subscribed" : "")}
          ></div>
        </div>
        <div id="middle">
        <div className={"lineTitle"}>
        {word.sourceLanguage +
          " : " +
          word.targetLanguage.map(({ id, label }) => (
            <span className="wordLabel" onClick={e => openWord(id)}>
              {label}
            </span>
          ))}
      </div>

          <div id="tags">
            {word &&
              word.tags.map((tagId, index) => {
                const tag = wordTags.find(tag => tag._id === tagId);
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
              <div className="flashcardSection">Used in</div>
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
