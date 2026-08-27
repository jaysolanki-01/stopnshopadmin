// Server-side HTML sanitizer for product descriptions.
// Allows basic formatting tags, strips everything else (scripts, event handlers, etc.)

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'span', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'sub', 'sup',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan']),
};

// Matches HTML tags (opening, closing, self-closing)
const TAG_RE = /<\/?([a-z][a-z0-9]*)\b([^>]*)\/?\s*>/gi;
const ATTR_RE = /([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*))/gi;

// Dangerous patterns in attribute values
const DANGEROUS_VALUE = /^(javascript|data|vbscript):/i;

function sanitizeAttrs(tagName: string, rawAttrs: string): string {
  const allowed = ALLOWED_ATTRS[tagName];
  if (!allowed) return '';

  const safe: string[] = [];
  let match: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;

  while ((match = ATTR_RE.exec(rawAttrs)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';

    if (!allowed.has(name)) continue;
    if (DANGEROUS_VALUE.test(value.trim())) continue;

    safe.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
  }

  // Force rel="noopener noreferrer" on links
  if (tagName === 'a') {
    const hasRel = safe.some((a) => a.startsWith('rel='));
    if (!hasRel) safe.push('rel="noopener noreferrer"');
  }

  return safe.length > 0 ? ' ' + safe.join(' ') : '';
}

export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // Strip HTML comments
  let result = input.replace(/<!--[\s\S]*?-->/g, '');

  // Strip <script>, <style>, <iframe>, <object>, <embed>, <form> tags and their content
  result = result.replace(/<(script|style|iframe|object|embed|form)\b[\s\S]*?<\/\1>/gi, '');

  // Strip on* event handlers from any remaining tags
  result = result.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Process remaining tags
  result = result.replace(TAG_RE, (fullMatch, tagName: string, attrs: string) => {
    const tag = tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    const isClosing = fullMatch.startsWith('</');
    if (isClosing) return `</${tag}>`;
    const safeAttrs = sanitizeAttrs(tag, attrs);
    return `<${tag}${safeAttrs}>`;
  });

  return result.trim();
}
