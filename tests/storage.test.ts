import { describe, expect, it } from 'vitest';
import { ConfigStore } from '../src/background/storage';
describe('persisted rules', () => {
  it('persists custom timings, retains them through pause and rejects invalid durations', async () => {
    const values: Record<string, unknown> = {};
    const store = new ConfigStore({ get: async () => structuredClone(values), set: async data => { Object.assign(values, structuredClone(data)); }, remove: async key => { delete values[key]; } });
    await store.preferences({ language: 'en', revealTrigger: 'hover', revealDurationMs: 2200, hoverDelayMs: 400, toastDurationMs: 6000, undoDurationMs: 18000, motionDurationMs: 150 });
    await store.global(false);
    expect((await store.read()).global).toMatchObject({ enabled: false, language: 'en', revealTrigger: 'hover', revealDurationMs: 2200, hoverDelayMs: 400, toastDurationMs: 6000, undoDurationMs: 18000 });
    await expect(store.preferences({ revealDurationMs: -1 })).rejects.toThrow('request-invalid');
    await expect(store.preferences({ hoverDelayMs: Number.NaN })).rejects.toThrow('request-invalid');
    await expect(store.preferences({ language: 'unknown' as 'en' })).rejects.toThrow('request-invalid');
  });
  it('loads old configuration as click reveal and preserves a saved hover choice when paused', async () => {
    const values: Record<string, unknown> = { 'focusmask:global': { schemaVersion: 1, enabled: true } };
    const store = new ConfigStore({ get: async () => structuredClone(values), set: async data => { Object.assign(values, structuredClone(data)); }, remove: async key => { delete values[key]; } });
    expect((await store.read()).global).toMatchObject({ revealTrigger: 'click', language: 'auto' });
    await Promise.all([store.interaction('hover'), store.global(false)]);
    const reopened = new ConfigStore(store.area);
    expect((await reopened.read()).global).toMatchObject({ enabled: false, revealTrigger: 'hover' });
  });
  it('serializes concurrent changes without losing a mode or rule', async () => {
    const values: Record<string, unknown> = {};
    const store = new ConfigStore({ get: async () => structuredClone(values), set: async data => { Object.assign(values, structuredClone(data)); }, remove: async key => { delete values[key]; } });
    await Promise.all([
      store.site('https://example.com', { cleanEnabled: true }),
      store.site('https://example.com', { mediaEnabled: true }),
      store.addRule('https://example.com', '.advertisement')
    ]);
    const snapshot = await store.read();
    expect(snapshot.sites[0]).toMatchObject({ cleanEnabled: true, mediaEnabled: true });
    expect(snapshot.sites[0].rules).toHaveLength(1);
    await store.site('https://example.com', { enabled: false });
    expect((await store.read()).sites[0].rules).toHaveLength(1);
    const reopened = new ConfigStore(store.area);
    expect((await reopened.read()).sites[0].rules).toHaveLength(1);
  });
});
