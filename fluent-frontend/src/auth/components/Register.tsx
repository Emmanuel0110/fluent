import React, { useState, useEffect } from "react";
import { register, initiateSocialAuth, handleOAuthCallback } from "../authActions";
import { Link, Navigate, useSearchParams, useLocation } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useAuth } from "../../contexts/AuthContext";
import SocialAuthButtons from "./SocialAuthButtons";
import { useTranslation } from "react-i18next";

function Register() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { sourceLanguageId, targetLanguageId } = (location.state as { sourceLanguageId?: string; targetLanguageId?: string }) ?? {};
  const { isAuthenticated, setIsAuthenticated, setUser } = useAuth();

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const provider = searchParams.get("provider") as "google" | null;

    if (errorParam) {
      setError("Sign-in was cancelled or failed.");
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && provider === "google") {
      handleOAuthCallback(provider, code, setIsAuthenticated, setUser, setError);
    }
  }, [searchParams, setIsAuthenticated, setUser]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ username, password, email, sourceLanguageId, targetLanguageId }, setIsAuthenticated, setUser, setError);
  };

  const handleGoogleAuth = () => {
    initiateSocialAuth("google");
  };

  if (isAuthenticated) {
    return <Navigate to="/words" />;
  }
  return (
    <>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      <Form id="loginForm" onSubmit={onSubmit}>
        <Form.Group className="formgroup">
          <Form.Label>{t("auth.username")}</Form.Label>
          <Form.Control
            id="username"
            name="username"
            type="text"
            onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
          />
        </Form.Group>
        <Form.Group className="formgroup">
          <Form.Label>{t("auth.password")}</Form.Label>
          <Form.Control
            id="password"
            name="password"
            type="password"
            onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
          />
        </Form.Group>
        <Form.Group className="formgroup">
          <Form.Label>{t("auth.email")}</Form.Label>
          <Form.Control
            id="email"
            name="email"
            type="email"
            onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
          />
        </Form.Group>
        <Button className="loginButton" type="submit">
          {t("auth.register")}
        </Button>
      </Form>
      <SocialAuthButtons onGoogleClick={handleGoogleAuth} />
      <div className="text-center mt-4">
        <p className="mb-0 small text-muted">
          {t("auth.back_to_login") + " "}
          <Link to="/login" className="text-primary fw-semibold text-decoration-none">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </>
  );
}

export default Register;
