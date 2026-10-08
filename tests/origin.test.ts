import { describe, expect, it } from 'vitest';
import { normalizeOrigin, originPattern } from '../src/shared/origin';
describe('exact origin scope', () => {
  it('normalizes origins without preserving private paths', () => {
    expect(normalizeOrigin('https://example.com:443/a?token=secret')).toBe('https://example.com');
    expect(normalizeOrigin('http://localhost:5173/page')).toBe('http://localhost:5173');
  });
  it('uses explicit effective ports for early CSS matching', () => {
    expect(originPattern('https://example.com')).toBe('https://example.com:443/*');
    expect(originPattern('http://localhost:5173')).toBe('http://localhost:5173/*');
  });
  it.each(['chrome://settings', 'file:///a', 'https://chromewebstore.google.com/detail/a', 'https://microsoftedge.microsoft.com/addons/detail/a'])('rejects unsupported page %s', (url) => {
    expect(() => normalizeOrigin(url)).toThrow();
  });
});
