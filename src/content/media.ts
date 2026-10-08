import { t } from '../shared/i18n';
import { HOVER_DELAY_MS, REVEAL_DURATION_MS, type RevealTrigger } from '../shared/types';
interface Entry { element: HTMLImageElement | HTMLVideoElement; button: HTMLButtonElement; visible: boolean; load: () => void; timer: number; hoverTimer: number }
export class MediaMask {
  private readonly entries = new Map<Element, Entry>();
  private readonly layer = document.createElement('div');
  private observer: MutationObserver | null = null;
  private intersection: IntersectionObserver | null = null;
  private resize: ResizeObserver | null = null;
  private frame = 0;
  private running = false;
  private trigger: RevealTrigger = 'click';
  private revealDurationMs = REVEAL_DURATION_MS;
  private hoverDelayMs = HOVER_DELAY_MS;
  private readonly hoverBlocked = new Set<Entry>();
  constructor(root: ShadowRoot) { this.layer.className = 'media-layer'; root.append(this.layer); }
  updateLanguage() { for (const record of this.entries.values()) { record.button.textContent = t(this.trigger === 'hover' ? 'revealHover' : 'revealClick'); record.button.setAttribute('aria-label', record.button.textContent); } }
  configure(timing: { revealDurationMs: number; hoverDelayMs: number }) {
    if (this.revealDurationMs !== timing.revealDurationMs || this.hoverDelayMs !== timing.hoverDelayMs) for (const record of this.entries.values()) this.remask(record);
    this.revealDurationMs = timing.revealDurationMs; this.hoverDelayMs = timing.hoverDelayMs;
  }
  setTrigger(trigger: RevealTrigger) {
    if (this.trigger === trigger) return;
    this.trigger = trigger; this.hoverBlocked.clear();
    for (const record of this.entries.values()) this.remask(record);
  }
  private readonly onMouseMove = (event: MouseEvent) => {
    for (const record of this.hoverBlocked) {
      const rect = record.element.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.hoverBlocked.delete(record);
    }
  };
  private readonly schedule = () => {
    if (this.frame || !this.running) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      for (const record of this.entries.values()) if (record.visible) this.position(record);
    });
  };
  private position(record: Entry) {
    const rect = record.element.getBoundingClientRect();
    const available = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
    const revealed = record.element.hasAttribute('data-focusmask-revealed');
    record.button.hidden = !available || revealed;
    if (!available) return;
    const left = Math.max(0, rect.left), top = Math.max(0, rect.top);
    const right = Math.min(innerWidth, rect.right), bottom = Math.min(innerHeight, rect.bottom);
    const width = right - left, height = bottom - top;
    Object.assign(record.button.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
  }
  private remask(record: Entry) {
    window.clearTimeout(record.timer); record.timer = 0;
    window.clearTimeout(record.hoverTimer); record.hoverTimer = 0;
    record.element.removeAttribute('data-focusmask-revealed');
    record.button.classList.remove('revealed');
    record.button.textContent = t(this.trigger === 'hover' ? 'revealHover' : 'revealClick');
    record.button.setAttribute('aria-label', record.button.textContent);
    this.schedule();
  }
  private reveal(record: Entry) {
    if (record.element.hasAttribute('data-focusmask-revealed')) return;
    window.clearTimeout(record.hoverTimer); record.hoverTimer = 0;
    if (this.trigger === 'hover') this.hoverBlocked.add(record);
    record.element.setAttribute('data-focusmask-revealed', '');
    record.button.classList.add('revealed'); record.button.hidden = true;
    window.clearTimeout(record.timer); record.timer = window.setTimeout(() => this.remask(record), this.revealDurationMs);
    this.schedule();
  }
  private add(element: Element) {
    if (!(element instanceof HTMLImageElement || element instanceof HTMLVideoElement) || this.entries.has(element) || element.closest('[data-focusmask-host]')) return;
    const button = document.createElement('button'); button.className = 'media-mask'; button.textContent = t(this.trigger === 'hover' ? 'revealHover' : 'revealClick'); button.setAttribute('aria-label', button.textContent);
    button.hidden = true;
    const record: Entry = { element, button, visible: !this.intersection, load: () => this.remask(record), timer: 0, hoverTimer: 0 };
    button.addEventListener('click', event => {
      event.preventDefault(); event.stopPropagation();
      if (this.trigger === 'click' || event.detail === 0) this.reveal(record);
    });
    button.addEventListener('mouseenter', () => {
      if (this.trigger !== 'hover' || this.hoverBlocked.has(record)) return;
      window.clearTimeout(record.hoverTimer);
      record.hoverTimer = window.setTimeout(() => {
        record.hoverTimer = 0;
        if (this.running && this.entries.has(element) && this.trigger === 'hover' && !this.hoverBlocked.has(record)) this.reveal(record);
      }, this.hoverDelayMs);
    });
    button.addEventListener('mouseleave', () => { window.clearTimeout(record.hoverTimer); record.hoverTimer = 0; });
    element.addEventListener('load', record.load); element.addEventListener('loadedmetadata', record.load);
    this.entries.set(element, record); this.layer.append(button); this.intersection?.observe(element); this.resize?.observe(element); this.schedule();
  }
  private remove(element: Element) {
    const record = this.entries.get(element);
    if (!record) return;
    window.clearTimeout(record.timer); this.hoverBlocked.delete(record);
    window.clearTimeout(record.hoverTimer);
    record.element.removeEventListener('load', record.load); record.element.removeEventListener('loadedmetadata', record.load);
    record.element.removeAttribute('data-focusmask-revealed'); record.button.remove();
    this.intersection?.unobserve(element); this.resize?.unobserve(element); this.entries.delete(element);
  }
  private collect(node: Node, remove = false) {
    if (!(node instanceof Element) || node.closest('[data-focusmask-host]')) return;
    if (node.matches('img,video')) { if (remove) this.remove(node); else this.add(node); }
    for (const element of node.querySelectorAll('img,video')) { if (remove) this.remove(element); else this.add(element); }
  }
  start() {
    if (this.running) return;
    this.running = true;
    document.documentElement.setAttribute('data-focusmask-media', 'on');
    if (typeof IntersectionObserver !== 'undefined') this.intersection = new IntersectionObserver(records => {
      for (const item of records) {
        const record = this.entries.get(item.target);
        if (record) { record.visible = item.isIntersecting; if (!record.visible) record.button.hidden = true; }
      }
      this.schedule();
    });
    if (typeof ResizeObserver !== 'undefined') this.resize = new ResizeObserver(this.schedule);
    this.collect(document.documentElement);
    this.observer = new MutationObserver(records => {
      for (const item of records) {
        if (item.type === 'childList') {
          item.removedNodes.forEach(node => this.collect(node, true));
          item.addedNodes.forEach(node => this.collect(node));
          if (item.target instanceof HTMLVideoElement || item.target instanceof HTMLPictureElement) {
            const element = item.target instanceof HTMLVideoElement ? item.target : item.target.querySelector('img');
            const record = element && this.entries.get(element); if (record) this.remask(record);
          }
        } else if (item.target instanceof Element) {
          const element = item.target instanceof HTMLSourceElement ? (item.target.parentElement instanceof HTMLPictureElement ? item.target.parentElement.querySelector('img') : item.target.parentElement) : item.target;
          const record = element && this.entries.get(element);
          if (record && ['src', 'srcset', 'sizes', 'poster'].includes(item.attributeName ?? '')) this.remask(record);
        }
      }
      this.schedule();
    });
    this.observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'sizes', 'poster', 'class', 'style', 'hidden', 'width', 'height'] });
    window.addEventListener('scroll', this.schedule, true); window.addEventListener('resize', this.schedule);
    window.addEventListener('mousemove', this.onMouseMove);
  }
  stop() {
    this.running = false;
    this.observer?.disconnect(); this.observer = null;
    this.intersection?.disconnect(); this.intersection = null;
    this.resize?.disconnect(); this.resize = null;
    window.removeEventListener('scroll', this.schedule, true); window.removeEventListener('resize', this.schedule);
    window.removeEventListener('mousemove', this.onMouseMove); this.hoverBlocked.clear();
    cancelAnimationFrame(this.frame); this.frame = 0;
    for (const element of this.entries.keys()) this.remove(element);
    document.documentElement.setAttribute('data-focusmask-media', 'off');
  }
  destroy() { this.stop(); this.layer.remove(); }
}
