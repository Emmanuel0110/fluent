import { Dispatch, SetStateAction } from "react";
import { url } from "../App";
import { User } from "../types";
import { customFetch, authHeaders, ApiError } from "../utils/http-helpers";

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.userMessage;
  if (err instanceof Error) return err.message;
  return String(err);
}

//Check token & load user
export const loadUser = (
  setUser: Dispatch<SetStateAction<User | null>>,
  setIsAuthenticated: Dispatch<React.SetStateAction<boolean | null>>,
  setUserIsLoading: Dispatch<React.SetStateAction<boolean>>
) => {
  customFetch(url + "users/auth", { headers: authHeaders() })
    .then((res) => {
      const { user, sourceLanguage, targetLanguage } = res;
      setUser({ ...user, sourceLanguage, targetLanguage });
      setIsAuthenticated(true);
    })
    .catch((err: Error) => {
      setUser(null);
      setIsAuthenticated(false);
    })
    .finally(() => {
      setUserIsLoading(false);
    });
};

export const register = (
  { username, password, email }: { username: string; password: string; email: string },
  setIsAuthenticated: (b: boolean) => void,
  setUser: (user: any) => void,
  setError?: (message: string) => void
) => {
  setError?.("");
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({ username, password, email });
  customFetch(url + "users", { method: "POST", headers, body })
    .then((res: any) => {
      if (!res.token) throw new Error(res.message || res.msg || "Registration failed");
      const { user, sourceLanguage, targetLanguage } = res;
      setUser({ ...user, sourceLanguage, targetLanguage });
      setIsAuthenticated(true);
      localStorage.setItem("token", res.token);
    })
    .catch((err) => {
      setIsAuthenticated(false);
      setError?.(getErrorMessage(err));
    });
};

export const login = (
  { username, password }: { username: string; password: string },
  setIsAuthenticated: (b: boolean) => void,
  setUser: (user: any) => void,
  setError?: (message: string) => void
) => {
  setError?.("");
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({ username, password });
  customFetch(url + "users/auth", { method: "POST", headers, body })
    .then((res) => {
      if (!res.token) throw new Error(res.message || res.msg || "Login failed");
      const { user, sourceLanguage, targetLanguage } = res;
      setUser({ ...user, sourceLanguage, targetLanguage });
      setIsAuthenticated(true);
      localStorage.setItem("token", res.token);
    })
    .catch((err) => {
      setIsAuthenticated(false);
      setError?.(getErrorMessage(err));
    });
};

//Social Authentication
export const initiateSocialAuth = (provider: "google") => {
  // Redirect to backend OAuth endpoint
  const backendUrl = url?.replace(/\/$/, ""); // Remove trailing slash if present
  window.location.href = `${backendUrl}/users/auth/${provider}`;
};

// Handle OAuth callback
export const handleOAuthCallback = (
  provider: "google",
  code: string,
  setIsAuthenticated: (b: boolean) => void,
  setUser: (user: any) => void,
  setError?: (message: string) => void
) => {
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({ code });
  const backendUrl = url?.replace(/\/$/, ""); // Remove trailing slash if present
  customFetch(`${backendUrl}/users/auth/${provider}/callback`, { method: "POST", headers, body })
    .then((res) => {
      if (!res.token) throw new Error(res.message || res.msg || "Authentication failed");
      const { user, sourceLanguage, targetLanguage } = res;
      setUser({ ...user, sourceLanguage, targetLanguage });
      setIsAuthenticated(true);
      localStorage.setItem("token", res.token);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    })
    .catch((err) => {
      setIsAuthenticated(false);
      setError?.(getErrorMessage(err));
      window.history.replaceState({}, document.title, window.location.pathname);
    });
};

export const updateEmail = (email: string): Promise<string> => {
  return customFetch(url + "users/email", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ email }),
  }).then((res: any) => res.email);
};

export const forgotPassword = (
  email: string,
  setSuccess: (msg: string) => void,
  setError: (msg: string) => void
) => {
  setError("");
  customFetch(url + "users/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
    .then((res: any) => setSuccess(res.message))
    .catch((err) => setError(getErrorMessage(err)));
};

export const resetPassword = (
  token: string,
  newPassword: string,
  setSuccess: (msg: string) => void,
  setError: (msg: string) => void
) => {
  setError("");
  customFetch(url + "users/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  })
    .then((res: any) => setSuccess(res.message))
    .catch((err) => setError(getErrorMessage(err)));
};

export const deleteAccount = (password?: string): Promise<void> => {
  return customFetch(url + "users", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ password }),
  }).then(() => undefined);
};

export const exportUserData = (): Promise<void> => {
  return customFetch(url + "users/export", {
    headers: authHeaders(),
  }).then((data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = "fluent-my-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  });
};

//Logout User
export const logout = (setIsAuthenticated: (arg: boolean) => void) => {
  window.localStorage.removeItem("token");
  setIsAuthenticated(false);
  //window.location.href = '/'; //Force a browser refresh to clear in-memory data
};
