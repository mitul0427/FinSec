import DOMPurify from 'dompurify';

export const sanitizeText = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'span', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'class']
  });
};

export const sanitizePlain = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};
