import test from 'node:test'
import assert from 'node:assert/strict'
import type { Context } from '@deepseek-ai/cordis'
import { apply } from '../src/client.js'
import type { DuoUIBridge } from '../src/ui.js'
import type { AuthorizationState } from '../src/protocol.js'
import { CHAT_PANEL } from '../src/core/mode.js'

const authorized = (id = 'A', epoch = 'grant-a'): AuthorizationState => ({ status: 'authorized', accountId: id, epoch, error: null })
const signedOut = (): AuthorizationState => ({ status: 'unauthorized', accountId: null, epoch: 'closed', error: null })
const flush = async () => { for (let index = 0; index < 12; index++) await Promise.resolve() }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

/** Cordis nested-effect and declared-Slot fixtures; no native guest or webpage runs. */
function harness(originalPanel: string | null = 'plugins') {
  type Dispose = () => void | Promise<void>
  const rootEffects: Dispose[] = []
  let collector = rootEffects
  const setup: Promise<unknown>[] = []
  const order: string[] = []
  const registrations = new Map<string, { inject: () => { bridge: DuoUIBridge } }>()
  const panelListeners = new Set<() => void>()
  let panel = originalPanel
  const requests: ReturnType<typeof deferred<{ ok: true; value: AuthorizationState }>>[] = []
  type Item = { value: AuthorizationState; signal: AbortSignal; accept: () => void }
  const queue: Item[] = []
  let waiting: ((result: IteratorResult<Item>) => void) | undefined
  let ended = false
  const stream = {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<Item>> {
          if (queue.length) return Promise.resolve({ done: false, value: queue.shift()! })
          if (ended) return Promise.resolve({ done: true, value: undefined })
          return new Promise(resolve => { waiting = resolve })
        },
      }
    },
    async dispose() {
      ended = true
      waiting?.({ done: true, value: undefined }); waiting = undefined
      order.push('stream:dispose')
    },
  }
  const effect = (callback: () => unknown): Dispose => {
    const parent = collector
    const children: Dispose[] = []
    collector = children
    let result: unknown
    try { result = callback() } finally { collector = parent }
    const collect = (value: unknown) => {
      if (typeof value === 'function') children.push(value as Dispose)
      else if (value && typeof value === 'object' && Symbol.iterator in value) {
        children.push(...value as Iterable<Dispose>)
      }
    }
    if (result && typeof result === 'object' && 'then' in result) setup.push(Promise.resolve(result).then(collect))
    else collect(result)
    let disposed = false
    const dispose = async () => {
      if (disposed) return
      disposed = true
      for (const cleanup of [...children].reverse()) await cleanup()
    }
    parent.push(dispose)
    return dispose
  }
  const ctx = {
    effect,
    slots: {
      inject: (_name: string, callback: () => unknown) => effect(callback),
      register: (options: { name: string; key?: string; id?: string; inject: () => { bridge: DuoUIBridge } }) => {
        const key = `${options.name}:${options.key ?? options.id ?? ''}`
        registrations.set(key, options)
        return effect(() => () => { registrations.delete(key); order.push(`unregister:${key}`) })
      },
    },
    layout: {
      panelInfo: {
        getSnapshot: () => ({ activePanelId: panel }),
        subscribe: (listener: () => void) => { panelListeners.add(listener); return () => { panelListeners.delete(listener) } },
      },
      selectPanel: (next: string | null) => { panel = next; order.push(`panel:${next}`); for (const listener of panelListeners) listener() },
      toggleSidebar: () => {},
    },
    remote: {
      $mount: async () => () => { order.push('remote:unmount') },
      $stream: () => stream,
      dshDuo: {
        authorization: () => { const value = deferred<{ ok: true; value: AuthorizationState }>(); requests.push(value); return value.promise },
      },
    },
  }
  const product = globalThis as typeof globalThis & { dshDesktop?: unknown }
  const previousDesktop = product.dshDesktop
  const previousAdd = globalThis.addEventListener
  const previousRemove = globalThis.removeEventListener
  product.dshDesktop = { protocolVersion: 1, browser: { acquire: async () => ({ lease: 'unused', partition: 'unused' }), release: async () => {}, onOpenRequested: () => () => {} } }
  globalThis.addEventListener = () => {}
  globalThis.removeEventListener = () => {}
  apply(ctx as unknown as Context)
  const bridge = registrations.get(`main:${CHAT_PANEL}`)!.inject().bridge
  let cleaned = false
  return {
    bridge, order, requests, panel: () => panel,
    async ready() { await flush(); await Promise.all(setup); await flush() },
    emit(value: AuthorizationState, aborted = false) {
      const controller = new AbortController()
      if (aborted) controller.abort()
      const item = { value, signal: controller.signal, accept: () => { order.push('stream:accept') } }
      if (waiting) { const consume = waiting; waiting = undefined; consume({ done: false, value: item }) }
      else queue.push(item)
    },
    navigate: (next: string | null) => ctx.layout.selectPanel(next),
    async dispose() {
      if (cleaned) return
      cleaned = true
      try { for (const cleanup of [...rootEffects].reverse()) await cleanup() }
      finally {
        if (previousDesktop === undefined) delete product.dshDesktop
        else product.dshDesktop = previousDesktop
        globalThis.addEventListener = previousAdd
        globalThis.removeEventListener = previousRemove
      }
    },
  }
}

