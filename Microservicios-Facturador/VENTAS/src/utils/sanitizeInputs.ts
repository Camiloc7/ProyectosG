import sanitizeHtml from "sanitize-html";

export const sanitizeInput = (text: string) => {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
};
