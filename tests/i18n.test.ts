import { afterEach, expect, it, vi } from 'vitest';
import { resolveLanguage, setLanguage, t } from '../src/shared/i18n';
afterEach(() => { setLanguage('auto'); vi.unstubAllGlobals(); history.replaceState({}, '', '/'); });
it('uses simplified Chinese for Chinese browser languages and English for all other languages', () => {
  for (const language of ['zh', 'zh-CN', 'zh-TW', 'zh-HK', 'zh-Hant', 'zh-SG']) expect(resolveLanguage('auto', language)).toBe('zh-CN');
  for (const language of ['en-US', 'ja-JP', 'fr', 'de', '']) expect(resolveLanguage('auto', language)).toBe('en');
  expect(resolveLanguage('en', 'zh-TW')).toBe('en');
  expect(resolveLanguage('zh-CN', 'en-US')).toBe('zh-CN');
});
it('prefers browser UI language, updates labels and normalizes the document language', () => {
  vi.stubGlobal('chrome', { i18n: { getUILanguage: () => 'zh-TW' } });
  setLanguage('auto'); expect(t('settings')).toBe('扩展设置'); expect(document.documentElement.lang).toBe('zh-CN');
  setLanguage('en'); expect(t('settings')).toBe('Settings'); expect(document.documentElement.lang).toBe('en');
});
it('leaves the source webpage language unchanged when updating injected controls', () => {
  document.documentElement.lang = 'ja';
  setLanguage('zh-CN', false);
  expect(t('protected')).toBe('此页面已模糊');
  expect(document.documentElement.lang).toBe('ja');
});

it('translates the settings tab title when the language changes', () => {
  history.replaceState({}, '', '/options/index.html');
  setLanguage('zh-CN'); expect(document.title).toBe('FocusMask · 扩展设置');
  setLanguage('en'); expect(document.title).toBe('FocusMask · Settings');
});
