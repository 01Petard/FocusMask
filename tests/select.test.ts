import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { expect, it } from 'vitest';
import CustomSelect from '../src/shared/CustomSelect.vue';
it('keeps both custom options available and displays the saved selection when reopened', async () => {
  const host = document.createElement('div'); document.body.append(host);
  const value = ref('click');
  const app = createApp(defineComponent({ setup: () => () => h(CustomSelect, { id: 'choice', labelledby: 'label', modelValue: value.value, options: [{ value: 'click', label: 'Click' }, { value: 'hover', label: 'Hover' }], 'onUpdate:modelValue': (selected: string) => { value.value = selected; } }) }));
  app.mount(host);
  try {
    (host.querySelector('#choice') as HTMLButtonElement).click(); await nextTick();
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(2);
    (host.querySelectorAll('[role="option"]')[1] as HTMLButtonElement).click(); await nextTick();
    expect(host.querySelector('#choice-value')!.textContent).toBe('Hover');
    (host.querySelector('#choice') as HTMLButtonElement).click(); await nextTick();
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(2);
    expect(host.querySelector('[aria-selected="true"]')!.textContent).toBe('Hover');
    host.querySelector('#choice')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await nextTick();
    expect(host.querySelector('[role="listbox"]')).toBeNull();
  } finally { app.unmount(); host.remove(); }
});
