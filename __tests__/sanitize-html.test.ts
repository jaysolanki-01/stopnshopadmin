import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '@/lib/security/sanitize-html';

describe('sanitizeHtml', () => {
  it('preserves allowed formatting tags', () => {
    const input = '<p>Hello <strong>world</strong> and <em>italic</em></p>';
    expect(sanitizeHtml(input)).toBe('<p>Hello <strong>world</strong> and <em>italic</em></p>');
  });

  it('preserves headings', () => {
    const input = '<h2>Title</h2><h3>Subtitle</h3>';
    expect(sanitizeHtml(input)).toBe('<h2>Title</h2><h3>Subtitle</h3>');
  });

  it('preserves lists', () => {
    const input = '<ul><li>one</li><li>two</li></ul>';
    expect(sanitizeHtml(input)).toBe('<ul><li>one</li><li>two</li></ul>');
  });

  it('strips script tags and their content', () => {
    const input = '<p>Safe</p><script>alert("xss")</script><p>Also safe</p>';
    expect(sanitizeHtml(input)).toBe('<p>Safe</p><p>Also safe</p>');
  });

  it('strips style tags and their content', () => {
    const input = '<style>body{display:none}</style><p>visible</p>';
    expect(sanitizeHtml(input)).toBe('<p>visible</p>');
  });

  it('strips iframe tags', () => {
    const input = '<p>text</p><iframe src="https://evil.com"></iframe>';
    expect(sanitizeHtml(input)).toBe('<p>text</p>');
  });

  it('strips event handlers from allowed tags', () => {
    const input = '<p onclick="alert(1)">text</p>';
    expect(sanitizeHtml(input)).toBe('<p>text</p>');
  });

  it('strips disallowed tags but keeps text content', () => {
    const input = '<div>inside div</div>';
    expect(sanitizeHtml(input)).toBe('inside div');
  });

  it('strips HTML comments', () => {
    const input = '<p>before</p><!-- comment --><p>after</p>';
    expect(sanitizeHtml(input)).toBe('<p>before</p><p>after</p>');
  });

  it('allows links with safe attributes', () => {
    const input = '<a href="https://example.com" title="Example">link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('strips javascript: URLs from links', () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('strips object and embed tags', () => {
    const input = '<object data="evil.swf"></object><embed src="evil.swf">';
    expect(sanitizeHtml(input)).toBe('');
  });

  it('strips form tags and their content', () => {
    const input = '<form action="/steal"><input type="text"></form>';
    expect(sanitizeHtml(input)).toBe('');
  });
});