test('a late valid HTTP snapshot cannot reopen the Client gate after stream sign-out', async () => {
  const h = harness()
  try {
    await h.ready()
    h.requests[0].resolve({ ok: true, value: authorized() }); await flush()
    assert.equal(h.bridge.getSnapshot().modeEnabled, true)
    h.bridge.refreshAuthorization(); await flush()
    const stale = h.requests[1]
    h.emit(signedOut()); await flush()
    stale.resolve({ ok: true, value: authorized() }); await flush()
    assert.equal(h.bridge.getSnapshot().modeEnabled, false)
    assert.equal(h.bridge.getSnapshot().authorizationStatus, 'unauthorized')
    assert.equal(h.panel(), 'plugins')
  } finally { await h.dispose() }
})

test('direct unauthorized main entry retains the real prior panel; aborted stream items are ignored', async () => {
  const h = harness('settings')
  try {
    await h.ready()
    h.navigate(CHAT_PANEL)
    assert.equal(h.panel(), 'settings')
    h.emit(authorized(), true); await flush()
    assert.equal(h.bridge.getSnapshot().modeEnabled, false)
    assert.equal(h.order.includes('stream:accept'), false)
  } finally { await h.dispose() }
})

test('Client unload restores Harness before removing its main key and disposes remote observation', async () => {
  const h = harness('plugins')
  try {
    await h.ready()
    h.requests[0].resolve({ ok: true, value: authorized() }); await flush()
    h.bridge.selectMode('chat'); await flush()
    h.requests[1].resolve({ ok: true, value: authorized() }); await flush()
    assert.equal(h.panel(), CHAT_PANEL)
    h.emit(authorized()); await flush()
    assert.equal(h.bridge.getSnapshot().mode, 'chat')
    await h.dispose()
    assert.equal(h.panel(), 'plugins')
    const restore = h.order.lastIndexOf('panel:plugins')
    const removeMain = h.order.indexOf(`unregister:main:${CHAT_PANEL}`)
    assert(restore >= 0 && restore < removeMain)
    assert(h.order.includes('stream:dispose'))
    assert(h.order.includes('remote:unmount'))
  } finally { await h.dispose() }
})

test('an account change while entering Chat cannot auto-enter the replacement account', async () => {
  const h = harness()
  try {
    await h.ready()
    h.requests[0].resolve({ ok: true, value: authorized() }); await flush()
    h.bridge.selectMode('chat'); await flush()
    h.emit(authorized('B', 'grant-b')); await flush()
    h.requests[1].resolve({ ok: true, value: authorized() }); await flush()
    assert.equal(h.bridge.getSnapshot().mode, 'harness')
    assert.equal(h.bridge.getSnapshot().accountStorageKey, 'dsh-duo:website:B')
    assert.equal(h.panel(), 'plugins')
  } finally { await h.dispose() }
})
