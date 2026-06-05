import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { deleteAccount } from "../../auth/authActions";
import { ApiError } from "../../utils/http-helpers";

interface Props {
  onClose: () => void;
}

function DeleteAccountConfirmDialog({ onClose }: Props) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteAccount(user?.oauthProvider ? undefined : password);
      logout();
    } catch (err) {
      setError(err instanceof ApiError ? err.userMessage : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="blockerDarkBackground" onClick={onClose}>
      <div id="above" onClick={(e) => e.stopPropagation()}>
        <p>{t("profile.delete_confirm_warning")}</p>

        {!user?.oauthProvider && (
          <div style={{ marginTop: "12px" }}>
            <label htmlFor="delete-password" style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem" }}>
              {t("profile.delete_confirm_password")}
            </label>
            <input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="profile-input"
              autoFocus
            />
          </div>
        )}

        {error && (
          <p className="profile-error" style={{ marginTop: "8px" }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </button>
          <button className="delete-btn" onClick={handleConfirm} disabled={loading}>
            {loading ? t("profile.deleting") : t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteAccountConfirmDialog;
