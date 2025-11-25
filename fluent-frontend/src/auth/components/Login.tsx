import React, { useState, useEffect } from "react";
import { login, initiateSocialAuth, handleOAuthCallback } from "../authActions";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useAuth } from "../../contexts/AuthContext";
import SocialAuthButtons from "./SocialAuthButtons";
import { useTranslation } from "react-i18next";

function Login() {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const { isAuthenticated, setIsAuthenticated, setUser } = useAuth();

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const provider = searchParams.get("provider") as "google" | "linkedin" | "facebook" | null;

    if (error) {
      console.error("OAuth error:", error);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code && provider && (provider === "google" || provider === "linkedin" || provider === "facebook")) {
      handleOAuthCallback(provider, code, setIsAuthenticated, setUser);
    }
  }, [searchParams, setIsAuthenticated, setUser]);

  const onSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    login({ username, password }, setIsAuthenticated, setUser);
  };

  const handleGoogleAuth = () => {
    initiateSocialAuth("google");
  };

  const handleLinkedInAuth = () => {
    initiateSocialAuth("linkedin");
  };

  const handleFacebookAuth = () => {
    initiateSocialAuth("facebook");
  };

  if (isAuthenticated) {
    return <Navigate to="/review" />;
  }
  return (
    <>
      <Form id="loginForm">
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
        <Button className="loginButton" onClick={onSubmit}>
          {t("auth.login")}
        </Button>
      </Form>
      <SocialAuthButtons
        onGoogleClick={handleGoogleAuth}
        onLinkedInClick={handleLinkedInAuth}
        onFacebookClick={handleFacebookAuth}
      />
      <div className="text-center mt-4">
        <p className="mb-0 small text-muted">
          {t("auth.no_account") + " "}
          <Link to="/register" className="text-primary fw-semibold text-decoration-none">
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </>
  );
}

export default Login;
