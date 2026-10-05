import type { Register } from 'claude-code'

import type { Limit } from '../types'

const limits = { plugin: 'usage-bar', key: 'limits' } as const

const CELLS = 6
const TRACK = '#d4d4d4' // ponytail: eyeballed donut grey from a screenshot
const color = (p: number) => (p > 90 ? '#d93b3b' : p > 60 ? '#e8862a' : '#2978d5')

const pick = ({ kind, percentUsed, resetsAt }: Limit): Limit => ({ kind, percentUsed, resetsAt })

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const l = (await $.session.usage()).rateLimits
    await $.state.set(limits, l.map(pick))
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) await $.state.set(limits, e.rateLimits.map(pick))
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
