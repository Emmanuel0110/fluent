/**
 * API error with status and message from backend when available.
 */
export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: { message?: string; errors?: unknown }) {
    super(message);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** User-facing message: backend message, or validation errors, or default for status, or generic. */
  get userMessage(): string {
    if (this.body?.message) return this.body.message;
    if (Array.isArray(this.body?.errors) && (this.body.errors as any[]).length > 0) {
      return (this.body.errors as { message: string }[]).map((e) => e.message).join(". ");
    }
    if (this.status === 401) return "Session expired or invalid. Please log in again.";
    if (this.status === 403) return "You are not allowed to do this.";
    if (this.status >= 500) return "Something went wrong. Please try again later.";
    return this.message || "Request failed.";
  }
}

let onUnauthorized: (() => void) | null = null;

/** Register a callback to run on 401 (e.g. clear token and auth state). AuthProvider should set this. */
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

/**
 * Fetch wrapper: parses JSON, throws ApiError with backend message on non-2xx.
 * On 401, calls onUnauthorized() then throws (so app can logout).
 */
export const customFetch = async (input: RequestInfo, init?: RequestInit): Promise<any> => {
  const response = await fetch(input, init);
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    let body: { message?: string; errors?: unknown } | undefined;
    try {
      if (isJson) body = await response.json();
    } catch {
      // ignore
    }
    const message = body?.message ?? (response.statusText || "Request failed");

    if (response.status === 401) {
      onUnauthorized?.();
    }

    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) return undefined;
  return isJson ? response.json() : response.text();
};

/** Headers with auth token for API requests */
export const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) headers["x-auth-token"] = token;
  return headers;
};
