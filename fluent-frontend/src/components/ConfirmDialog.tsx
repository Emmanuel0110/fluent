import React from "react";
import { useTranslation } from "react-i18next";

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  return (
    <div className="blockerDarkBackground" onClick={onCancel}>
      <div id="above" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
          <button className="btn btn-secondary" onClick={onCancel}>{t("common.cancel")}</button>
          <button className="btn delete-btn" onClick={onConfirm}>{t("common.delete")}</button>
        </div>
      </div>
    </div>
  );
}
