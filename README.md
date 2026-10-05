# claude-mods

Small mods for Claude Code.

## Install

```
/plugin marketplace add nigelramsay/claude-mods
/plugin install usage-bar@claude-mods
```

## usage-bar

Draws `━━━━━━ 33%` in the desktop app's prompt footer, left of the model name: how much of
your 5-hour session limit is used. Blue up to 60%, orange above 60%, red above 90%.

- Desktop app (Code tab) only; draws nothing in the terminal.
- Needs a subscription with session limits.
- Built against Claude Code 2.1.286's mod API.
- Bar length: `CELLS` in `plugins/usage-bar/hooks/register.tsx`.
