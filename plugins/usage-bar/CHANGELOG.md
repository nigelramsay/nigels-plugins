# Changelog

## 0.1.1 — 2026-10-05

- All sessions on the machine share one reading: each picks up the latest within 30 seconds, whichever session heard from the API.
- The bar drops when its 5-hour window resets, even while the session sits idle.
- A response without rate limits no longer wipes the reading new sessions start with.
- Mode labels beside the bar stay dim.

## 0.1.0 — 2026-10-05

- A coloured bar in the desktop prompt footer showing how much of the 5-hour session limit is used.
- Blue fill that reads in dark mode, and a track that follows the light/dark theme.
- A new session shows the last saved reading straight away, unless its window has reset since.
