import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { DshChatUIBridge } from '../src/ui.js'

// Compile only our Service; load the real packages from the project so Cordis,
// its registry, and the Gateway keep their published runtime identities.
const require = createRequire(path.join(process.cwd(), 'package.json'))
const { build } = require('esbuild')
const { Context, Service } = require('@deepseek-ai/cordis')
const { default: TypertRegistry } = require('@deepseek-ai/dsh-typert-registry')
const { default: TypertGateway } = require('@deepseek-ai/dsh-api-gateway')
const metadata = { version: '0.2.0-rc.2', locale: 'zh-CN', timezoneOffsetSeconds: 28_800 }

test('published Cordis and Typert Host/Client bind strict methods and withdraw them on disposal', async t => {
  const cache = path.join(process.cwd(), 'node_modules', '.cache')
  await mkdir(cache, { recursive: true })
  const output = await mkdtemp(path.join(cache, 'dsh-chat-service-test-'))
  const artifact = path.join(output, 'server.mjs')
  t.after(async () => { await rm(output, { recursive: true, force: true }) })
  await build({
    absWorkingDir: process.cwd(), entryPoints: ['src/server.ts'], outfile: artifact,
    bundle: true, packages: 'external', format: 'esm', platform: 'node', target: 'es2022',
  })
  const { DshChatController } = await import(pathToFileURL(artifact).href)
  const protocolArtifact = path.join(output, 'protocol.mjs')
  await build({
    absWorkingDir: process.cwd(), entryPoints: ['src/protocol.ts'], outfile: protocolArtifact,
    bundle: true, packages: 'external', format: 'esm', platform: 'node', target: 'es2022',
  })
  const { DSH_CHAT_REMOTE_CONTRIBUTION } = await import(pathToFileURL(protocolArtifact).href)
  // Published Client artifacts use DSH's lazyCJS loader. Run the actual
  // published factory with the same shared Cordis module supplied above.
  let ClientGateway: object | undefined
  const clientArtifact = await readFile(require.resolve('@deepseek-ai/dsh-api-gateway/client'), 'utf8')
  new Function('window', clientArtifact)({
    __ModuleLoader__: { load: (contribution: { factory: (load: typeof require) => object }) => {
      ClientGateway = contribution.factory(require)
    } },
  })
  assert.ok(ClientGateway)
  let accountStatus = 'credential-stored'
  const account = {
    getState: async () => ({ status: accountStatus }),
    getProfile: async () => ({ status: 'ready', value: { id: 'fixture-account' } }),
    async *watch(signal: AbortSignal) {
      yield { status: accountStatus }
      if (!signal.aborted) await new Promise<void>(resolve => { signal.addEventListener('abort', () => { resolve() }, { once: true }) })
    },
  }
  const ctx = new Context()
  ctx.provide('deepseekAccount', account)
  const registry = ctx.plugin(TypertRegistry)
  await registry
  const gateway = ctx.plugin(TypertGateway)
  await gateway
  const controller = ctx.plugin(DshChatController)
  await controller
  let disposed = false
  t.after(async () => {
    if (!disposed) await controller.dispose()
    await gateway.dispose()
    await registry.dispose()
  })
  assert.equal(ctx.typert.local.get('dshChat/authorization').parameters[0].codec.mode, 'strict')
  const authorized = await ctx.typertGateway.invoke({ namespace: 'dshChat', method: 'authorization', args: { metadata } })
  assert.equal(authorized.status, 'authorized')
  assert.equal(authorized.accountId, 'fixture-account')
  assert.ok(authorized.epoch)
  assert.equal('token' in authorized, false)
  ctx.emit('credentials/record-updated', 'fixture-unrelated/default')
  assert.equal(ctx.dshChat.authority.getSnapshot().epoch, authorized.epoch)
  ctx.emit('credentials/record-updated', 'deepseek-account-platform/default')
  const replacing = ctx.dshChat.authority.getSnapshot()
  assert.equal(replacing.status, 'pending')
  assert.equal(replacing.accountId, null)
  assert.notEqual(replacing.epoch, authorized.epoch)
  const reauthorized = await ctx.typertGateway.invoke({ namespace: 'dshChat', method: 'authorization', args: { metadata } })
  assert.equal(reauthorized.status, 'authorized')
  assert.notEqual(reauthorized.epoch, authorized.epoch)

  await assert.rejects(ctx.typertGateway.invoke({
    namespace: 'dshChat', method: 'authorization', args: { metadata: { ...metadata, cookie: 'fixture-only' } },
  }), (error: { code?: string }) => error.code === 'gateway/input-invalid')
  await assert.rejects(ctx.typertGateway.invoke({
    namespace: 'dshChat', method: 'authorization', args: { metadata }, signal: AbortSignal.abort(),
  }), (error: { code?: string }) => error.code === 'gateway/cancelled')

  // Only the Connection carrier is a local fixture: the Client Remote, its
  // registry, namespace mounting, cancellation, and Host dispatch are real.
  const clientCtx = new Context()
  let carrierStopped = false
  let carrierCalls = 0
  clientCtx.provide('connection', {
    start: () => ({ stop: () => { carrierStopped = true } }),
    registerGenerationSource: () => () => {},
    rpc: {
      call: async (_path: string, endpoint: string, payload: { args: object }, signal: AbortSignal) => {
        carrierCalls++
        const [namespace, method] = endpoint.split('/')
        const value = await ctx.typertGateway.invoke({ namespace, method, args: payload.args, signal })
        return { ok: true, value }
      },
      async *open(_path: string, endpoint: string, payload: { args: object }, signal: AbortSignal) {
        const [namespace, method] = endpoint.split('/')
        yield* await ctx.typertGateway.stream({ namespace, method, args: payload.args, signal })
      },
    },
  })
  const clientRegistry = clientCtx.plugin(TypertRegistry)
  await clientRegistry
  const clientGateway = clientCtx.plugin(ClientGateway)
  await clientGateway
  t.after(async () => { await clientGateway.dispose(); await clientRegistry.dispose() })
  const unmountClient = await clientCtx.remote.$mount(DSH_CHAT_REMOTE_CONTRIBUTION)
  t.after(unmountClient)
  const clientAuthorization = await clientCtx.remote.dshChat.authorization(metadata)
  assert.equal(clientAuthorization.ok, true)
  assert.equal(clientAuthorization.value.accountId, authorized.accountId)
  // A root Context bypasses plugin dependency enforcement. Keep the failing
  // shape covered explicitly so the integration cannot accidentally miss it.
  const missingDependency = clientCtx.plugin({
    name: 'fixture-missing-namespace-dependency', inject: ['remote'],
    apply: (child: typeof clientCtx) => child.remote.dshChat.authorization(metadata),
  })
  await assert.rejects(Promise.resolve(missingDependency), /remote\.dshChat.*without inject/)
  await missingDependency.dispose()
  const capturedMethod = clientCtx.remote.dshChat.authorization
  const clientStream = clientCtx.remote.dshChat.watchAuthorization(metadata)
  const clientIterator = clientStream[Symbol.asyncIterator]()
  assert.equal((await clientIterator.next()).value.status, 'authorized')

  const abort = new AbortController()
  const stream = await ctx.typertGateway.stream({
    namespace: 'dshChat', method: 'watchAuthorization', args: { metadata }, signal: abort.signal,
  })
  const iterator = stream[Symbol.asyncIterator]()
  const opening = await iterator.next()
  assert.equal(opening.value.status, 'authorized')
  accountStatus = 'signed-out'
  ctx.emit('deepseek-account/signed-out')
  const signedOut = await iterator.next()
  assert.equal(signedOut.value.status, 'unauthorized')
  assert.notEqual(signedOut.value.epoch, authorized.epoch)
  assert.equal((await clientIterator.next()).value.status, 'unauthorized')
  clientStream.dispose()
  await clientIterator.return?.()
  abort.abort()
  await iterator.return?.()

  await unmountClient()
  assert.equal(clientCtx.get('remote.dshChat'), undefined)
  const callsBeforeWithdrawal = carrierCalls
  assert.equal((await capturedMethod(metadata)).ok, false)
  assert.equal(carrierCalls, callsBeforeWithdrawal)

  // Exercise the production Client as an actual plugin, including dynamic
  // namespace injection. Only Slot presentation/layout and the carrier are fixtures.
  const productionArtifact = path.join(output, 'client.mjs')
  await build({
    absWorkingDir: process.cwd(), entryPoints: ['src/client.ts'], outfile: productionArtifact,
    bundle: true, packages: 'external', format: 'esm', platform: 'node', target: 'es2022',
    plugins: [{ name: 'presentation-fixtures', setup(plugin: any) {
      plugin.onResolve({ filter: /^\.\/(?:ui|web-surface)\.js$/ }, (args: { importer: string; path: string }) => {
        if (path.resolve(args.importer) === path.join(process.cwd(), 'src/client.ts')) return { path: args.path, namespace: 'fixture' }
      })
      plugin.onLoad({ filter: /.*/, namespace: 'fixture' }, (args: { path: string }) => ({
        contents: args.path === './ui.js'
          ? 'export const DshChatBrandName=()=>null, DshChatBrandControl=()=>null, DshChatChatNavigation=()=>null, DshChatChatPanel=()=>null, DshChatLeadingControls=()=>null, DshChatChatSettings=()=>null;'
          : 'export const DshChatWebSurface=()=>null;', loader: 'js',
      }))
    } }],
  })
  const clientPlugin = await import(pathToFileURL(productionArtifact).href)
  const product = globalThis as typeof globalThis & { dshDesktop?: unknown }
  const priorDesktop = product.dshDesktop
  const priorAdd = globalThis.addEventListener
  const priorRemove = globalThis.removeEventListener
  product.dshDesktop = { protocolVersion: 1, browser: { acquire: () => {}, release: () => {}, onOpenRequested: () => {} } }
  globalThis.addEventListener = () => {}
  globalThis.removeEventListener = () => {}
  t.after(() => {
    if (priorDesktop === undefined) delete product.dshDesktop
    else product.dshDesktop = priorDesktop
    globalThis.addEventListener = priorAdd
    globalThis.removeEventListener = priorRemove
  })
  let bridge!: DshChatUIBridge
  let panel: string | null = 'plugins'
  const panelListeners = new Set<() => void>()
  const slotKeys = new Set<string>()
  class FixtureSlots extends Service {
    constructor(context: typeof clientCtx) { super(context, 'slots') }
    inject(_name: string, callback: () => unknown) { return this.ctx.effect(callback) }
    register(options: { name: string; key?: string; id?: string; inject: () => { bridge: DshChatUIBridge } }) {
      const key = `${options.name}:${options.key ?? options.id ?? ''}`
      slotKeys.add(key)
      if (options.name === 'main') bridge = options.inject().bridge
      return this.ctx.effect(() => () => { slotKeys.delete(key) })
    }
  }
  const fixtureSlots = clientCtx.plugin(FixtureSlots)
  await fixtureSlots
  t.after(() => fixtureSlots.dispose())
  clientCtx.provide('layout', {
    panelInfo: { getSnapshot: () => ({ activePanelId: panel }), subscribe: (listener: () => void) => {
      panelListeners.add(listener); return () => { panelListeners.delete(listener) }
    } },
    selectPanel: (next: string | null) => { panel = next; for (const listener of panelListeners) listener() },
    toggleSidebar: () => {},
  })
  const production = clientCtx.plugin(clientPlugin)
  t.after(() => production.dispose())
  await production
  const until = async (predicate: () => boolean) => {
    for (let index = 0; index < 100; index++) {
      if (predicate()) return
      await new Promise<void>(resolve => { setImmediate(resolve) })
    }
    assert.fail('production Client state did not settle')
  }
  await until(() => bridge.getSnapshot().authorizationStatus === 'unauthorized')
  assert.equal(bridge.getSnapshot().modeEnabled, false)
  accountStatus = 'credential-stored'
  ctx.emit('credentials/record-updated', 'deepseek-account-platform/default')
  bridge.refreshAuthorization()
  await until(() => bridge.getSnapshot().modeEnabled)
  assert.equal(bridge.getSnapshot().mode, 'harness')
  assert.equal(bridge.getSnapshot().error, null)
  bridge.selectMode('chat')
  await until(() => bridge.getSnapshot().mode === 'chat')
  accountStatus = 'signed-out'
  ctx.emit('deepseek-account/signed-out')
  await until(() => bridge.getSnapshot().authorizationStatus === 'unauthorized')
  assert.equal(bridge.getSnapshot().mode, 'harness')
  assert.equal(panel, 'plugins')
  await production.dispose()
  assert.equal(slotKeys.size, 0)
  assert.equal(clientCtx.get('remote.dshChat'), undefined)
  await clientGateway.dispose()
  assert.equal(carrierStopped, true)

  await controller.dispose()
  disposed = true
  assert.equal(ctx.typert.local.get('dshChat/authorization'), undefined)
  assert.equal(ctx.typert.local.get('dshChat/watchAuthorization'), undefined)
  await assert.rejects(ctx.typertGateway.invoke({
    namespace: 'dshChat', method: 'authorization', args: { metadata },
  }), (error: { code?: string }) => error.code === 'gateway/definition-unavailable')
})
