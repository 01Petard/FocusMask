const hostSelector = '[data-focusmask-host]';
export function validateSelector(value: string, doc = document): string {
  const selector = value.trim();
  if (!selector || selector.length > 1200 || /[{}\n\r]/.test(selector)) throw new Error('selector-invalid');
  let matches: NodeListOf<Element>;
  try { matches = doc.querySelectorAll(selector); } catch { throw new Error('selector-invalid'); }
  if (Array.from(matches).some(el => el === doc.documentElement || el === doc.body || el.matches(hostSelector) || el.closest(hostSelector))) {
    throw new Error('selector-unsafe');
  }
  // Persisted rules must remain safe even when the current page has no matching nodes.
  const probe = doc.implementation.createHTMLDocument();
  probe.body.innerHTML = '<div data-focusmask-host=""><button>UI</button></div><main></main>';
  if ([probe.documentElement, probe.body, ...probe.querySelectorAll(`${hostSelector}, ${hostSelector} *`)].some(el => el.matches(selector))) {
    throw new Error('selector-unsafe');
  }
  return selector;
}
function escape(value: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : Array.from(value).map(c => /[a-zA-Z0-9_-]/.test(c) ? c : `\\${c.codePointAt(0)!.toString(16)} `).join('');
}
export function buildSelector(element: Element): { selector: string; unstable: boolean } {
  const doc = element.ownerDocument;
  if (element === doc.body || element === doc.documentElement || element.closest(hostSelector)) throw new Error('selector-unsafe');
  if (element.id) {
    const selector = `#${escape(element.id)}`;
    if (doc.querySelectorAll(selector).length === 1 && !/[a-f0-9]{10,}|\d{5,}/i.test(element.id)) return { selector, unstable: false };
  }
  for (const attr of ['data-testid', 'data-test', 'aria-label', 'role']) {
    const value = element.getAttribute(attr);
    if (value) {
      const selector = `${element.localName}[${attr}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;
      try { validateSelector(selector, doc); return { selector, unstable: false }; } catch { /* Try a structural selector. */ }
    }
  }
  const classes = Array.from(element.classList).filter(c => !/\d{3,}|[a-f0-9]{8,}/i.test(c)).slice(0, 3);
  if (classes.length) {
    const selector = `${element.localName}${classes.map(c => `.${escape(c)}`).join('')}`;
    try { validateSelector(selector, doc); return { selector, unstable: false }; } catch { /* Fall back to a bounded path. */ }
  }
  const parts: string[] = [];
  let current: Element | null = element;
  for (let depth = 0; current && current !== doc.body && depth < 6; depth++, current = current.parentElement) {
    const siblings = Array.from(current.parentElement?.children ?? []).filter(el => el.localName === current!.localName);
    parts.unshift(`${current.localName}:nth-of-type(${siblings.indexOf(current) + 1})`);
    const selector = parts.join(' > ');
    if (doc.querySelectorAll(selector).length === 1) return { selector: validateSelector(selector, doc), unstable: true };
  }
  return { selector: validateSelector(parts.join(' > '), doc), unstable: true };
}
