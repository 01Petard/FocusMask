# Privacy statement

[简体中文](PRIVACY.md) · **English**

Applies to FocusMask 0.1.2. The extension has no accounts, backend, cloud sync, telemetry or analytics, and does not call third-party services.

## Local data

`chrome.storage.local` stores website Origins, mode switches, element selector rules, interface language and timing preferences. Temporary reveal state exists only in the current document's memory. It is not shared across tabs or synced to the cloud.

To apply visual rules, the extension processes the target document's DOM structure, element positions and media dimensions. It does not read passwords or form input values, record full HTML or browsing logs/history, or upload pages or rules.

## Permissions

| Permission | Purpose |
| --- | --- |
| `storage` | Save local preferences and rules |
| `scripting` | Inject scripts and styles bundled with the extension |
| `activeTab` | Act on the current tab after an explicit user action, such as quick page blur |
| Optional HTTP / HTTPS website access | Automatically apply saved settings after website authorization |

Keyboard shortcuts use the Manifest `commands` field without an additional permission of that name. The extension contains no remotely executed code.

## Control and deletion

You can disable modes, pause the extension, delete rules, or delete website settings and revoke corresponding access no longer needed by other saved websites. The browser controls actual permissions; a failed revocation is reported. The browser removes extension storage when you uninstall.

The author link in settings opens GitHub only when you choose it. The extension does not automatically transmit data to this link.

## Protection limits

Hiding and blur change visual presentation only. They do not block network traffic, media downloads or audio, provide a password lock, or hide address bars, tab titles, history or operating-system previews. They do not replace browser, network or system security.

[Back to the guide](../README.en.md)
