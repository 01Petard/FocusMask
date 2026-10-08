export interface ElementRule { id: string; selector: string; enabled: boolean; createdAt: number }
export interface SiteConfig {
  origin: string; enabled: boolean; cleanEnabled: boolean; mediaEnabled: boolean; privacyEnabled: boolean; rules: ElementRule[];
}
export type LanguagePreference = 'auto' | 'zh-CN' | 'en';
export type RevealTrigger = 'click' | 'hover';
export const REVEAL_DURATION_MS = 1000;
export const HOVER_DELAY_MS = 250;
export interface TimingConfig { revealDurationMs: number; hoverDelayMs: number; toastDurationMs: number; undoDurationMs: number; motionDurationMs: number }
export interface GlobalConfig extends TimingConfig { schemaVersion: 1; enabled: boolean; revealTrigger: RevealTrigger; language: LanguagePreference }
export type Preferences = Partial<TimingConfig & { revealTrigger: RevealTrigger; language: LanguagePreference }>;
export const timingLimits = { revealDurationMs: [100, 600000], hoverDelayMs: [0, 10000], toastDurationMs: [500, 60000], undoDurationMs: [1000, 300000], motionDurationMs: [0, 1000] } as const;
export interface Snapshot { version: string; global: GlobalConfig; sites: SiteConfig[]; permissions: string[] }
export type Mode = 'cleanEnabled' | 'mediaEnabled' | 'privacyEnabled';
export interface PageState { version: string; protected: boolean; protectionEnabled: boolean; picking: boolean; clean: boolean; media: boolean }
export type Response<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
export type Request =
  | { type: 'snapshot' }
  | { type: 'global'; enabled: boolean }
  | { type: 'interaction'; revealTrigger: RevealTrigger }
  | { type: 'preferences'; patch: Preferences }
  | { type: 'site'; origin: string; patch: Partial<Pick<SiteConfig, 'enabled' | Mode>> }
  | { type: 'delete-site'; origin: string }
  | { type: 'rule-add'; origin: string; selector: string }
  | { type: 'rule-update'; origin: string; id: string; enabled?: boolean; remove?: boolean }
  | { type: 'page-config' }
  | { type: 'clean-style'; previous: string; installEffects?: boolean }
  | { type: 'page'; tabId: number; command: 'state' | 'pick' | 'protect' | 'toggle-protect' | 'unlock' };
export const defaultGlobal: GlobalConfig = { schemaVersion: 1, enabled: true, revealTrigger: 'click', language: 'auto', revealDurationMs: REVEAL_DURATION_MS, hoverDelayMs: HOVER_DELAY_MS, toastDurationMs: 5000, undoDurationMs: 12000, motionDurationMs: 100 };
export function defaultSite(origin: string): SiteConfig {
  return { origin, enabled: true, cleanEnabled: false, mediaEnabled: false, privacyEnabled: false, rules: [] };
}
