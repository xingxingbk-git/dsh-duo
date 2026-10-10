import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-api-gateway/client'
import type { DesktopBrowserBridge } from '@deepseek-ai/dsh-client-ui-sidebar-browser/types'
import { CHAT_PANEL, ModeController } from './core/mode.js'
import { authorizationSchema, DUO_REMOTE_CONTRIBUTION } from './protocol.js'
import type { AuthorizationState, DuoClientMetadata } from './protocol.js'
import { DuoBrandName, DuoBrandControl, DuoChatNavigation, DuoChatPanel } from './ui.js'
import type { DuoUIBridge, DuoViewState, DuoViewportRect } from './ui.js'
import { DuoWebSurface } from './web-surface.js'
import { emptyNavigation, parseWebsiteNavigation, type WebsiteCommand } from './website-navigation.js'

export const name = 'dsh-duo'
export const inject = ['slots', 'layout', 'remote']
const AUTHORIZATION_TIMEOUT_MS = 35_000

function desktopBrowser(): DesktopBrowserBridge | undefined {
  const desktop = (globalThis as typeof globalThis & {
    dshDesktop?: { protocolVersion?: number; browser?: DesktopBrowserBridge }
  }).dshDesktop
  if (desktop?.protocolVersion !== 1) return undefined
  const browser = desktop.browser
  return browser && typeof browser.acquire === 'function' && typeof browser.release === 'function'
    && typeof browser.onOpenRequested === 'function' ? browser : undefined
}

