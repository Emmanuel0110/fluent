import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { ConversationTag } from "../types";

export default function ConversationTagForm() {
  const { sourceLanguage, targetLanguage } = useLanguage();
  const { saveConversationTag } = useData();
  const [localSourceLabel, setLocalSourceLabel] = useState<string>("");
  const [localTargetLabel, setLocalTargetLabel] = useState<string>("");

  const createTag = async () => {
    if (localSourceLabel.trim() && localTargetLabel.trim()) {
      const newTag: ConversationTag = {
        _id: "",
        sourceLabel: localSourceLabel.trim(),
        targetLabel: localTargetLabel.trim(),
      };
      await saveConversationTag(newTag);
      setLocalSourceLabel("");
      setLocalTargetLabel("");
    }
  };

  return (
    <div className="conversation-tag-form">
      <div className="conversation-tag-form-inputs">
        <input
          type="text"
          value={localSourceLabel}
          onChange={(e) => setLocalSourceLabel(e.target.value)}
          placeholder="Source label"
        />
        <input
          type="text"
          value={localTargetLabel}
          onChange={(e) => setLocalTargetLabel(e.target.value)}
          placeholder="Target label"
        />
      </div>
      <button onClick={createTag}>Create conversation tag</button>
    </div>
  );
}
