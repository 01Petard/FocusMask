import { t } from '../shared/i18n';
import { HOVER_DELAY_MS, REVEAL_DURATION_MS, type RevealTrigger } from '../shared/types';
export class PrivacyScreen {
  protected = false;
  private armed = false;
  get enabled() { return this.armed; }
  private trigger: RevealTrigger = 'click';
  private timer = 0;
  private hoverTimer = 0;
  private revealDurationMs = REVEAL_DURATION_MS;
  private hoverDelayMs = HOVER_DELAY_MS;
  private hoverBlocked = false;
  private hoverArea: DOMRect | null = null;
  private readonly button = document.createElement('button');
  private previousFocus: HTMLElement | null = null;
  private inertBody: HTMLElement | null = null;
  private previousInert = false;
  private readonly screen = document.createElement('dialog');
  private observer: MutationObserver | null = null;
  private readonly message = document.createElement('p');
  private readonly heading = document.createElement('h1');
  private failed = false;
  updateLanguage() { this.heading.textContent = t('protected'); this.button.textContent = t(this.trigger === 'hover' ? 'revealHover' : 'revealClick'); this.message.textContent = this.failed ? t('initFailed') : ''; }
  constructor(private readonly root: ShadowRoot) {
    this.screen.className = 'privacy';
    this.screen.setAttribute('role', 'dialog');
    this.screen.setAttribute('aria-modal', 'true');
    this.screen.addEventListener('cancel', event => event.preventDefault());
    const brand = document.createElement('strong'); brand.textContent = 'FocusMask';
    this.heading.textContent = t('protected');
    this.button.textContent = t('revealClick'); this.button.className = 'primary';
    this.button.addEventListener('click', event => { if (this.trigger === 'click' || event.detail === 0) this.unlock(); });
    this.button.addEventListener('mouseenter', () => {
      if (this.trigger !== 'hover' || this.hoverBlocked || !this.protected) return;
      window.clearTimeout(this.hoverTimer);
      this.hoverArea = this.button.getBoundingClientRect();
      this.hoverTimer = window.setTimeout(() => {
        this.hoverTimer = 0;
        if (this.trigger === 'hover' && this.protected && !this.hoverBlocked) { this.hoverBlocked = true; this.unlock(); }
      }, this.hoverDelayMs);
    });
    this.button.addEventListener('mouseleave', () => { window.clearTimeout(this.hoverTimer); this.hoverTimer = 0; });
    window.addEventListener('mousemove', this.onMouseMove);
    this.screen.append(brand, this.heading, this.message, this.button);
    this.screen.hidden = true;
    root.append(this.screen);
  }
  configure(timing: { revealDurationMs: number; hoverDelayMs: number }) {
    if (this.revealDurationMs !== timing.revealDurationMs || this.hoverDelayMs !== timing.hoverDelayMs) {
      window.clearTimeout(this.hoverTimer); this.hoverTimer = 0;
      if (this.armed && !this.protected) this.protect();
    }
    this.revealDurationMs = timing.revealDurationMs; this.hoverDelayMs = timing.hoverDelayMs;
  }
  setTrigger(trigger: RevealTrigger) {
    if (this.trigger !== trigger) { window.clearTimeout(this.hoverTimer); this.hoverTimer = 0; this.hoverBlocked = false; if (this.armed && !this.protected) this.protect(); }
    this.trigger = trigger;
    this.button.textContent = t(trigger === 'hover' ? 'revealHover' : 'revealClick');
  }
  private readonly onMouseMove = (event: MouseEvent) => {
    if (!this.hoverBlocked) return;
    const rect = this.hoverArea ?? this.button.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.hoverBlocked = false;
  };
  ensureBody() {
    if (!this.protected || !document.body || this.inertBody === document.body) return;
    this.restoreInert();
    this.inertBody = document.body;
    this.previousInert = document.body.inert;
    document.body.inert = true;
  }
  private restoreInert() {
    if (this.inertBody) this.inertBody.inert = this.previousInert;
    this.inertBody = null;
  }
  protect(failed = false) {
    window.clearTimeout(this.timer); this.timer = 0;
    window.clearTimeout(this.hoverTimer); this.hoverTimer = 0;
    this.armed = true;
    if (!this.protected) this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.protected = true;
    this.root.host.setAttribute('data-focusmask-cover', '');
    document.documentElement.setAttribute('data-focusmask-privacy', 'on');
    this.failed = failed; this.message.textContent = failed ? t('initFailed') : '';
    this.screen.hidden = false;
    this.raise();
    document.documentElement.setAttribute('data-focusmask-screen', '');
    if (!this.observer) {
      this.observer = new MutationObserver(records => {
        if (records.some(record => record.type === 'childList' && Array.from(record.addedNodes).some(node => node instanceof Element && (node.matches('dialog[open], [popover]') || node.querySelector('dialog[open], [popover]'))) || record.target instanceof HTMLDialogElement && record.target.open)) this.raise();
        this.ensureBody();
      });
      this.observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
      document.addEventListener('toggle', this.onToggle, true);
    }
    this.ensureBody();
    this.button.focus({ preventScroll: true });
  }
  unlock(temporary = true) {
    window.clearTimeout(this.timer); this.timer = 0;
    window.clearTimeout(this.hoverTimer); this.hoverTimer = 0;
    this.protected = false;
    this.root.host.removeAttribute('data-focusmask-cover');
    document.documentElement.setAttribute('data-focusmask-privacy', 'off');
    document.documentElement.removeAttribute('data-focusmask-screen');
    this.screen.hidden = true;
    this.observer?.disconnect(); this.observer = null;
    document.removeEventListener('toggle', this.onToggle, true);
    if (this.screen.open && typeof this.screen.close === 'function') this.screen.close();
    else this.screen.removeAttribute('open');
    this.restoreInert();
    if (this.previousFocus?.isConnected) this.previousFocus.focus({ preventScroll: true });
    this.previousFocus = null;
    if (temporary && this.armed) this.timer = window.setTimeout(() => { this.timer = 0; if (this.armed) this.protect(); }, this.revealDurationMs);
  }
  onHidden() { if (this.armed) this.protect(); }
  private readonly onToggle = (event: Event) => {
    if (event.target instanceof Element && event.target.matches('dialog, [popover]')) this.raise();
  };
  private raise() {
    if (!this.protected) return;
    // The browser top layer can escape body opacity and maximum z-index. Only our own dialog is reopened.
    if (typeof this.screen.showModal === 'function') {
      if (this.screen.open) this.screen.close();
      this.screen.showModal();
    } else this.screen.setAttribute('open', '');
  }
  toggle() { if (this.armed) this.reset(); else this.protect(); }
  reset() { this.armed = false; this.hoverBlocked = false; this.unlock(false); }
  destroy() { this.reset(); window.removeEventListener('mousemove', this.onMouseMove); this.screen.remove(); }
}
