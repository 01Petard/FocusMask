import { buildSelector, validateSelector } from './selector';
import { errorText, t, type TextKey } from '../shared/i18n';
import type { ElementRule } from '../shared/types';
export class ElementPicker {
  active = false;
  private target: Element | null = null;
  private selected: Element[] = [];
  private pending = false;
  private readonly bar = document.createElement('div');
  private readonly highlight = document.createElement('div');
  private readonly confirm = document.createElement('div');
  private readonly toast = document.createElement('div');
  private toastTimer = 0;
  private toastDurationMs = 5000;
  private undoDurationMs = 12000;
  updateLanguage() {
    if (this.bar.firstElementChild) this.bar.firstElementChild.textContent = `FocusMask · ${t('pickInstruction')}`;
    this.bar.querySelector('button')!.textContent = `${t('cancel')} · Esc`;
    this.confirm.querySelectorAll<HTMLElement>('[data-focusmask-text]').forEach(element => { element.textContent = t(element.dataset.focusmaskText as TextKey); });
    const count = this.confirm.querySelector<HTMLElement>('[data-focusmask-count]');
    if (count) count.textContent = `${t('matched')}: ${this.selected.length}`;
    const undo = this.toast.querySelector('button');
    if (undo) { this.toast.firstChild!.textContent = t('hidden'); undo.textContent = t('undo'); }
  }
  configure(timing: { toastDurationMs: number; undoDurationMs: number }) { this.toastDurationMs = timing.toastDurationMs; this.undoDurationMs = timing.undoDurationMs; }
  constructor(private readonly root: ShadowRoot, private readonly save: (selector: string) => Promise<ElementRule>, private readonly undo: (id: string) => Promise<void>) {
    this.bar.className = 'picker-bar'; this.highlight.className = 'picker-highlight'; this.confirm.className = 'picker-confirm'; this.toast.className = 'toast';
    this.bar.hidden = this.highlight.hidden = this.confirm.hidden = this.toast.hidden = true;
    const title = document.createElement('span'); title.textContent = `FocusMask · ${t('pickInstruction')}`;
    const cancel = this.button(`${t('cancel')} · Esc`, () => this.stop());
    this.bar.append(title, cancel); root.append(this.bar, this.highlight, this.confirm, this.toast);
  }
  private button(text: string, action: () => void) { const button = document.createElement('button'); button.textContent = text; button.addEventListener('click', action); return button; }
  private readonly move = (event: MouseEvent) => {
    if (this.confirm.hidden === false || event.composedPath().includes(this.root.host)) return;
    const element = event.target instanceof Element ? event.target : null;
    if (!element || element === document.body || element === document.documentElement || element.closest('[data-focusmask-host]')) { this.highlight.hidden = true; this.target = null; return; }
    this.target = element;
    const rect = element.getBoundingClientRect();
    this.highlight.hidden = false;
    Object.assign(this.highlight.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    const label = document.createElement('span'); label.textContent = element.localName; this.highlight.replaceChildren(label);
  };
  private readonly click = (event: MouseEvent) => {
    if (event.composedPath().includes(this.root.host)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!this.confirm.hidden || !this.target) return;
    try {
      const generated = buildSelector(this.target);
      const selector = validateSelector(generated.selector);
      this.selected = Array.from(document.querySelectorAll(selector));
      this.selected.forEach(el => el.setAttribute('data-focusmask-preview', ''));
      this.highlight.hidden = true; this.confirm.hidden = false; this.confirm.replaceChildren();
      const title = document.createElement('p'); title.textContent = `${t('matched')}: ${this.selected.length}`; title.dataset.focusmaskCount = '';
      const code = document.createElement('code'); code.textContent = selector;
      this.confirm.append(title, code);
      if (generated.unstable) { const note = document.createElement('p'); note.textContent = t('unstable'); note.dataset.focusmaskText = 'unstable'; this.confirm.append(note); }
      let multi: HTMLInputElement | null = null;
      if (this.selected.length > 1) {
        const note = document.createElement('p'); note.textContent = t('multi'); note.dataset.focusmaskText = 'multi'; this.confirm.append(note);
        const label = document.createElement('label'); multi = document.createElement('input'); multi.type = 'checkbox'; const labelText = document.createElement('span'); labelText.dataset.focusmaskText = 'confirmMulti'; labelText.textContent = t('confirmMulti'); label.append(multi, labelText); this.confirm.append(label);
      }
      const actions = document.createElement('div'); actions.className = 'picker-actions';
      const save = this.button(t('saveRule'), () => { void this.persist(selector); }); save.dataset.focusmaskText = 'saveRule'; save.className = 'primary'; save.disabled = !!multi;
      multi?.addEventListener('change', () => { save.disabled = !multi!.checked; });
      const back = this.button(t('back'), () => this.clearPreview()); back.dataset.focusmaskText = 'back';
      const cancel = this.button(t('cancel'), () => this.stop()); cancel.dataset.focusmaskText = 'cancel';
      actions.append(save, back, cancel); this.confirm.append(actions);
      (multi ?? save).focus();
    } catch (error) { this.notify(errorText(error instanceof Error ? error.message : 'selector-invalid')); }
  };
  private readonly key = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); this.stop(); }
  };
  private clearPreview() { this.selected.forEach(el => el.removeAttribute('data-focusmask-preview')); this.selected = []; this.target = null; this.confirm.hidden = true; this.highlight.hidden = true; }
  start() {
    this.stop(); this.active = true; this.bar.hidden = false;
    document.addEventListener('mousemove', this.move, true); document.addEventListener('click', this.click, true); document.addEventListener('keydown', this.key, true);
    this.bar.querySelector('button')!.focus();
  }
  private async persist(selector: string) {
    if (this.pending) return;
    this.pending = true;
    this.confirm.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try {
      validateSelector(selector);
      const rule = await this.save(selector);
      this.stop();
      this.notify(t('hidden'), rule.id);
    } catch (error) { this.stop(); this.notify(errorText(error instanceof Error ? error.message : 'page-unavailable')); }
    finally { this.pending = false; }
  }
  private notify(text: string, id?: string) {
    window.clearTimeout(this.toastTimer); this.toast.hidden = false; this.toast.replaceChildren(document.createTextNode(text)); this.toast.setAttribute('role', 'status');
    if (id) this.toast.append(this.button(t('undo'), () => {
      void this.undo(id).then(() => { this.toast.hidden = true; }).catch(error => this.notify(errorText(error instanceof Error ? error.message : 'page-unavailable')));
    }));
    this.toastTimer = window.setTimeout(() => { this.toast.hidden = true; }, id ? this.undoDurationMs : this.toastDurationMs);
  }
  stop() {
    this.active = false; this.clearPreview(); this.bar.hidden = true;
    document.removeEventListener('mousemove', this.move, true); document.removeEventListener('click', this.click, true); document.removeEventListener('keydown', this.key, true);
  }
  destroy() { this.stop(); window.clearTimeout(this.toastTimer); [this.bar, this.highlight, this.confirm, this.toast].forEach(el => el.remove()); }
}
