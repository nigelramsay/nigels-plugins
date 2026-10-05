import { expect, test } from 'claude-code/testing'

const at = (resetsAt: string) => ({ kind: 'five_hour', percentUsed: 42, resetsAt })

test('a new session shows the saved reading, unless its window has reset', async ($, on) => {
  const store = new Map<string, unknown>()
  on('store.set', (_$, e) => (store.set(e.key, e.value), { value: null }) as never)
  on('store.get', (_$, e) => ({ value: store.get(e.key) }) as never)
  on('clock.now', () => ({ value: Date.parse('2026-10-05T00:00:00Z') }) as never)
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [] } }) as never)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('ui.render', () => undefined as never)
  const mount = () => $.ui.mount({ plugin: 'usage-bar', surface: 'desktop', component: 'SessionMode', props: { modes: [] } })
  const start = () => $.session.start({ source: 'startup', cwd: '/' } as never)

  await $.session.measure({ rateLimits: [at('2999-01-01T00:00:00Z')], changed: ['rateLimits'] } as never)
  await start()
  expect(await (await mount()).findAll({ text: /42%/ })).not.toHaveLength(0)

  await $.session.measure({ rateLimits: [at('2000-01-01T00:00:00Z')], changed: ['rateLimits'] } as never)
  await start()
  await expect(mount()).rejects.toThrow('no implementation for ui.render') // plugin passed through to the engine
})
