import React, { useState } from "react";
import { forgotPassword } from "../authActions";
import { Link } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useTranslation } from "react-i18next";

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    forgotPassword(email, setSuccess, setError);
  };

  return (
    <div id="loginForm">
      <h5 className="mb-3">{t("auth.forgot_password_title")}</h5>
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
            <Form.Label>{t("auth.email")}</Form.Label>
            <Form.Control
              id="email"
              name="email"
              type="email"
              onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
            />
          </Form.Group>
          <Button className="loginButton" onClick={onSubmit}>
            {t("auth.forgot_password_submit")}
          </Button>
        </Form>
      )}
      <div className="text-center mt-4">
        <p className="mb-0 small text-muted">
          {t("auth.back_to_login") + " "}
          <Link to="/login" className="text-primary fw-semibold text-decoration-none">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