export function apply(ctx: Context): void {
  const nativeBrowser = desktopBrowser()
  const lifetime = new AbortController()
  const listeners = new Set<() => void>()
  let disposed = false
  let remoteContext: Context | null = null
  let connecting: Promise<void> | null = null
  let refreshing: Promise<void> | null = null
  let authorizationGeneration = 0
  let websiteReloadRevision = 0
  let webLoading = false
  let webError: string | null = null
  let connectionError: string | null = null
  let navigationAttempt = 0
  let viewport: DuoViewportRect | null = null
  let brandAnchor: DuoViewportRect | null = null
  let websiteNavigation = emptyNavigation()
  let showWebsiteNavigation = false
  let navigationHandler: ((command: WebsiteCommand) => Promise<void>) | null = null
  let bridge: DuoUIBridge
  let cached: DuoViewState
  const mode = new ModeController({
    readPanel: () => ctx.layout.panelInfo.getSnapshot().activePanelId,
    selectPanel: panel => { ctx.layout.selectPanel(panel as MainPanelId | null) },
    mountChatNavigation: () => {
      return ctx.slots.inject('sidebar.workspaces', () => ctx.slots.register({ name: 'sidebar.workspaces', priority: -100, inject: () => ({ bridge }) }, DuoChatNavigation))
    },
    cancelAccount: () => { authorizationGeneration++; webLoading = false; webError = null; websiteNavigation = emptyNavigation(); navigationHandler = null; publish() },
  }, Boolean(nativeBrowser))
  function availability(): string {
    const state = mode.getSnapshot()
    if (!nativeBrowser) return '网页嵌入目前需要 DSH 桌面版 0.2.0-rc.2 的官方浏览器能力。'
    if (state.authorization.status === 'pending') return '正在确认 DSH 的 DeepSeek 账号授权。'
    if (state.authorization.status === 'unauthorized') return '请先在 Harness 中登录并授权 DeepSeek 账号，确认后即可使用 CHAT。'
    if (state.authorization.status === 'unavailable') return '暂时无法确认 DSH 账号授权，请检查网络后刷新。'
    return '真实 DeepSeek 网页；网页登录与 DSH 授权分别处理。'
  }
  function publish(): void {
    if (disposed) return
    const state = mode.getSnapshot()
    cached = {
      mode: state.mode, modeEnabled: mode.canEnter(), authorizationStatus: state.authorization.status,
      availabilityMessage: availability(), accountLabel: state.authorization.status === 'authorized' ? 'DSH 账号已授权' : null,
      error: state.error ?? connectionError ?? (state.authorization.error ? 'DSH 账号状态刷新遇到网络或服务问题。' : null),
      desktopAvailable: Boolean(nativeBrowser), webLoading, webError, viewport, brandAnchor,
      accountStorageKey: state.authorization.status === 'authorized' && state.authorization.accountId
        ? `dsh-duo:website:${state.authorization.accountId}` : null,
      authorizationGeneration, websiteReloadRevision, websiteNavigation, showWebsiteNavigation,
    }
    for (const listener of listeners) listener()
  }
  function acceptAuthorization(value: AuthorizationState): void {
    const next = authorizationSchema.parse(value)
    const previous = mode.getSnapshot().authorization
    if (next.accountId !== previous.accountId || next.epoch !== previous.epoch) {
      authorizationGeneration++; websiteNavigation = emptyNavigation(); navigationHandler = null; showWebsiteNavigation = false
    }
    connectionError = null
    mode.updateAuthorization(next)
    publish()
  }
  const metadata: DuoClientMetadata = {
    version: '0.2.0-rc.2', locale: globalThis.navigator?.language ?? 'zh-CN',
    timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
  }
  function authorizationFailed(message: string): void {
    if (disposed) return
    connectionError = message
    const previous = mode.getSnapshot().authorization
    // A transport failure cannot revoke an already confirmed account or imply sign-out.
    if (previous.status === 'pending') mode.updateAuthorization({ ...previous, status: 'unavailable' })
    publish()
  }
  async function connectRemote(): Promise<void> {
    if (remoteContext || disposed) return
    if (!connecting) {
      connecting = Promise.resolve(ctx.effect(async () => {
        const unmount = await ctx.remote.$mount(DUO_REMOTE_CONTRIBUTION)
        if (disposed) { await unmount(); return () => {} }
        // $mount publishes a separate Cordis service. Inject it only after
        // mounting, and call its methods from this dependency-aware Context.
        const consumer = ctx.inject(['remote', 'remote.dshDuo'], remoteCtx => {
          remoteCtx.effect(() => {
            remoteContext = remoteCtx
            const stream = remoteCtx.remote.$stream<AuthorizationState>({
              name: 'dsh-duo.authorization', open: signal => remoteCtx.remote.dshDuo.watchAuthorization(metadata, signal),
              ended: () => new Error('DSH account stream ended'),
              carrierFailed: () => { authorizationFailed('DSH 账号连接暂时中断，请刷新授权。') },
            })
            void (async () => {
              try {
                for await (const item of stream) {
                  if (disposed || remoteContext !== remoteCtx) break
                  if (item.signal.aborted) continue
                  acceptAuthorization(item.value); item.accept()
                }
              } catch { if (remoteContext === remoteCtx) authorizationFailed('DSH 账号状态通知不可用，请刷新授权。') }
            })()
            return () => {
              if (remoteContext === remoteCtx) remoteContext = null
              return stream.dispose()
            }
          }, 'dsh-duo account observation')
        })
        try { await consumer }
        catch (error) { await consumer.dispose(); await unmount(); throw error }
        return async () => { await consumer.dispose(); await unmount() }
      }, 'dsh-duo safe account remote')).then(() => {}).finally(() => { connecting = null })
    }
    await connecting
  }
  function refreshAuthorization(): Promise<void> {
    if (disposed) return Promise.resolve()
    if (refreshing) return refreshing
    refreshing = (async () => {
      const requestGeneration = authorizationGeneration
      const request = new AbortController()
      const cancel = () => { request.abort() }
      lifetime.signal.addEventListener('abort', cancel, { once: true })
      let timedOut = false
      let timer: ReturnType<typeof setTimeout> | undefined
      const deadline = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => { timedOut = true; request.abort(); reject(new Error('Authorization deadline exceeded')) }, AUTHORIZATION_TIMEOUT_MS)
        request.signal.addEventListener('abort', () => { reject(new Error('Authorization request cancelled')) }, { once: true })
      })
      try {
        const result = await Promise.race([
          (async () => {
            await connectRemote()
            if (request.signal.aborted || !remoteContext) throw new Error('Account remote unavailable')
            return remoteContext.remote.dshDuo.authorization(metadata, request.signal)
          })(), deadline,
        ])
        if (disposed || request.signal.aborted || requestGeneration !== authorizationGeneration) return
        if (result.ok) acceptAuthorization(result.value)
        else authorizationFailed('无法连接 DSH 账号服务，请刷新授权重试。')
      } catch {
        if (!disposed && (requestGeneration === authorizationGeneration || mode.getSnapshot().authorization.status === 'pending')) authorizationFailed(timedOut
          ? 'DSH 账号授权检查超时，请检查网络后刷新授权。' : '无法连接 DSH 账号服务，请刷新授权重试。')
      } finally {
        clearTimeout(timer)
        lifetime.signal.removeEventListener('abort', cancel)
      }
    })().finally(() => { refreshing = null })
    return refreshing
  }
  bridge = {
    getSnapshot: () => cached,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
    selectMode: selected => {
      const attempt = ++navigationAttempt
      if (selected === 'harness') { mode.select('harness'); return }
      const requestedAccount = mode.getSnapshot().authorization
      void refreshAuthorization().then(() => {
        const currentAccount = mode.getSnapshot().authorization
        if (!disposed && attempt === navigationAttempt && currentAccount.accountId === requestedAccount.accountId
          && currentAccount.epoch === requestedAccount.epoch) mode.select('chat')
      })
    },
    refreshAuthorization: () => { void refreshAuthorization() },
    manageAccount: () => { mode.select('harness') },
    toggleSidebar: () => { ctx.layout.toggleSidebar() },
    attachViewport: element => { if (!element) { viewport = null; publish() } },
    updateViewport: next => {
      if (viewport?.left === next?.left && viewport?.top === next?.top && viewport?.width === next?.width && viewport?.height === next?.height) return
      viewport = next; publish()
    },
    updateBrandAnchor: next => {
      if (brandAnchor?.left === next?.left && brandAnchor?.top === next?.top && brandAnchor?.width === next?.width && brandAnchor?.height === next?.height) return
      brandAnchor = next; publish()
    },
    reportWebsiteState: (generation, state) => {
      if (disposed || generation !== authorizationGeneration) return
      webLoading = state.loading; webError = state.error; publish()
    },
    reloadWebsite: () => { websiteReloadRevision++; publish() },
    reportWebsiteNavigation: (generation, value) => {
      if (disposed || generation !== authorizationGeneration) return
      try { websiteNavigation = parseWebsiteNavigation(value) } catch { websiteNavigation = { ...emptyNavigation(), status: 'unsupported' } }
      publish()
    },
    bindWebsiteNavigation: (generation, handler) => {
      if (generation !== authorizationGeneration) return () => {}
      navigationHandler = handler
      return () => { if (navigationHandler === handler) navigationHandler = null }
    },
    commandWebsite: command => {
      if (disposed || mode.getSnapshot().mode !== 'chat' || !mode.canEnter() || !navigationHandler) return
      if (command.type === 'open' && !websiteNavigation.conversations.some(item => item.href === command.href)) return
      void navigationHandler(command)
    },
    toggleWebsiteNavigation: () => { showWebsiteNavigation = !showWebsiteNavigation; publish() },
  }
  publish()
  // The enclosing effect's final cleanup restores navigation before registered main keys disappear.
  ctx.effect(() => {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: CHAT_PANEL, inject: () => ({ bridge }) }, DuoChatPanel))
    ctx.slots.inject('sidebar.brand.name', () => ctx.slots.register({ name: 'sidebar.brand.name', priority: -100, inject: () => ({ bridge }) }, DuoBrandName))
    ctx.slots.inject('shell.overlay', () => [
      ctx.slots.register({ name: 'shell.overlay', id: 'dsh-duo.brand-control', order: 100, inject: () => ({ bridge }) }, DuoBrandControl),
      ctx.slots.register({ name: 'shell.overlay', id: 'dsh-duo.website', order: 90, inject: () => ({ bridge, nativeBrowser }) }, DuoWebSurface),
    ])
    const stopMode = mode.subscribe(publish)
    const stopPanel = ctx.layout.panelInfo.subscribe(() => { mode.observePanel(ctx.layout.panelInfo.getSnapshot().activePanelId) })
    const refreshOnFocus = () => { void refreshAuthorization() }
    globalThis.addEventListener('focus', refreshOnFocus)
    void refreshAuthorization()
    return () => {
      navigationAttempt++
      mode.dispose(); stopPanel(); stopMode(); disposed = true; lifetime.abort(); listeners.clear()
      globalThis.removeEventListener('focus', refreshOnFocus)
    }
  }, 'dsh-duo reversible website UI')
}
