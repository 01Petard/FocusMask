# Interface conventions

[简体中文](DESIGN.md) · **English**

FocusMask favors clear, quiet and reversible controls. Warm white surfaces, graphite text and restrained forest green use system fonts with Chinese fallbacks. No remote fonts or assets are loaded.

- The 350px toolbar popup places branding and settings first, followed by website status, modes and quick actions. Height is bounded with scrolling. Unsupported pages use a clear empty state without misleading website status or rule counts.
- Settings uses a readable 16px body, 14px supporting text and clear headings. Website lists sit beside details and stack on narrow screens. Timing inputs consistently use milliseconds.
- Language and temporary reveal use custom lists that retain the selected value. Keyboard interaction supports arrows, Home, End, Enter, Escape and Tab, with visible focus indicators.
- Operations show working, success or failure states. Website restoration, element restoration and deletion retain their distinct meanings.
- Page protection uses a transparent top-layer surface with Gaussian backdrop blur. Media controls sit over blurred source elements. Shadow DOM isolates controls; language changes do not modify the source webpage language.
- Popup, settings and injected controls share complete Chinese and English copy. Settings includes an author link at the bottom right. Language selection offers automatic, simplified Chinese and English.

[Guide](../README.en.md)
