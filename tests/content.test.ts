import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrivacyScreen } from '../src/content/privacy';
import { MediaMask } from '../src/content/media';
const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach(fn => fn()); vi.useRealTimers(); document.documentElement.removeAttribute('data-focusmask-privacy'); document.documentElement.removeAttribute('data-focusmask-media'); document.body.innerHTML = ''; });
function ui() { const host = document.createElement('div'); host.setAttribute('data-focusmask-host', ''); document.documentElement.append(host); cleanups.push(() => host.remove()); return host.attachShadow({ mode: 'open' }); }
describe('page privacy', () => {
  it('uses a custom reveal interval and keeps all duration text off the show button', () => {
    vi.useFakeTimers(); const root = ui(); const privacy = new PrivacyScreen(root); cleanups.push(() => privacy.destroy());
    privacy.configure({ revealDurationMs: 1800, hoverDelayMs: 400 }); privacy.protect(); privacy.unlock();
    vi.advanceTimersByTime(1799); expect(privacy.protected).toBe(false);
    vi.advanceTimersByTime(1); expect(privacy.protected).toBe(true);
    expect(root.querySelector('button')!.textContent).not.toMatch(/\d|ms/);
  });
  it('automatically protects again after exactly 1000ms and cancels the timer when disabled', () => {
    vi.useFakeTimers();
    const privacy = new PrivacyScreen(ui()); cleanups.push(() => privacy.destroy());
    privacy.protect(); privacy.unlock();
    vi.advanceTimersByTime(999); expect(privacy.protected).toBe(false);
    vi.advanceTimersByTime(1); expect(privacy.protected).toBe(true);
    privacy.unlock(); privacy.reset(); vi.advanceTimersByTime(1000);
    expect(privacy.protected).toBe(false); privacy.onHidden(); expect(privacy.protected).toBe(false);
  });
  it('toggles protection off during a temporary reveal without automatically re-enabling it', () => {
    vi.useFakeTimers();
    const privacy = new PrivacyScreen(ui()); cleanups.push(() => privacy.destroy());
    privacy.toggle(); expect(privacy.protected).toBe(true);
    privacy.unlock(); privacy.toggle(); vi.advanceTimersByTime(1000);
    privacy.onHidden(); expect(privacy.protected).toBe(false);
    privacy.toggle(); expect(privacy.protected).toBe(true);
  });
  it('uses the configured hover trigger and still remasks while the pointer stays in place', () => {
    vi.useFakeTimers();
    const root = ui(); const privacy = new PrivacyScreen(root); cleanups.push(() => privacy.destroy());
    privacy.setTrigger('hover'); privacy.protect();
    root.querySelector('button')!.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(249); expect(privacy.protected).toBe(true);
    vi.advanceTimersByTime(1);
    expect(privacy.protected).toBe(false);
    vi.advanceTimersByTime(1000); expect(privacy.protected).toBe(true);
  });
  it('cancels page hover when the pointer leaves early or protection is switched off', () => {
    vi.useFakeTimers(); const root = ui(); const privacy = new PrivacyScreen(root); cleanups.push(() => privacy.destroy());
    privacy.setTrigger('hover'); privacy.protect(); const button = root.querySelector('button')!;
    button.dispatchEvent(new MouseEvent('mouseenter')); vi.advanceTimersByTime(100);
    button.dispatchEvent(new MouseEvent('mouseleave')); vi.advanceTimersByTime(250);
    expect(privacy.protected).toBe(true);
    button.dispatchEvent(new MouseEvent('mouseenter')); privacy.toggle(); vi.advanceTimersByTime(1250);
    expect(privacy.enabled).toBe(false); expect(privacy.protected).toBe(false);
  });
  it('reprotects after hiding, unlocks explicitly and restores original inert state', () => {
    const privacy = new PrivacyScreen(ui()); cleanups.push(() => privacy.destroy());
    privacy.protect(); privacy.protect();
    expect(privacy.protected).toBe(true);
    privacy.unlock(); expect(privacy.protected).toBe(false);
    privacy.onHidden(); expect(privacy.protected).toBe(true);
    privacy.reset(); expect(privacy.protected).toBe(false);
    privacy.onHidden(); expect(privacy.protected).toBe(false);
  });
});
describe('independent media masks', () => {
  it('uses custom hover and reveal timings and shows no remask controls', () => {
    vi.useFakeTimers(); document.body.innerHTML = '<img src="first.png">';
    const root = ui(); const media = new MediaMask(root); cleanups.push(() => media.destroy()); media.setTrigger('hover');
    media.configure({ revealDurationMs: 1800, hoverDelayMs: 400 }); media.start();
    const image = document.querySelector('img')!; const button = root.querySelector('button')!;
    expect(button.textContent).not.toMatch(/\d|ms/);
    button.dispatchEvent(new MouseEvent('mouseenter')); vi.advanceTimersByTime(399);
    expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
    vi.advanceTimersByTime(1); expect(image.hasAttribute('data-focusmask-revealed')).toBe(true); expect(button.hidden).toBe(true);
    expect(root.textContent).not.toMatch(/重新模糊|重新遮挡|Blur again/);
    vi.advanceTimersByTime(1799); expect(image.hasAttribute('data-focusmask-revealed')).toBe(true);
    vi.advanceTimersByTime(1); expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
  });
  it('remasks a clicked image after 1000ms and cancels pending reveals when stopped', () => {
    vi.useFakeTimers(); document.body.innerHTML = '<img src="first.png">';
    const root = ui(); const media = new MediaMask(root); cleanups.push(() => media.destroy()); media.start();
    const image = document.querySelector('img')!; const button = root.querySelector('button')!;
    button.click(); expect(button.hidden).toBe(true); vi.advanceTimersByTime(999); expect(image.hasAttribute('data-focusmask-revealed')).toBe(true);
    vi.advanceTimersByTime(1); expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
    button.click(); media.stop(); vi.advanceTimersByTime(1000);
    expect(root.querySelectorAll('button')).toHaveLength(0); expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
  });
  it('requires a fresh hover after the automatic 1000ms remask', () => {
    vi.useFakeTimers(); document.body.innerHTML = '<img src="first.png">';
    const image = document.querySelector('img')!;
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 200, bottom: 120, width: 200, height: 120, toJSON: () => ({}) });
    const root = ui(); const media = new MediaMask(root); cleanups.push(() => media.destroy()); media.setTrigger('hover'); media.start();
    const button = root.querySelector('button')!;
    button.dispatchEvent(new MouseEvent('mouseenter', { clientX: 50, clientY: 50 }));
    vi.advanceTimersByTime(249); expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(image.hasAttribute('data-focusmask-revealed')).toBe(true);
    vi.advanceTimersByTime(1000); button.dispatchEvent(new MouseEvent('mouseenter', { clientX: 50, clientY: 50 }));
    expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250, clientY: 50 }));
    button.dispatchEvent(new MouseEvent('mouseenter', { clientX: 50, clientY: 50 }));
    vi.advanceTimersByTime(250);
    expect(image.hasAttribute('data-focusmask-revealed')).toBe(true);
  });
  it('cancels pending hover on mouse leave, trigger change and stopping the mode', () => {
    vi.useFakeTimers(); document.body.innerHTML = '<img src="first.png">';
    const root = ui(); const media = new MediaMask(root); cleanups.push(() => media.destroy()); media.setTrigger('hover'); media.start();
    const image = document.querySelector('img')!; const button = root.querySelector('button')!;
    button.dispatchEvent(new MouseEvent('mouseenter')); vi.advanceTimersByTime(100);
    button.dispatchEvent(new MouseEvent('mouseleave')); vi.advanceTimersByTime(250);
    expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
    button.dispatchEvent(new MouseEvent('mouseenter')); media.setTrigger('click'); vi.advanceTimersByTime(250);
    expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
    media.setTrigger('hover'); button.dispatchEvent(new MouseEvent('mouseenter')); media.stop(); vi.advanceTimersByTime(1250);
    expect(image.hasAttribute('data-focusmask-revealed')).toBe(false);
  });
  it('clips masks to the visible media rectangle instead of covering adjacent content', async () => {
    document.body.innerHTML = '<img src="first.png">';
    const image = document.querySelector('img')!;
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({ x: -30, y: -70, left: -30, top: -70, right: 170, bottom: 50, width: 200, height: 120, toJSON: () => ({}) });
    const root = ui(); const media = new MediaMask(root); cleanups.push(() => media.destroy()); media.start();
    await new Promise(resolve => setTimeout(resolve, 30));
    const mask = root.querySelector('button')!;
    expect(mask.style.left).toBe('0px'); expect(mask.style.top).toBe('0px');
    expect(mask.style.width).toBe('170px'); expect(mask.style.height).toBe('50px');
  });
  it('reveals one image without activating its link and remasks changed resources', async () => {
    document.body.innerHTML = '<a href="#clicked"><img src="first.png" width="120" height="80"></a><img src="second.png">';
    const images = document.querySelectorAll('img');
    const root = ui();
    const media = new MediaMask(root); cleanups.push(() => media.destroy());
    const click = vi.fn(); document.querySelector('a')!.addEventListener('click', click);
    media.start();
    const buttons = root.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
    (buttons[0] as HTMLButtonElement).click();
    expect(images[0].hasAttribute('data-focusmask-revealed')).toBe(true);
    expect(images[1].hasAttribute('data-focusmask-revealed')).toBe(false);
    expect(click).not.toHaveBeenCalled();
    images[0].src = 'replacement.png';
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(images[0].hasAttribute('data-focusmask-revealed')).toBe(false);
    media.stop();
    expect(root.querySelectorAll('button')).toHaveLength(0);
    expect(document.documentElement.getAttribute('data-focusmask-media')).toBe('off');
  });
});
