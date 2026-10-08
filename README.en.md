# FocusMask

[简体中文](README.md) · **English**

Make every page yours. FocusMask is a Chrome / Edge extension that hides distracting elements and blurs images, videos or entire pages. Settings and rules stay on your device.

Current version: **0.1.2**. The interface defaults to the browser language. All Chinese browser locales use simplified Chinese; other locales use English. The popup and settings page also offer a manual language choice.

## Install and update

1. With Node.js 24+ and npm 11+, run:

   ```sh
   npm ci
   npm run verify
   ```

2. Open `chrome://extensions` or `edge://extensions`, enable developer mode and load this project's `dist` directory as an unpacked extension.
3. After updating, reload FocusMask in the extension manager, then refresh previously opened webpages. **Refreshing the settings page alone does not replace the background or existing content scripts.** Saved settings and rules are retained.

`npm run package` creates `release/focusmask-0.1.2.zip`. It does not upload or publish to any store.

## Start on a webpage

Open a regular HTTP / HTTPS website, click FocusMask in the toolbar, then choose “Enable this website” and approve access. All three modes start disabled:

| Mode | Effect | Restore |
| --- | --- | --- |
| Hide elements | Hides elements matched by saved selectors without deleting DOM nodes | Disable the mode or disable/delete a rule |
| Blur media | Applies 16px Gaussian blur to images and HTML5 videos while preserving dimensions | Click or hover for a temporary reveal |
| Blur page | Covers the viewport with Gaussian backdrop blur and a reveal control | Temporarily reveal, or toggle page blur off |

“Select an element” starts selection. Preview the effect before saving; selectors matching multiple elements require confirmation. Saved rules survive refresh. Escape or Cancel restores an unsaved preview. Undo after saving deletes only the newly created rule.

Restricted pages such as browser pages, extension pages and stores cannot be modified. The popup explains this state.

## Temporary reveals and quick toggle

Choose click or hover under “Temporary reveal”. Click reveals immediately. Hover defaults to **250ms**; leaving early cancels activation. Blur returns after **1000ms** by default. There is no remask button. Move away before hovering again.

Revealing a page leaves element hiding and media blur active. SPA navigation preserves the remaining timer. Refresh, a new document or hiding the tab restores protection. Replacing a media resource restores its blur.

The default quick toggle is `Ctrl+Shift+Y`, or `Command+Shift+Y` on macOS. Press again to disable page protection for the current document. The popup's “Enable page blur / Disable page blur” control does the same. **A disabled quick toggle stays off across timers and tab switches**; a new document follows saved site settings again. A deliberate shortcut can also protect a regular page without permanent site authorization, using activeTab without creating saved site settings.

Settings shows the actual shortcut assignment and links to the browser shortcut manager. Failed shortcuts show `!` on the toolbar. Older content scripts require a webpage refresh.

## Preferences and website management

The language menu offers “Follow browser / 简体中文 / English”. This local preference updates extension pages and already injected controls without changing the website's own language.

All times are integer milliseconds. Edit them, then choose “Save timing settings”:

| Preference | Default | Allowed range |
| --- | ---: | ---: |
| Automatically blur again | 1000 | 100–600000 |
| Hover activation delay | 250 | 0–10000 |
| Notice duration | 5000 | 500–60000 |
| Undo availability | 12000 | 1000–300000 |
| Switch animation | 100 | 0–1000 |

Settings use exact Origins, including scheme, host and effective port. Persistent effects require the global, website and corresponding mode switches to be enabled.

- Pausing clears effects and temporary state while retaining settings. Resuming reapplies persistent settings.
- “Restore website” disables the website while retaining modes, rules and authorization.
- “Restore all elements” disables element hiding while retaining rules.
- Deleting a website removes its settings and rules, and attempts to revoke access no longer needed by another saved website.

## Development and verification

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run verify
npm run package
```

`npm run dev` previews Vue pages only. Page operations, permissions and persistence require a loaded extension.

Browser tests use a separate temporary profile and local fixture:

```sh
npx playwright install chromium
npm run test:browser
```

Tests show a browser by default. Native permission prompts may require manual approval. Set `FOCUSMASK_BROWSER_EXECUTABLE` to choose an executable, or `FOCUSMASK_HEADED=0` for headless execution.

Edge page tests support a pregranted fixture:

```sh
FOCUSMASK_TEST_LABEL=edge FOCUSMASK_PREGRANT=1 \
FOCUSMASK_BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' \
npm run test:browser
```

The fixture changes only a temporary extension copy. Production permissions remain optional. It does not verify Edge's native grant, denial or revocation flows. See the [verification record](doc/verification.en.md) for evidence and remaining checks.

## Scope and limits

- Top-level regular HTML documents only. Frame internals, website Shadow DOM, CSS background images, Canvas, PDFs and special pages are excluded.
- Blur changes presentation. It does not block downloads, network requests or audio, and is not a password lock.
- Navigation protection starts early, but zero flashes cannot be guaranteed for every loading path.
- If disabling the extension leaves effects on an existing webpage, refresh it.
- Address bars, tab titles, browsing history, network traffic and system previews are not hidden.

[Privacy](doc/PRIVACY.en.md) · [Product behavior](doc/PRODUCT.en.md) · [Interface](doc/DESIGN.en.md) · [Author on GitHub](https://github.com/01Petard)
