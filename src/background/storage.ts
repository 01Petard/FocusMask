import { defaultGlobal, defaultSite, timingLimits, type GlobalConfig, type Preferences, type RevealTrigger, type SiteConfig } from '../shared/types';
import { normalizeOrigin } from '../shared/origin';
export interface StorageArea {
  get: () => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<unknown>;
  remove: (key: string) => Promise<unknown>;
}
const globalKey = 'focusmask:global';
const siteKey = (origin: string) => `focusmask:site:${origin}`;
export class ConfigStore {
  private pending: Promise<unknown> = Promise.resolve();
  constructor(readonly area: StorageArea) {}
  async read(): Promise<{ global: GlobalConfig; sites: SiteConfig[] }> {
    const values = await this.area.get();
    const global = { ...defaultGlobal, ...(values[globalKey] as Partial<GlobalConfig> | undefined) };
    if (global.schemaVersion !== 1 || typeof global.enabled !== 'boolean' || !['click', 'hover'].includes(global.revealTrigger) || !['auto', 'zh-CN', 'en'].includes(global.language)) throw new Error('config-invalid');
    for (const key of Object.keys(timingLimits) as (keyof typeof timingLimits)[]) {
      const [min, max] = timingLimits[key];
      if (!Number.isInteger(global[key]) || global[key] < min || global[key] > max) throw new Error('config-invalid');
    }
    const sites: SiteConfig[] = [];
    for (const [key, value] of Object.entries(values)) {
      if (!key.startsWith('focusmask:site:')) continue;
      const site = value as SiteConfig;
      if (!site || normalizeOrigin(site.origin) !== site.origin || key !== siteKey(site.origin)
        || !['enabled', 'cleanEnabled', 'mediaEnabled', 'privacyEnabled'].every(k => typeof site[k as keyof SiteConfig] === 'boolean')
        || !Array.isArray(site.rules) || !site.rules.every(r => r && typeof r.id === 'string' && typeof r.selector === 'string' && typeof r.enabled === 'boolean' && typeof r.createdAt === 'number')) {
        throw new Error('config-invalid');
      }
      sites.push(site);
    }
    return { global, sites };
  }
  private write<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.pending.then(operation);
    this.pending = next.catch(() => undefined);
    return next;
  }
  global(enabled: boolean) { return this.write(async () => this.area.set({ [globalKey]: { ...(await this.read()).global, enabled } })); }
  interaction(revealTrigger: RevealTrigger) { return this.preferences({ revealTrigger }); }
  preferences(patch: Preferences) { return this.write(async () => {
    if (!patch || typeof patch !== 'object') throw new Error('request-invalid');
    const global = (await this.read()).global;
    if (patch.language !== undefined) {
      if (!['auto', 'zh-CN', 'en'].includes(patch.language)) throw new Error('request-invalid');
      global.language = patch.language;
    }
    if (patch.revealTrigger !== undefined) {
      if (!['click', 'hover'].includes(patch.revealTrigger)) throw new Error('request-invalid');
      global.revealTrigger = patch.revealTrigger;
    }
    for (const key of Object.keys(timingLimits) as (keyof typeof timingLimits)[]) {
      const value = patch[key];
      if (value === undefined) continue;
      const [min, max] = timingLimits[key];
      if (!Number.isInteger(value) || value < min || value > max) throw new Error('request-invalid');
      global[key] = value;
    }
    await this.area.set({ [globalKey]: global });
  }); }
  site(origin: string, patch: Partial<Pick<SiteConfig, 'enabled' | 'cleanEnabled' | 'mediaEnabled' | 'privacyEnabled'>>) {
    return this.write(async () => {
      origin = normalizeOrigin(origin);
      const site = (await this.read()).sites.find(s => s.origin === origin) ?? defaultSite(origin);
      for (const key of ['enabled', 'cleanEnabled', 'mediaEnabled', 'privacyEnabled'] as const) {
        if (patch[key] !== undefined) {
          if (typeof patch[key] !== 'boolean') throw new Error('request-invalid');
          site[key] = patch[key];
        }
      }
      await this.area.set({ [siteKey(origin)]: site });
      return site;
    });
  }
  addRule(origin: string, selector: string) {
    return this.write(async () => {
      const site = (await this.read()).sites.find(s => s.origin === normalizeOrigin(origin));
      if (!site) throw new Error('unauthorized');
      if (site.rules.some(r => r.selector === selector)) throw new Error('rule-exists');
      const rule = { id: crypto.randomUUID(), selector, enabled: true, createdAt: Date.now() };
      site.rules.push(rule);
      site.cleanEnabled = true;
      await this.area.set({ [siteKey(site.origin)]: site });
      return rule;
    });
  }
  updateRule(origin: string, id: string, enabled?: boolean, remove = false) {
    return this.write(async () => {
      const site = (await this.read()).sites.find(s => s.origin === normalizeOrigin(origin));
      const rule = site?.rules.find(r => r.id === id);
      if (!site || !rule) throw new Error('rule-missing');
      if (remove) site.rules = site.rules.filter(r => r.id !== id);
      else if (typeof enabled === 'boolean') rule.enabled = enabled;
      else throw new Error('request-invalid');
      await this.area.set({ [siteKey(site.origin)]: site });
    });
  }
  deleteSite(origin: string) { return this.write(() => this.area.remove(siteKey(normalizeOrigin(origin)))); }
}
