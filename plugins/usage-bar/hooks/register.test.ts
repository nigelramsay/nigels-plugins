import { expect, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const at = (resetsAt: string) => ({ kind: 'five_hour', percentUsed: 42, resetsAt })

// The engine beneath the plugin: a store, a clock, timers that fire at once
// (moving the clock on) only when `fire`, a poll that ticks once when `tick`
// is called, and a session with no reading yet.
const engine = ($: Engine, on: On, fire = false) => {
  const store = new Map<string, unknown>()
  let now = Date.parse('2026-10-05T00:00:00Z')
  on('store.set', (_$, e) => (store.set(e.key, e.value), { value: null }) as never)
  on('store.get', (_$, e) => ({ value: store.get(e.key) }) as never)
  on('clock.now', () => ({ value: now }) as never)
  on('clock.after', (_$, e) => (fire ? ((now += e.ms), { value: null }) : { deny: 'not firing' }) as never)
  let tick = () => {}
  const ticked = new Promise<void>(r => (tick = r))
  let polls = 0
  on('clock.every', async () => (polls++ ? { deny: 'one tick' } : (await ticked, { value: null })) as never)
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('session.usage', () => ({ value: { startedAt: 0, context: {}, rateLimits: [] } }) as never)
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('ui.render', () => undefined as never)
  return {
    store,
    tick,
    mount: (modes: string[] = []) => $.ui.mount({ plugin: 'usage-bar', surface: 'desktop', component: 'SessionMode', props: { modes } }),
    start: () => $.session.start({ source: 'startup', cwd: '/' } as never),
    measure: (rateLimits: object[]) => $.session.measure({ rateLimits, changed: ['rateLimits'] } as never),
  }
}

test('a new session shows the saved reading, unless its window has reset', async ($, on) => {
  const { mount, start, measure } = engine($, on)

  await measure([at('2999-01-01T00:00:00Z')])
  await start()
  expect(await (await mount()).findAll({ text: /42%/ })).not.toHaveLength(0)

  await measure([at('2000-01-01T00:00:00Z')])
  await start()
  await expect(mount()).rejects.toThrow('no implementation for ui.render') // plugin passed through to the engine
})

test('a reading with no windows keeps the saved one for the next session', async ($, on) => {
  const { mount, start, measure } = engine($, on)

  await measure([at('2999-01-01T00:00:00Z')])
  await measure([])
  await start()
  expect(await (await mount()).findAll({ text: /42%/ })).not.toHaveLength(0)
})

test('the bar drops when its window resets mid-session', async ($, on) => {
  const { mount, measure } = engine($, on, true)

  await measure([at('2026-10-05T01:00:00Z')]) // the timer moves the clock to the reset
  await expect(mount()).rejects.toThrow('no implementation for ui.render')
})

test('mode labels stay dim beside the bar', async ($, on) => {
  const { mount, measure } = engine($, on)

  await measure([at('2999-01-01T00:00:00Z')])
  const [focus] = await (await mount(['focus'])).findAll({ type: 'Text', text: /^focus $/ })
  expect(focus?.props).toEqual({ dimColor: true })
})

test('a reading another session saved shows here on the next poll', async ($, on) => {
  const { store, tick, mount, start } = engine($, on)

  await start()
  await expect(mount()).rejects.toThrow('no implementation for ui.render') // nothing saved yet

  store.set('limits', [at('2999-01-01T00:00:00Z')])
  tick()
  await new Promise(r => setTimeout(r, 10)) // let the poll's load land
  expect(await (await mount()).findAll({ text: /42%/ })).not.toHaveLength(0)
})
