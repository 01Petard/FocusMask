import { ConfigStore } from './storage';
import { normalizeOrigin, originPattern, permissionPattern } from '../shared/origin';
import type { Request, Response } from '../shared/types';
import { VERSION } from '../shared/version';

const store = new ConfigStore({ get: () => chrome.storage.local.get(null), set: items => chrome.storage.local.set(items), remove: key => chrome.storage.local.remove(key) });
let operations: Promise<unknown> = Promise.resolve();
const enqueue = <T>(fn: () => Promise<T>): Promise<T> => {
  const next = operations.then(fn);
  operations = next.catch(() => undefined);
  return next;
};
async function scriptId(origin: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(origin));
  return `fm-${Array.from(new Uint8Array(digest)).map(n => n.toString(16).padStart(2, '0')).join('')}`;
}
async function authorized(origin: string) { return chrome.permissions.contains({ origins: [permissionPattern(origin)] }); }
async function reconcile() {
  const { global, sites } = await store.read();
  const wanted: chrome.scripting.RegisteredContentScript[] = [];
  for (const site of sites) {
    if (!global.enabled || !site.enabled || !await authorized(site.origin)) continue;
    const css = ['effects.css'];
    if (site.privacyEnabled) css.push('privacy.css');
    if (site.mediaEnabled) css.push('media.css');
    wanted.push({ id: await scriptId(site.origin), matches: [originPattern(site.origin)], js: ['content.js'], css, runAt: 'document_start', persistAcrossSessions: true, allFrames: false, world: 'ISOLATED' });
  }
  const existing = (await chrome.scripting.getRegisteredContentScripts()).filter(s => s.id.startsWith('fm-'));
  const removed = existing.filter(s => !wanted.some(w => w.id === s.id));
  if (removed.length) await chrome.scripting.unregisterContentScripts({ ids: removed.map(s => s.id) });
  for (const descriptor of wanted) {
    const previous = existing.find(s => s.id === descriptor.id);
    if (!previous) await chrome.scripting.registerContentScripts([descriptor]);
    else if (JSON.stringify(previous.css) !== JSON.stringify(descriptor.css) || JSON.stringify(previous.matches) !== JSON.stringify(descriptor.matches)) await chrome.scripting.updateContentScripts([descriptor]);
  }
}
async function ensureContent(tabId: number) {
  let existing;
  try { existing = await chrome.tabs.sendMessage(tabId, { type: 'command', command: 'state' }, { frameId: 0 }); } catch { /* First injection has no listener. */ }
  if (existing?.ok) {
    if (existing.data?.version !== VERSION) throw new Error('page-reload-required');
    return;
  }
  await chrome.scripting.insertCSS({ target: { tabId, frameIds: [0] }, files: ['effects.css'], origin: 'USER' });
  await chrome.scripting.executeScript({ target: { tabId, frameIds: [0] }, files: ['content.js'], injectImmediately: true });
}
async function notifyPages() {
  const { global, sites } = await store.read();
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map(async tab => {
    if (!tab.id) return;
    try {
      const state = await chrome.tabs.sendMessage(tab.id, { type: 'command', command: 'state' }, { frameId: 0 });
      if (state?.ok && state.data?.version !== VERSION) { await chrome.action.setBadgeText({ text: '↻', tabId: tab.id }); return; }
      await chrome.tabs.sendMessage(tab.id, { type: 'refresh-config' }, { frameId: 0 });
    } catch {
      try {
        const origin = normalizeOrigin(tab.url ?? '');
        if (global.enabled && sites.some(s => s.origin === origin && s.enabled) && await authorized(origin)) {
          await ensureContent(tab.id);
        }
      } catch { /* Restricted or closed tabs need no injected controller. */ }
    }
  }));
}
async function synchronized() {
  await reconcile();
  await notifyPages();
}
function requireUI(sender: chrome.runtime.MessageSender) {
  const allowed = ['popup/index.html', 'options/index.html'].some(path => sender.url?.split(/[?#]/)[0] === chrome.runtime.getURL(path));
  if (sender.id !== chrome.runtime.id || !allowed) throw new Error('request-invalid');
}
async function requirePage(sender: chrome.runtime.MessageSender, origin: string) {
  if (!sender.tab?.id || sender.frameId !== 0 || normalizeOrigin(sender.url ?? '') !== normalizeOrigin(origin)) throw new Error('request-invalid');
  if (!await authorized(origin)) throw new Error('unauthorized');
  if (sender.documentId) {
    const result = await chrome.tabs.sendMessage(sender.tab.id, { type: 'command', command: 'state' }, { documentId: sender.documentId });
    if (!result?.ok) throw new Error('page-unavailable');
  }
}
async function handle(request: Request, sender: chrome.runtime.MessageSender): Promise<unknown> {
  if (!request || typeof request.type !== 'string') throw new Error('request-invalid');
  if (request.type === 'page-config') {
    if (!sender.tab?.id || sender.frameId !== 0) throw new Error('request-invalid');
    const origin = normalizeOrigin(sender.url ?? '');
    const { global, sites } = await store.read();
    return { global, site: sites.find(s => s.origin === origin) ?? null, authorized: await authorized(origin) };
  }
  if (request.type === 'clean-style') {
    if (sender.id !== chrome.runtime.id || !sender.tab?.id || sender.frameId !== 0 || typeof request.previous !== 'string' || request.previous.length > 1000000) throw new Error('request-invalid');
    const origin = normalizeOrigin(sender.url ?? '');
    const { global, sites } = await store.read();
    const site = sites.find(s => s.origin === origin);
    const target = sender.documentId ? { tabId: sender.tab.id, documentIds: [sender.documentId] } : { tabId: sender.tab.id, frameIds: [0] };
    const granted = await authorized(origin);
    if (request.installEffects && granted) await chrome.scripting.insertCSS({ target, files: ['effects.css'], origin: 'USER' });
    const css = global.enabled && granted && site?.enabled && site.cleanEnabled ? site.rules.filter(r => r.enabled && r.selector.length <= 1200 && !/[{}\n\r]/.test(r.selector)).map(r => `html[data-focusmask-clean-enabled="on"] body :is(${r.selector}) { display: none !important; }`).join('\n') : '';
    if (css === request.previous) return css;
    if (request.previous) {
      try { await chrome.scripting.removeCSS({ target, css: request.previous, origin: 'USER' }); }
      catch (error) { if (granted) throw error; return request.previous; }
    }
    if (css) await chrome.scripting.insertCSS({ target, css, origin: 'USER' });
    return css;
  }
  if (request.type === 'rule-add') {
    await requirePage(sender, request.origin);
    if (typeof request.selector !== 'string' || !request.selector.trim() || request.selector.length > 1200 || /[{}\n\r]/.test(request.selector)) throw new Error('selector-invalid');
    const { global, sites } = await store.read();
    if (!global.enabled || !sites.some(s => s.origin === request.origin && s.enabled)) throw new Error('paused');
    const result = await store.addRule(request.origin, request.selector);
    await synchronized();
    return result;
  }
  if (request.type === 'rule-update' && sender.tab && !sender.url?.startsWith(chrome.runtime.getURL(''))) await requirePage(sender, request.origin);
  else requireUI(sender);
  switch (request.type) {
    case 'snapshot': {
      const config = await store.read();
      const permissions = await chrome.permissions.getAll();
      return { ...config, version: VERSION, permissions: permissions.origins ?? [] };
    }
    case 'global':
      if (typeof request.enabled !== 'boolean') throw new Error('request-invalid');
      await store.global(request.enabled);
      await synchronized();
      return null;
    case 'interaction':
      await store.interaction(request.revealTrigger);
      await synchronized();
      return null;
    case 'preferences':
      await store.preferences(request.patch);
      await synchronized();
      return null;
    case 'site': {
      const origin = normalizeOrigin(request.origin);
      if (!await authorized(origin)) throw new Error('unauthorized');
      const previous = (await store.read()).sites.find(s => s.origin === origin);
      const result = await store.site(origin, request.patch);
      try { await synchronized(); }
      catch {
        if (previous) await store.site(origin, previous);
        else await store.deleteSite(origin);
        await synchronized().catch(() => undefined);
        throw new Error('registration-failed');
      }
      return result;
    }
    case 'delete-site': {
      const origin = normalizeOrigin(request.origin);
      await store.site(origin, { enabled: false });
      await synchronized();
      await store.deleteSite(origin);
      const remaining = (await store.read()).sites;
      if (!remaining.some(s => permissionPattern(s.origin) === permissionPattern(origin))) await chrome.permissions.remove({ origins: [permissionPattern(origin)] });
      await synchronized();
      return null;
    }
    case 'rule-update':
      await store.updateRule(request.origin, request.id, request.enabled, request.remove);
      await synchronized();
      return null;
    case 'page': {
      if (!(await store.read()).global.enabled) throw new Error('paused');
      const tab = await chrome.tabs.get(request.tabId);
      const origin = normalizeOrigin(tab.url ?? '');
      if (request.command === 'pick') {
        const site = (await store.read()).sites.find(s => s.origin === origin);
        if (!site?.enabled || !await authorized(origin)) throw new Error('unauthorized');
      }
      await ensureContent(request.tabId);
      const refreshed: Response = await chrome.tabs.sendMessage(request.tabId, { type: 'refresh-config' }, { frameId: 0 });
      if (!refreshed?.ok && request.command !== 'unlock' && request.command !== 'protect' && request.command !== 'toggle-protect') throw new Error('page-unavailable');
      const response: Response = await chrome.tabs.sendMessage(request.tabId, { type: 'command', command: request.command }, { frameId: 0 });
      if (!response?.ok) throw new Error(response?.error ?? 'page-unavailable');
      return response.data;
    }
    default: throw new Error('request-invalid');
  }
}
const errorCodes = new Set(['unsupported', 'request-invalid', 'config-invalid', 'unauthorized', 'paused', 'selector-invalid', 'selector-unsafe', 'rule-exists', 'rule-missing', 'registration-failed', 'page-unavailable', 'page-reload-required']);
chrome.runtime.onMessage.addListener((request: Request, sender, sendResponse) => {
  // Page config is read-only and must bypass the queue: notifications await page initialization.
  const work = request?.type === 'page-config' || request?.type === 'clean-style' ? handle(request, sender) : enqueue(() => handle(request, sender));
  void work.then(data => sendResponse({ ok: true, data })).catch((error: unknown) => {
    const code = error instanceof Error && errorCodes.has(error.message) ? error.message : 'page-unavailable';
    sendResponse({ ok: false, error: code });
  });
  return true;
});
chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== 'quick-protect') return;
  void enqueue(async () => {
    if (!(await store.read()).global.enabled) throw new Error('paused');
    const current = tab ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
    if (!current?.id) throw new Error('page-unavailable');
    normalizeOrigin(current.url ?? '');
    await ensureContent(current.id);
    const refreshed: Response = await chrome.tabs.sendMessage(current.id, { type: 'refresh-config' }, { frameId: 0 });
    if (!refreshed?.ok) throw new Error('page-unavailable');
    const result: Response = await chrome.tabs.sendMessage(current.id, { type: 'command', command: 'toggle-protect' }, { frameId: 0 });
    if (!result?.ok) throw new Error('page-unavailable');
    await chrome.action.setBadgeText({ text: '', tabId: current.id });
  }).catch(async () => {
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#9d3429' });
  });
});
// Native activation complements visibilitychange (automation and some browser views suppress it).
chrome.tabs.onActivated.addListener(({ windowId }) => {
  void chrome.tabs.query({ windowId, active: false }).then(tabs => Promise.all(tabs.map(tab => {
    if (!tab.id) return;
    return chrome.tabs.sendMessage(tab.id, { type: 'command', command: 'reprotect' }, { frameId: 0 }).catch(() => undefined);
  })));
});
const scheduleSync = () => { void enqueue(synchronized).catch(() => chrome.action.setBadgeText({ text: '!' })); };
chrome.runtime.onInstalled.addListener(scheduleSync);
chrome.runtime.onStartup.addListener(scheduleSync);
chrome.permissions.onAdded.addListener(scheduleSync);
chrome.permissions.onRemoved.addListener(scheduleSync);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && Object.keys(changes).some(k => k.startsWith('focusmask:'))) scheduleSync();
});
void enqueue(reconcile).catch(() => chrome.action.setBadgeText({ text: '!' }));
