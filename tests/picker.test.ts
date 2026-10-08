import { afterEach, expect, it, vi } from 'vitest';
import { ElementPicker } from '../src/content/picker';
import { t } from '../src/shared/i18n';

let picker: ElementPicker;
let host: HTMLElement;
afterEach(() => { picker?.destroy(); host?.remove(); document.body.innerHTML = ''; });
function setup(save = vi.fn(async (selector: string) => ({ id: 'new-rule', selector, enabled: true, createdAt: 1 }))) {
  document.body.innerHTML = '<aside class="advertisement">First</aside><aside class="advertisement">Second</aside>';
  host = document.createElement('div'); host.setAttribute('data-focusmask-host', ''); document.documentElement.append(host);
  const root = host.attachShadow({ mode: 'open' });
  const undo = vi.fn(async () => undefined);
  picker = new ElementPicker(root, save, undo);
  picker.start();
  const target = document.querySelector('aside')!;
  target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
  target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  const button = (label: string) => Array.from(root.querySelectorAll('button')).find(el => el.textContent === label)!;
  return { root, save, undo, button };
}
it('requires explicit confirmation for multiple matches and clears preview on Escape', () => {
  const { root, save, button } = setup();
  expect(document.querySelectorAll('[data-focusmask-preview]')).toHaveLength(2);
  const submit = button(t('saveRule'));
  expect(submit.disabled).toBe(true);
  submit.click(); expect(save).not.toHaveBeenCalled();
  const confirm = root.querySelector('input')!; confirm.click();
  expect(submit.disabled).toBe(false);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  expect(document.querySelectorAll('[data-focusmask-preview]')).toHaveLength(0);
  expect(picker.active).toBe(false);
});
it('restores unsaved preview and reports a failed save', async () => {
  const save = vi.fn<(selector: string) => Promise<never>>(async () => { throw new Error('page-unavailable'); });
  const { root, button } = setup(save);
  root.querySelector('input')!.click(); button(t('saveRule')).click();
  await vi.waitFor(() => expect(picker.active).toBe(false));
  expect(document.querySelectorAll('[data-focusmask-preview]')).toHaveLength(0);
  expect(root.querySelector('.toast')?.textContent).toContain(t('page-unavailable'));
  expect(button(t('undo'))).toBeUndefined();
});
it('undo targets only the rule returned by a successful save', async () => {
  const { root, undo, button } = setup();
  root.querySelector('input')!.click(); button(t('saveRule')).click();
  await vi.waitFor(() => expect(picker.active).toBe(false));
  expect(document.querySelectorAll('[data-focusmask-preview]')).toHaveLength(0);
  button(t('undo')).click();
  await vi.waitFor(() => expect(undo).toHaveBeenCalledExactlyOnceWith('new-rule'));
});
