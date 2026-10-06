# nigels-plugins

Plugins for Claude Code.

## Install

To add this repo to your marketplace list:

1. Open Claude Code
2. Open Settings
3. Click Plugins
4. Choose Add > Add Marketplace
5. Paste in: `nigelramsay/nigels-plugins`

## usage-bar

<img width="873" height="156" alt="usage-bar" src="https://github.com/user-attachments/assets/11bdc90e-0d73-4455-8f21-c91a5ccc2837" />

Draws `━━━━━━ 33%` in the desktop app's prompt footer, left of the model name: how much of
your 5-hour session limit is used. Blue up to 60%, orange above 60%, red above 90%.

- Desktop app (Code tab) only; draws nothing in the terminal.
- Needs a subscription with session limits.
- Built against Claude Code 2.1.286's mod API.
- Bar length: `CELLS` in `plugins/usage-bar/hooks/register.tsx`.
- [Changelog](plugins/usage-bar/CHANGELOG.md)
