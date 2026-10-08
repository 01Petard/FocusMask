# Product behavior and scope

[简体中文](PRODUCT.md) · **English**

FocusMask 0.1.2 targets Chrome / Edge Manifest V3, covering website authorization, mode configuration, hiding or blur, saved rules, automatic reapplication and restoration with local data.

## Three modes

Element filtering hides selector matches with CSS while retaining source DOM. Media blur covers images and HTML5 videos without replacing resources or wrapping elements. Page protection uses a top-layer interface and full-viewport Gaussian backdrop blur with a temporary reveal control.

All three modes start disabled on a new website. Authorization alone does not modify the page. Persistent effects require the global, website and mode switches to be enabled.

## State and interactions

- Reveal uses click or hover. Defaults are 250ms hover activation and 1000ms automatic restoration. Notice, undo and switch animation times are also configurable. There is no remask button, and reveal buttons do not append durations.
- Temporary state belongs to the current document and is not persisted. SPA routes preserve the remaining timer. Refresh, new documents and hidden tabs restore protection.
- Quick page protection toggles both ways. Turning it off cancels temporary restoration and keeps it off across tab switches. New documents follow saved site settings again.
- Global pause clears effects and temporary state. Resume reapplies persistent settings.
- Website restoration disables the website; element restoration disables filtering. Both retain rules. Deleting a website removes settings and rules and handles corresponding authorization.

## Settings and language

Settings use normalized exact Origins, including scheme, host and effective port. The background serializes writes and queries browser permissions directly.

Language follows the browser by default: Chinese locales use simplified Chinese; all other locales use English. The language provided by the system to the page is the fallback when the browser API is unavailable. Users can persist simplified Chinese, English or automatic selection from the popup or settings. Changes update extension pages and injected controls without changing source website language.

Language and reveal controls use custom keyboard-accessible lists retaining all options and the selected value. Settings includes the author's GitHub link in the bottom-right footer.

## Engineering boundaries

Vue 3, TypeScript and Vite build extension pages. Native TypeScript content scripts run in an isolated world. The background handles permissions, settings, dynamic registration and commands. Injected controls use Shadow DOM, and only top-level regular HTML documents are processed.

Backend, accounts, sync, network blocking, AI classification, complex frames, source Shadow DOM, background images and Canvas filtering are excluded. Absolute zero flashes are not guaranteed. Store upload and publication are separate actions.

[Guide](../README.en.md) · [Verification](verification.en.md)
