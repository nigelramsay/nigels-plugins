import type { EngineInterface, Register } from 'claude-code'

import type { Limit } from '../types'

const limits = { plugin: 'usage-bar', key: 'limits' } as const

const CELLS = 6
const TRACK = 'inactive' // theme key, so the track follows light/dark mode
const color = (p: number) => (p > 90 ? '#d93b3b' : p > 60 ? '#e8862a' : '#2978d5')

const pick = ({ kind, percentUsed, resetsAt }: Limit): Limit => ({ kind, percentUsed, resetsAt })

const save = async ($: EngineInterface, l: Limit[]) => {
  const v = l.map(pick)
  await $.state.set(limits, v)
  await $.store.set('limits', v)
}

export const register: Register = on => {
  // Rate limits only arrive with an API response, so until the first one the
  // bar shows the last reading saved across sessions, minus windows since reset.
  on('session.start', async ($, e, next) => {
    const live = (await $.session.usage()).rateLimits
    if (live.length) await save($, live)
    else {
      const now = await $.clock.now()
      const saved = ((await $.store.get('limits')) ?? []) as Limit[]
      await $.state.set(limits, saved.filter(l => l.resetsAt && Date.parse(l.resetsAt) > now))
    }
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
        {modes}
        <Text color={color(pct)}>{'━'.repeat(filled)}</Text>
        <Text color={TRACK}>{'━'.repeat(CELLS - filled)}</Text>
        {` ${Math.round(session.percentUsed)}%`}
      </Text>
    )
  })
}
