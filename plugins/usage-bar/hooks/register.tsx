import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Limit } from '../types'

const limits = { plugin: 'usage-bar', key: 'limits' } as const

const CELLS = 6
const TRACK = 'inactive' // theme key, so the track follows light/dark mode
const color = (p: number) => (p > 90 ? '#d93b3b' : p > 60 ? '#e8862a' : '#2978d5')

const POLL_MS = 30_000 // how soon a reading another session saved shows here

let expiry: Timer | undefined

// Shows the windows that haven't reset, and drops each one as its reset passes,
// since no new reading arrives while the session sits idle.
const show = async ($: EngineInterface, l: Limit[]) => {
  const now = await $.clock.now()
  const open = l.filter(x => !x.resetsAt || Date.parse(x.resetsAt) > now)
  await $.state.set(limits, open)
  expiry?.cancel()
  const resets = open.flatMap(x => (x.resetsAt ? [Date.parse(x.resetsAt)] : []))
  if (resets.length) expiry = $.clock.after(Math.min(...resets) - now, () => show($, open))
}

const save = async ($: EngineInterface, l: Limit[]) => {
  await show($, l)
  // An empty reading would wipe the one the next session starts with.
  if (l.length) await $.store.set('limits', l)
}

// Every session on this machine shares the store, so this picks up the reading
// whichever session heard from the API last.
const load = async ($: EngineInterface) => {
  const saved = await $.store.get('limits')
  if (Array.isArray(saved) && saved.length) await show($, saved)
}

export const register: Register = on => {
  // Rate limits only arrive with an API response, so until the first one the
  // bar shows the last reading any session saved, minus windows since reset.
  on('session.start', async ($, e, next) => {
    const live = (await $.session.usage()).rateLimits
    if (live.length) await save($, live)
    else await load($)
    $.clock.every(POLL_MS, () => load($))
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) await save($, e.rateLimits)
    return next(e)
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    if (e.surface !== 'desktop') return next(e)
    const { value: all = [] } = await $.state.get(limits)
    const session = all.find(l => l.kind === 'five_hour')
    if (!session) return next(e)

    const { Text } = $.ui.resolve(e)
    const pct = Math.min(100, session.percentUsed)
    const filled = Math.round((pct * CELLS) / 100)
    const modes = e.props.modes.length ? `${e.props.modes.join(' & ')} ` : ''

    return (
      <Text>
        <Text dimColor>{modes}</Text>
        <Text color={color(pct)}>{'━'.repeat(filled)}</Text>
        <Text color={TRACK}>{'━'.repeat(CELLS - filled)}</Text>
        {` ${Math.round(session.percentUsed)}%`}
      </Text>
    )
  })
}
