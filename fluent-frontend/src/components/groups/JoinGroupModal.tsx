import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { joinGroup } from "../../APICalls";

interface Props {
  onClose: () => void;
  // Called with the joined group's id so the parent can navigate to it.
  onJoined: (groupId: string) => void;
}

export function JoinGroupModal({ onClose, onJoined }: Props) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!code.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await joinGroup(code.trim());
    setSubmitting(false);
    if (res && (res as any).success) {
      onJoined((res as any).data._id);
    } else {
      // Backend returns a specific message for a target language the user isn't learning.
      setError((res as any)?.message || t("group.error_generic"));
    }
  };

  return createPortal(
    <div className="blockerDarkBackground" onClick={onClose}>
      <div id="above" onClick={(e) => e.stopPropagation()}>
        <h3>{t("group.join")}</h3>
        <input
          className="form-control"
          type="text"
          value={code}
          placeholder={t("group.code_placeholder")}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
        {error && <p className="group-error">{error}</p>}
        <div className="group-modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {t("common.cancel")}
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={!code.trim() || submitting}>
            {t("group.join")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
