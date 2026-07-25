import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { createGroup } from "../../APICalls";

interface Props {
  onClose: () => void;
  // Called after a successful creation so the parent can refresh its group list.
  onCreated: () => void;
}

export function CreateGroupModal({ onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Once created, we show the invite code so the creator can share it before closing.
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await createGroup(name.trim());
    setSubmitting(false);
    if (res && (res as any).success) {
      setInviteCode((res as any).data.inviteCode);
      onCreated();
    } else {
      setError((res as any)?.message || t("group.error_generic"));
    }
  };

  const copyCode = async () => {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
  };

  return createPortal(
    <div className="blockerDarkBackground" onClick={onClose}>
      <div id="above" onClick={(e) => e.stopPropagation()}>
        {inviteCode ? (
          <>
            <h3>{t("group.created_title")}</h3>
            <p>{t("group.share_code")}</p>
            <div className="group-code-display">
              <span className="group-code">{inviteCode}</span>
              <button className="btn btn-secondary" onClick={copyCode}>
                {copied ? t("group.copied") : t("group.copy")}
              </button>
            </div>
            <div className="group-modal-actions">
              <button className="btn btn-primary" onClick={onClose}>
                {t("group.done")}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{t("group.create")}</h3>
            <input
              className="form-control"
              type="text"
              value={name}
              maxLength={60}
              placeholder={t("group.name_placeholder")}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
            {error && <p className="group-error">{error}</p>}
            <div className="group-modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                {t("common.cancel")}
              </button>
              <button className="btn btn-primary" onClick={submit} disabled={!name.trim() || submitting}>
                {t("group.create")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
