# v0.1.2 verification record

[简体中文](verification.md) · **English**

Verified on 2026-10-09: macOS arm64, Node.js 24.11.0, npm 11.6.1. Source, loadable `dist` and ZIP are available. Store upload and publication were not performed.

## Results

| Check | Result |
| --- | --- |
| ESLint, Vue TypeScript, builds and release validation | `npm run verify` passed |
| Vitest + jsdom | 33 tests across 8 files passed |
| Chrome for Testing 153.0.8010.12 | 26 browser checks passed |
| Microsoft Edge 154.0.4258.62 | 26 browser checks passed |
| ZIP compared with `dist` | All 20 files identical |

Both browser runs used headless mode, separate temporary profiles and pregranted local HTTP fixtures. Required host access exists only in temporary test copies; production host permissions remain optional. Fixture permissions cannot be revoked. Website deletion checks assert removal of settings/effects and the expected revocation failure. **These results do not verify native grant, denial or revocation.** A direct optional permission request in headless mode remained pending and was not counted as a pass.

## Coverage

Unit checks cover Origins and ports, selectors, concurrent settings writes, migration defaults, timing/language validation, privacy/media state, picker previews and undo, and custom lists. Language checks cover simplified, traditional, Hong Kong and Hant locales using simplified Chinese, other locales using English, and manual choices overriding automatic detection.

Browser checks cover mode switching, backdrop blur, source dialogs, click/hover reveals, automatic restoration, SPA and tab changes, replaced resources, dynamic media, element rules, pause/resume, port isolation, restrictive CSP, refresh and browser restart. A custom 1800ms restore interval is checked against actual page behavior.

New UI checks verify synchronized Chinese/English settings, popup and injected controls; persistence and retained options; returning to browser defaults; translated tab titles; unchanged source website language; unsupported-page empty states; the author link; and no horizontal overflow in the popup or mobile settings. Both language variants were visually reviewed.

Popup checks render the shipped page with only active-tab selection adapted to a fixture tab. Background and content communication remain real. This is not a complete native toolbar flow verification.

During the shortcut fix, native `Command+Shift+Y` was verified to enable and disable blur in the user's existing Edge installation at version 0.1.1. Version 0.1.2 retains that shortcut logic; operating-system key verification was not repeated for this build.

## Performance sample

The fixture dynamically adds at least 500 media nodes and keeps appending. Thirty scroll frames and click-to-next-frame latency are sampled with the extension enabled and paused.

| Browser | Enabled mean / max frame interval | Paused mean / max frame interval | Enabled / paused interaction | Long tasks |
| --- | --- | --- | --- | --- |
| Chrome for Testing | 16.46 / 16.80ms | 16.35 / 16.70ms | 17.60 / 15.70ms | 0 / 0 |
| Edge | 16.52 / 16.80ms | 16.37 / 16.70ms | 16.70 / 16.00ms | 0 / 0 |

This short local sample is not a performance guarantee for all websites.

## Package

`release/focusmask-0.1.2.zip`: 65,588 bytes, 20 files. Every extracted file matches the tested `dist`. SHA-256:

```text
06d568934d4ac955b46720057dd8a524eadd25f3532e611cef4ec3dfce94bb6e
```

The package does not contain fixture host permissions. Runtime checks load temporary copies of `dist`; store installation was not tested. See the [guide](../README.en.md) for reproduction and fixture commands.

Raw records: `output/playwright/results-chromium.json`, `results-edge.json`, and `native-shortcut-result.json`. Screenshots include `popup-zh.png`, `popup-en.png`, `popup-unsupported.png`, `popup-unsupported-en.png`, `settings-zh.png`, `settings-en.png` and `settings-mobile.png`. These artifacts are excluded from the ZIP.

## Manual release checks remaining

- Clean profiles on current stable Chrome, and real grant, denial, revocation and reauthorization.
- Complete native toolbar flow, shortcut conflicts and held-key behavior.
- HTTPS, subdomains, default ports, history cache returns, minimized windows and restoration after disabling the extension.
- First-navigation recordings and real-site GIFs, videos, lazy loading and long-running appended content.

These checks are incomplete. Automated success does not replace every manual release gate.
