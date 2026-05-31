import React, { useState } from "react";
import { resetPassword } from "../authActions";
import { Link, useSearchParams } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";

function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwords_no_match"));
      return;
    }
    resetPassword(token, newPassword, setSuccess, setError);
  };

  return (
    <div id="loginForm">
      <h5 className="mb-3">{t("auth.reset_password_title")}</h5>
      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {!success && (
        <Form>
          <Form.Group className="formgroup">
            <Form.Label>{t("auth.new_password")}</Form.Label>
            <Form.Control
              id="newPassword"
              name="newPassword"
              type="password"
              onChange={(e) => setNewPassword((e.target as HTMLInputElement).value)}
            />
          </Form.Group>
          <Form.Group className="formgroup">
            <Form.Label>{t("auth.confirm_password")}</Form.Label>
            <Form.Control
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              onChange={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
            />
          </Form.Group>
          <Button className="loginButton" onClick={onSubmit}>
            {t("auth.reset_password_submit")}
          </Button>
        </Form>
      )}
      {success && (
        <div className="text-center mt-4">
          <Link to="/login" className="text-primary fw-semibold text-decoration-none">
            {t("auth.login")}
          </Link>
        </div>
      )}
    </div>
  );
}

export default ResetPassword;
