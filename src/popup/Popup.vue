<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ModeSwitch from '../shared/ModeSwitch.vue';
import CustomSelect from '../shared/CustomSelect.vue';
import { send } from '../shared/bridge';
import { useLanguage } from '../shared/useLanguage';
import { normalizeOrigin, permissionPattern } from '../shared/origin';
import { defaultSite, type LanguagePreference, type Mode, type PageState, type Snapshot } from '../shared/types';
const { t, language, languageOptions } = useLanguage();
const snapshot = ref<Snapshot | null>(null);
const origin = ref(''); const tabId = ref<number>(); const allowed = ref(false); const busy = ref(false); const error = ref(''); const notice = ref(false);
const page = ref<PageState | null>(null);
const site = computed(() => snapshot.value?.sites.find(s => s.origin === origin.value) ?? defaultSite(origin.value));
const modes: { key: Mode; text: 'clean' | 'media' | 'privacy'; help: 'cleanPopupHelp' | 'mediaPopupHelp' | 'privacyPopupHelp' }[] = [
  { key: 'cleanEnabled', text: 'clean', help: 'cleanPopupHelp' }, { key: 'mediaEnabled', text: 'media', help: 'mediaPopupHelp' }, { key: 'privacyEnabled', text: 'privacy', help: 'privacyPopupHelp' }
];
async function refresh() {
  snapshot.value = await send<Snapshot>({ type: 'snapshot' });
  document.documentElement.style.setProperty('--focusmask-motion-ms', `${snapshot.value.global.motionDurationMs}ms`);
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId.value = tabs[0]?.id;
  try { origin.value = normalizeOrigin(tabs[0]?.url ?? ''); } catch { origin.value = ''; }
  allowed.value = false; page.value = null;
  if (origin.value) {
    allowed.value = await chrome.permissions.contains({ origins: [permissionPattern(origin.value)] });
    if (snapshot.value.global.enabled && tabId.value) {
      try { page.value = await send<PageState>({ type: 'page', tabId: tabId.value, command: 'state' }); } catch { page.value = null; }
    }
  }
}
async function action(operation: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true; error.value = ''; notice.value = false;
  try { await operation(); await refresh(); notice.value = true; }
  catch (e) { error.value = e instanceof Error ? e.message : t('page-unavailable'); }
  finally { busy.value = false; }
}
function authorize() {
  // Invoke the browser permission prompt directly in the click gesture.
  const grant = chrome.permissions.request({ origins: [permissionPattern(origin.value)] });
  void action(async () => {
    if (!await grant) throw new Error(t('denied'));
    await send({ type: 'site', origin: origin.value, patch: { enabled: true } });
  });
}
function toggle(mode: Mode, value: boolean) {
  void action(async () => { await send({ type: 'site', origin: origin.value, patch: { [mode]: value, enabled: true } }); });
}
function command(value: 'pick' | 'toggle-protect' | 'unlock') {
  void action(async () => {
    if (!tabId.value) throw new Error(t('page-unavailable'));
    page.value = await send<PageState>({ type: 'page', tabId: tabId.value, command: value });
    if (value === 'pick') window.close();
  });
}
function settings(rules = false) { void chrome.tabs.create({ url: chrome.runtime.getURL(`options/index.html${rules && origin.value ? `#${encodeURIComponent(origin.value)}` : ''}`) }); }
function updateLanguage(value: string) { void action(async () => { await send({ type: 'preferences', patch: { language: value as LanguagePreference } }); }); }
const changed = () => { if (!busy.value) void refresh().catch(() => undefined); };
onMounted(() => {
  void refresh().catch(e => { error.value = e.message; });
  if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.onChanged.addListener(changed);
});
onUnmounted(() => { if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.onChanged.removeListener(changed); });
</script>
<template>
  <main class="popup">
    <header class="popup-header">
      <img src="/icons/48.png" width="34" height="34" alt="">
      <div class="popup-brand"><strong>FocusMask</strong><span>{{ t('tagline') }}</span></div>
      <button class="icon-button" :aria-label="t('settings')" :title="t('settings')" @click="settings()"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6" /></svg></button>
    </header>
    <section v-if="origin" class="site-heading">
      <span class="site-caption">{{ t('siteSettings') }}</span><span class="site-origin">{{ origin }}</span>
      <span class="status"><span class="status-dot" :class="{ on: allowed && snapshot?.global.enabled && site.enabled }" />{{ !snapshot?.global.enabled ? t('off') : allowed ? t('authorized') : t('unauthorized') }}</span>
    </section>
    <div v-if="!snapshot && !error" class="message" role="status">{{ t('loading') }}</div>
    <div v-if="error" role="alert" class="message error">{{ error }}</div>
    <template v-if="snapshot">
      <section v-if="!origin" class="popup-empty">
        <svg class="empty-page-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect x="5" y="7" width="30" height="26" rx="5" stroke="currentColor" stroke-width="1.5" /><path d="M5 15h30M11 11h1m4 0h1M15 21l-4 4 4 4m10-8 4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <h1>{{ t('unsupportedTitle') }}</h1><p>{{ t('unsupported') }}</p><span class="empty-page-hint">{{ t('supportedHint') }}</span>
      </section>
      <div v-else-if="!snapshot.global.enabled" class="message">{{ t('paused') }}<button class="text-button" :disabled="busy" @click="action(async () => { await send({ type: 'global', enabled: true }); })">{{ t('resume') }}</button></div>
      <template v-else>
        <template v-if="origin">
          <button v-if="!allowed" class="primary full" :disabled="busy" @click="authorize">{{ t('enableSite') }}</button>
          <ModeSwitch v-if="allowed && !site.enabled" :label="t('siteEnabled')" :checked="false" :disabled="busy" @change="action(async () => { await send({ type: 'site', origin, patch: { enabled: $event } }); })" />
          <div class="modes"><ModeSwitch v-for="mode in modes" :key="mode.key" :label="t(mode.text)" :help="t(mode.help)" :checked="site[mode.key]" :disabled="busy || !allowed || !site.enabled" @change="toggle(mode.key, $event)" /></div>
          <div class="popup-actions">
            <button class="primary quick-action" :disabled="busy" @click="command('toggle-protect')"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2 3 5v5c0 4 7 8 7 8s7-4 7-8V5l-7-3Z" stroke="currentColor" stroke-width="1.4" /><path d="M7 10h6" stroke="currentColor" stroke-width="1.4" /></svg>{{ t(page?.protectionEnabled ? 'disableProtect' : 'protect') }}</button>
            <button :disabled="busy || !allowed || !site.enabled || page?.protected" @click="command('pick')">{{ t('pick') }}</button>
            <button v-if="page?.protected" :disabled="busy" @click="command('unlock')">{{ t('unlock') }}</button>
          </div>
        </template>
      </template>
      <div v-if="origin" class="popup-footer"><span>{{ t('rules') }} <b>{{ site.rules.length }}</b></span><button class="text-button" @click="settings(true)">{{ t('manage') }}</button></div>
    </template>
    <div v-if="busy || notice" class="popup-notice" role="status">{{ busy ? t('working') : notice ? t('saved') : '' }}</div>
    <footer class="popup-bottom">
      <p class="local-note"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="4" y="7" width="8" height="6" rx="1.5" stroke="currentColor" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" /></svg>{{ t('privacyNote') }}</p>
      <div v-if="snapshot" class="popup-language"><span id="popup-language-label" class="sr-only">{{ t('language') }}</span><CustomSelect id="popup-language" :model-value="language" :options="languageOptions" :disabled="busy" labelledby="popup-language-label" @update:model-value="updateLanguage" /></div>
    </footer>
  </main>
</template>
