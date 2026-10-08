import { afterEach, describe, expect, it } from 'vitest';
import { buildSelector, validateSelector } from '../src/content/selector';
afterEach(() => { document.body.innerHTML = ''; });
describe('element selection safety', () => {
  it('selects a unique semantic identifier', () => {
    document.body.innerHTML = '<aside id="advertisement">Ad</aside><main>Content</main>';
    const result = buildSelector(document.querySelector('aside')!);
    expect(document.querySelectorAll(result.selector)).toHaveLength(1);
    expect(result.unstable).toBe(false);
  });
  it('rejects page roots, extension UI and malformed selectors', () => {
    for (const selector of ['html', 'body', '*', 'main {color:red}', '[']) expect(() => validateSelector(selector)).toThrow();
    document.body.innerHTML = '<div data-focusmask-host="">UI</div>';
    expect(() => buildSelector(document.querySelector('div')!)).toThrow();
  });
  it('accepts a selector with no current match', () => {
    expect(validateSelector('.absent')).toBe('.absent');
  });
});
