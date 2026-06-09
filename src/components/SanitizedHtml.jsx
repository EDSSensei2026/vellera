import DOMPurify from 'dompurify';

export function SanitizedHtml({ rawHtml }) {
  // Cleans out malicious scripts or hidden iframe injections before rendering
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });

  return <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}