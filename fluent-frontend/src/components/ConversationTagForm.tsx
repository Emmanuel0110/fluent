import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { ConversationTag } from "../types";
import { useTranslation } from "react-i18next";

export default function ConversationTagForm() {
  const { t } = useTranslation();
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
          placeholder={t("tag.source_label")}
        />
        <input
          type="text"
          value={localTargetLabel}
          onChange={(e) => setLocalTargetLabel(e.target.value)}
          placeholder={t("tag.target_label")}
        />
      </div>
      <button onClick={createTag}>{t("tag.create")}</button>
    </div>
  );
}
