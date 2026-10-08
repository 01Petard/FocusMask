import { PrivacyScreen } from './privacy';
import { MediaMask } from './media';
import { ElementPicker } from './picker';
import { validateSelector } from './selector';
import uiCss from './ui.css?inline';
import type { ElementRule, GlobalConfig, PageState, Request, Response, SiteConfig } from '../shared/types';
import { defaultGlobal } from '../shared/types';
import { VERSION } from '../shared/version';
import { getLanguage, resolveLanguage, setLanguage } from '../shared/i18n';

const scope = globalThis as typeof globalThis & { __focusmaskController?: boolean };
if (!scope.__focusmaskController && document.documentElement && document.contentType === 'text/html') {
  scope.__focusmaskController = true;
  const host = document.createElement('div'); host.setAttribute('data-focusmask-host', ''); document.documentElement.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const styles = document.createElement('style'); styles.textContent = uiCss; shadow.append(styles);
  const cleanStyles = document.createElement('style'); document.documentElement.append(cleanStyles);
  const privacy = new PrivacyScreen(shadow);
  const media = new MediaMask(shadow);
  let site: SiteConfig | null = null;
  let active = false;
  let previousPrivacy = false;
  let previousActive = false;
  let previousAuthorized = false;
  let clean = false;
  let masking = false;
  async function request<T>(message: Request): Promise<T> {
    const response: Response<T> = await chrome.runtime.sendMessage(message);
    if (!response?.ok) throw new Error(response?.error ?? 'page-unavailable');
    return response.data;
  }
  const picker = new ElementPicker(shadow,
    selector => request<ElementRule>({ type: 'rule-add', origin: location.origin, selector }),
    id => request<void>({ type: 'rule-update', origin: location.origin, id, remove: true }));
  const state = (): PageState => ({ version: VERSION, protected: privacy.protected, protectionEnabled: privacy.enabled, picking: picker.active, clean, media: masking });
  if (getComputedStyle(document.documentElement).getPropertyValue('--focusmask-privacy-bootstrap').trim() === '1') privacy.protect();
  let refreshNumber = 0;
  let cssInUse = '';
  let effectsInstalled = false;
  let styleUpdates: Promise<unknown> = Promise.resolve();
  async function refresh() {
    const number = ++refreshNumber;
    try {
      const config = await request<{ global: GlobalConfig; site: SiteConfig | null; authorized: boolean }>({ type: 'page-config' });
      if (number !== refreshNumber) return;
      const language = config.global.language ?? 'auto';
      const languageChanged = getLanguage() !== language;
      setLanguage(language, false); host.lang = resolveLanguage(language);
      if (languageChanged) { privacy.updateLanguage(); media.updateLanguage(); picker.updateLanguage(); }
      site = config.site;
      const timing = { ...defaultGlobal, ...config.global };
      privacy.configure(timing); media.configure(timing); picker.configure(timing);
      privacy.setTrigger(config.global.revealTrigger ?? 'click');
      media.setTrigger(config.global.revealTrigger ?? 'click');
      if (!config.authorized) effectsInstalled = false;
      active = config.global.enabled && config.authorized && !!site?.enabled && site.origin === location.origin;
      const privacyEnabled = active && !!site?.privacyEnabled;
      clean = active && !!site?.cleanEnabled;
      masking = active && !!site?.mediaEnabled;
      document.documentElement.setAttribute('data-focusmask-clean-enabled', clean ? 'on' : 'off');
      cleanStyles.textContent = clean ? site!.rules.filter(rule => rule.enabled).map(rule => {
        try { return `html[data-focusmask-clean-enabled="on"] body :is(${validateSelector(rule.selector)}) { display: none !important; }`; }
        catch { return ''; }
      }).join('\n') : '';
      // USER importance overrides the site's inline !important without changing its original styles.
      styleUpdates = styleUpdates.catch(() => undefined).then(async () => {
        if (number !== refreshNumber) return;
        cssInUse = await request<string>({ type: 'clean-style', previous: cssInUse, installEffects: !effectsInstalled });
        effectsInstalled = config.authorized;
      });
      await styleUpdates;
      if (number !== refreshNumber) return;
      if (masking) media.start(); else media.stop();
      if (privacyEnabled && !previousPrivacy) { picker.stop(); privacy.protect(); }
      else if (!privacyEnabled && previousPrivacy || !config.global.enabled || previousActive && !active || previousAuthorized && !config.authorized) privacy.reset();
      else if (!privacyEnabled && !privacy.protected) document.documentElement.setAttribute('data-focusmask-privacy', 'off');
      previousPrivacy = privacyEnabled;
      previousActive = active;
      previousAuthorized = config.authorized;
      if (!active) picker.stop();
      document.documentElement.setAttribute('data-focusmask-ready', '');
    } catch {
      // Never release a page already protected when configuration cannot be read.
      if (privacy.protected || getComputedStyle(document.documentElement).getPropertyValue('--focusmask-privacy-bootstrap').trim() === '1') privacy.protect(true);
      throw new Error('page-unavailable');
    }
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'refresh-config') {
      void refresh().then(() => sendResponse({ ok: true, data: state() })).catch(() => sendResponse({ ok: false, error: 'page-unavailable' })); return true;
    }
    if (message?.type !== 'command') return false;
    try {
      if (message.command === 'pick') { if (!active || privacy.protected) throw new Error('unauthorized'); picker.start(); }
      else if (message.command === 'protect') { picker.stop(); privacy.protect(); }
      else if (message.command === 'toggle-protect') {
        // Commands are browser-level events; page keyup is not guaranteed to be delivered.
        picker.stop(); privacy.toggle();
      }
      else if (message.command === 'unlock') privacy.unlock();
      else if (message.command === 'reprotect') privacy.onHidden();
      else if (message.command !== 'state') throw new Error('request-invalid');
      sendResponse({ ok: true, data: state() });
    } catch (error) { sendResponse({ ok: false, error: error instanceof Error ? error.message : 'page-unavailable' }); }
    return false;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) privacy.onHidden(); });
  window.addEventListener('pagehide', () => { picker.stop(); privacy.onHidden(); media.stop(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { privacy.onHidden(); void refresh().catch(() => undefined); } });
  document.addEventListener('DOMContentLoaded', () => privacy.ensureBody(), { once: true });
  void refresh().catch(() => undefined);
}
