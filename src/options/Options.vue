<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ModeSwitch from '../shared/ModeSwitch.vue';
import CustomSelect from '../shared/CustomSelect.vue';
import { send } from '../shared/bridge';
import { useLanguage } from '../shared/useLanguage';
import { normalizeOrigin, permissionPattern } from '../shared/origin';
import { defaultGlobal, timingLimits, type LanguagePreference, type Mode, type RevealTrigger, type Snapshot, type TimingConfig } from '../shared/types';
import { VERSION } from '../shared/version';
const timingDraft = ref<TimingConfig>({ revealDurationMs: defaultGlobal.revealDurationMs, hoverDelayMs: defaultGlobal.hoverDelayMs, toastDurationMs: defaultGlobal.toastDurationMs, undoDurationMs: defaultGlobal.undoDurationMs, motionDurationMs: defaultGlobal.motionDurationMs }); const timingDirty = ref(false);
const timingFields = [ { key: 'revealDurationMs', label: 'revealDuration' }, { key: 'hoverDelayMs', label: 'hoverDelay' }, { key: 'toastDurationMs', label: 'toastDuration' }, { key: 'undoDurationMs', label: 'undoDuration' }, { key: 'motionDurationMs', label: 'motionDuration' } ] as const;
const revealOptions = computed(() => [{ value: 'click', label: t('triggerClick') }, { value: 'hover', label: `${t('triggerHover')} · ${snapshot.value?.global.hoverDelayMs ?? defaultGlobal.hoverDelayMs}ms` }]);
const { t, language, languageOptions } = useLanguage();
const snapshot = ref<Snapshot | null>(null); const selected = ref(''); const url = ref(''); const preProtect = ref(false);
const busy = ref(false); const error = ref(''); const notice = ref(false); const shortcut = ref(''); const access = ref<Record<string, boolean>>({});
const site = computed(() => snapshot.value?.sites.find(s => s.origin === selected.value));
const modes: { key: Mode; text: 'clean' | 'media' | 'privacy'; help: 'cleanHelp' | 'mediaHelp' | 'privacyHelp' }[] = [{ key: 'cleanEnabled', text: 'clean', help: 'cleanHelp' }, { key: 'mediaEnabled', text: 'media', help: 'mediaHelp' }, { key: 'privacyEnabled', text: 'privacy', help: 'privacyHelp' }];
async function refresh() {
  snapshot.value = await send<Snapshot>({ type: 'snapshot' });
  document.documentElement.style.setProperty('--focusmask-motion-ms', `${snapshot.value.global.motionDurationMs}ms`);
  if (!timingDirty.value) for (const field of timingFields) timingDraft.value[field.key] = snapshot.value.global[field.key];
  if (!snapshot.value.sites.some(s => s.origin === selected.value)) selected.value = snapshot.value.sites[0]?.origin ?? '';
  const permissions: Record<string, boolean> = {};
  for (const saved of snapshot.value.sites) permissions[saved.origin] = await chrome.permissions.contains({ origins: [permissionPattern(saved.origin)] });
  access.value = permissions;
  shortcut.value = (await chrome.commands.getAll()).find(c => c.name === 'quick-protect')?.shortcut ?? '';
}
async function action(operation: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true; error.value = ''; notice.value = false;
  try { await operation(); await refresh(); notice.value = true; }
  catch (e) { error.value = e instanceof Error ? e.message : t('page-unavailable'); }
  finally { busy.value = false; }
}
function add() {
  let origin: string;
  try { origin = normalizeOrigin(url.value); } catch { error.value = t('unsupported'); return; }
  const grant = chrome.permissions.request({ origins: [permissionPattern(origin)] });
  void action(async () => {
    if (!await grant) throw new Error(t('denied'));
    await send({ type: 'site', origin, patch: { enabled: true, privacyEnabled: preProtect.value } });
    selected.value = origin; url.value = ''; preProtect.value = false;
  });
}
function grant() {
  if (!site.value) return;
  const origin = site.value.origin;
  const permission = chrome.permissions.request({ origins: [permissionPattern(origin)] });
  void action(async () => { if (!await permission) throw new Error(t('denied')); await send({ type: 'site', origin, patch: {} }); });
}
function patch(key: 'enabled' | Mode, enabled: boolean) { if (site.value) void action(async () => { await send({ type: 'site', origin: selected.value, patch: { [key]: enabled } }); }); }
function updateRule(id: string, enabled?: boolean, remove = false) { void action(async () => { await send({ type: 'rule-update', origin: selected.value, id, enabled, remove }); }); }
function removeSite() {
  if (!window.confirm(t('deleteConfirm'))) return;
  void action(async () => { await send({ type: 'delete-site', origin: selected.value }); });
}
function openShortcuts() {
  const edge = navigator.userAgent.includes('Edg/');
  void chrome.tabs.create({ url: `${edge ? 'edge' : 'chrome'}://extensions/shortcuts` });
}
function interaction(value: string) {
  void action(async () => { await send({ type: 'preferences', patch: { revealTrigger: value as RevealTrigger } }); });
}
function saveTiming() { void action(async () => { await send({ type: 'preferences', patch: { ...timingDraft.value } }); timingDirty.value = false; }); }
function updateLanguage(value: string) { void action(async () => { await send({ type: 'preferences', patch: { language: value as LanguagePreference } }); }); }
const changed = () => { if (!busy.value) void refresh().catch(() => undefined); };
onMounted(() => {
  try { selected.value = decodeURIComponent(location.hash.slice(1)); } catch { selected.value = ''; }
  void refresh().catch(e => { error.value = e.message; });
  if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.onChanged.addListener(changed);
});
onUnmounted(() => { if (typeof chrome !== 'undefined' && chrome.storage) chrome.storage.onChanged.removeListener(changed); });
</script>
<template>
  <main class="settings-shell">
    <header class="settings-header"><div class="brand"><img src="/icons/48.png" width="42" height="42" alt=""><div><strong>FocusMask</strong><p>{{ t('tagline') }}</p></div></div><span class="version">v{{ VERSION }}</span></header>
    <div v-if="error" class="message error" role="alert">{{ error }}</div>
    <div class="save-status" role="status">{{ busy ? t('working') : notice ? t('saved') : '' }}</div>
    <template v-if="snapshot">
      <section aria-labelledby="websites-heading">
        <div class="section-heading"><h1 id="websites-heading">{{ t('websites') }}</h1><span>{{ snapshot.sites.length }}</span></div>
        <p class="section-intro">{{ t('websiteIntro') }}</p>
        <form class="add-site" @submit.prevent="add"><label class="sr-only" for="website-url">{{ t('siteUrl') }}</label><input id="website-url" v-model="url" type="url" placeholder="https://example.com" required :disabled="busy"><button class="primary" type="submit" :disabled="busy || !url.trim()">{{ t('add') }}</button><label class="preprotect"><input v-model="preProtect" type="checkbox" :disabled="busy">{{ t('addProtect') }}</label></form>
        <div v-if="!snapshot.sites.length" class="empty-state"><h2>{{ t('empty') }}</h2><p>{{ t('emptyHelp') }}</p></div>
        <div v-else class="website-workspace">
          <nav class="website-list" :aria-label="t('websites')"><button v-for="saved in snapshot.sites" :key="saved.origin" class="website-item" :class="{ selected: selected === saved.origin }" :aria-current="selected === saved.origin ? 'true' : undefined" @click="selected = saved.origin"><span>{{ saved.origin }}</span><small>{{ !access[saved.origin] ? t('unauthorized') : saved.enabled && snapshot.global.enabled ? t('active') : t('off') }} · {{ saved.rules.length }} {{ t('rules') }}</small></button></nav>
          <section v-if="site" class="website-detail" :aria-label="site.origin">
            <h2>{{ site.origin }}</h2>
            <div v-if="!access[site.origin]" class="message">{{ t('revoked') }}<button @click="grant">{{ t('grant') }}</button></div>
            <ModeSwitch :label="t('siteEnabled')" :checked="site.enabled" :disabled="busy || !access[site.origin]" @change="patch('enabled', $event)" />
            <div class="detail-modes"><ModeSwitch v-for="mode in modes" :key="mode.key" :label="t(mode.text)" :help="t(mode.help)" :checked="site[mode.key]" :disabled="busy || !access[site.origin]" @change="patch(mode.key, $event)" /></div>
            <div class="rules-heading"><h3>{{ t('rules') }} <span>{{ site.rules.length }}</span></h3><button class="text-button" :disabled="busy || !access[site.origin]" @click="patch('cleanEnabled', false)">{{ t('restoreElements') }}</button></div>
            <p v-if="!site.rules.length" class="muted">{{ t('noRules') }}</p>
            <ul v-else class="rule-list"><li v-for="rule in site.rules" :key="rule.id"><label><input type="checkbox" :checked="rule.enabled" :disabled="busy" :aria-label="`${t('enabled')}: ${rule.selector}`" @change="updateRule(rule.id, ($event.target as HTMLInputElement).checked)"><code>{{ rule.selector }}</code></label><button class="text-button danger" :disabled="busy" @click="updateRule(rule.id, undefined, true)">{{ t('delete') }}</button></li></ul>
            <div class="site-actions"><button :disabled="busy || !access[site.origin]" @click="patch('enabled', false)">{{ t('restore') }}</button><button class="text-button danger" :disabled="busy" @click="removeSite">{{ t('deleteSite') }}</button></div>
          </section>
        </div>
      </section>
      <section class="general-settings" aria-labelledby="general-heading">
        <h2 id="general-heading">{{ t('general') }}</h2><p class="section-intro">{{ t('generalIntro') }}</p>
        <div class="general-panel">
          <ModeSwitch :label="t('global')" :help="t('globalHelp')" :checked="snapshot.global.enabled" :disabled="busy" @change="action(async () => { await send({ type: 'global', enabled: $event }); })" />
          <div class="interaction-row"><div><strong id="language-label">{{ t('language') }}</strong><p>{{ t('languageHelp') }}</p></div><CustomSelect id="language-select" :model-value="language" :options="languageOptions" :disabled="busy" labelledby="language-label" @update:model-value="updateLanguage" /></div>
          <div class="interaction-row"><div><strong id="reveal-trigger-label">{{ t('revealTrigger') }}</strong><p>{{ t('revealHelp') }}</p></div><CustomSelect id="reveal-trigger" :model-value="snapshot.global.revealTrigger" :options="revealOptions" :disabled="busy" labelledby="reveal-trigger-label" @update:model-value="interaction" /></div>
          <form class="timing-form" @submit.prevent="saveTiming"><h3>{{ t('timing') }}</h3><p>{{ t('timingHelp') }}</p><div class="timing-grid"><label v-for="field in timingFields" :key="field.key" :for="field.key"><span>{{ t(field.label) }}</span><span class="timing-input"><input :id="field.key" v-model.number="timingDraft[field.key]" type="number" inputmode="numeric" :min="timingLimits[field.key][0]" :max="timingLimits[field.key][1]" step="1" required :disabled="busy" @input="timingDirty = true"><span aria-hidden="true">ms</span></span></label></div><div class="timing-actions"><button class="primary" :disabled="busy || !timingDirty" type="submit">{{ t('applyTiming') }}</button></div></form>
          <div class="shortcut-row"><div><strong>{{ t('shortcuts') }}</strong><p>{{ shortcut || t('unassigned') }}</p></div><button @click="openShortcuts">{{ t('configureShortcut') }}</button></div>
        </div>
      </section>
    </template>
    <footer class="settings-footer"><div><strong>{{ t('localOnly') }}</strong><p>{{ t('privacyStatement') }}</p><span>FocusMask · v{{ VERSION }}</span></div><a class="author-link" href="https://github.com/01Petard" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.83a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>{{ t('authorLink') }}<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10" stroke="currentColor" stroke-width="1.5" /></svg></a></footer>
  </main>
</template>
