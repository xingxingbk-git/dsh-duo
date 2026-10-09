import test from 'node:test'
import assert from 'node:assert/strict'
import { CHAT_PANEL, ModeController } from '../src/core/mode.js'
import type { ModeAuthorization } from '../src/core/mode.js'

const authorized = (id = 'A', epoch = 'grant-a'): ModeAuthorization => ({
  status: 'authorized', accountId: id, epoch, error: null,
})

function harness(original: string | null = 'plugins', compatible = true) {
  let panel = original
  let mounted = 0
  let controller: ModeController
  const order: string[] = []
  controller = new ModeController({
    readPanel: () => panel,
    selectPanel: next => { panel = next; order.push(`panel:${next}`); controller.observePanel(next) },
    mountChatNavigation: () => { mounted++; order.push('mount'); return () => { mounted--; order.push('unmount') } },
    cancelAccount: id => { order.push(`cancel:${id}`) },
  }, compatible)
  return { controller, order, panel: () => panel, mounted: () => mounted,
    navigate: (next: string | null) => { panel = next; controller.observePanel(next) } }
}

test('startup gate, direct panel entry, and missing Desktop never bypass authorization', () => {
  const h = harness()
  assert.equal(h.controller.select('chat'), false)
  h.navigate(CHAT_PANEL)
  assert.equal(h.panel(), 'plugins')
  assert.equal(h.mounted(), 0)
  const web = harness(null, false)
  web.controller.updateAuthorization(authorized())
  assert.equal(web.controller.select('chat'), false)
})

test('valid refresh keeps chosen mode and one original panel; manual exit restores before unmount', () => {
  const h = harness('plugins')
  h.controller.updateAuthorization(authorized())
  assert.equal(h.controller.getSnapshot().mode, 'harness')
  assert.equal(h.controller.select('chat'), true)
  h.controller.updateAuthorization(authorized())
  assert.equal(h.controller.getSnapshot().mode, 'chat')
  assert.equal(h.mounted(), 1)
  h.controller.select('harness')
  assert.equal(h.panel(), 'plugins')
  assert.deepEqual(h.order.slice(-2), ['panel:plugins', 'unmount'])
})

test('confirmed signout and account replacement recover immediately without auto reentry', () => {
  const h = harness(null)
  h.controller.updateAuthorization(authorized())
  h.controller.select('chat')
  h.controller.updateAuthorization({ status: 'unauthorized', accountId: null, epoch: 'closed', error: null })
  assert.equal(h.panel(), null)
  assert.equal(h.controller.canEnter(), false)
  assert.equal(h.mounted(), 0)
  h.controller.updateAuthorization(authorized('B', 'grant-b'))
  assert.equal(h.controller.getSnapshot().mode, 'harness')
  h.controller.select('chat')
  h.controller.updateAuthorization(authorized('A', 'grant-new'))
  assert.equal(h.controller.getSnapshot().mode, 'harness')
  assert.equal(h.panel(), null)
})

test('network refresh error preserves official valid identity; disposal restores null and blocks later entry', () => {
  const h = harness(null)
  h.controller.updateAuthorization(authorized())
  h.controller.select('chat')
  h.controller.updateAuthorization({ ...authorized(), error: 'network' })
  assert.equal(h.controller.getSnapshot().mode, 'chat')
  h.controller.dispose()
  assert.equal(h.panel(), null)
  assert.equal(h.mounted(), 0)
  assert.equal(h.controller.select('chat'), false)
})

test('an authorized direct main navigation captures previous panel instead of restoring its own Chat key', () => {
  const h = harness('settings')
  h.controller.updateAuthorization(authorized())
  h.navigate(CHAT_PANEL)
  assert.equal(h.controller.getSnapshot().mode, 'chat')
  h.controller.select('harness')
  assert.equal(h.panel(), 'settings')
})

test('DSH navigation owns its new panel and removes Chat overrides without rewriting Session state', () => {
  const h = harness('plugins')
  h.controller.updateAuthorization(authorized())
  h.controller.select('chat')
  h.navigate(null)
  assert.equal(h.controller.getSnapshot().mode, 'harness')
  assert.equal(h.panel(), null)
  assert.equal(h.mounted(), 0)
})
