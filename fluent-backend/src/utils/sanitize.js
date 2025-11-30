import sanitizeHtml from "sanitize-html";

/**
 * Sanitize HTML content for language learning content
 * Allows basic formatting but removes dangerous scripts and tags
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== "string") return text;

  return sanitizeHtml(text, {
    allowedTags: [], // Remove all HTML tags for text content
    allowedAttributes: {},
    allowedIframeHostnames: [],
  });
};

/**
 * Recursively sanitize an object's string properties
 */
export const sanitizeObject = (obj, sanitizeFn = sanitizeText) => {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeFn(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
