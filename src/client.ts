import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-api-gateway/client'
import type { DesktopBrowserBridge } from '@deepseek-ai/dsh-client-ui-sidebar-browser/types'
import { CHAT_PANEL, ModeController } from './core/mode.js'
import { authorizationSchema, DUO_REMOTE_CONTRIBUTION } from './protocol.js'
import type { AuthorizationState, DuoClientMetadata } from './protocol.js'
import { DuoModeControl, DuoOverlayControl, DuoChatSidebar, DuoChatLeading, DuoChatPanel } from './ui.js'
import type { DuoUIBridge, DuoViewState, DuoViewportRect } from './ui.js'
import { DuoWebSurface } from './web-surface.js'

export const name = 'dsh-duo'
export const inject = ['slots', 'layout', 'remote']

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
  let remoteReady = false
  let authorizationGeneration = 0
  let websiteReloadRevision = 0
  let webLoading = false
  let webError: string | null = null
  let connectionError: string | null = null
  let navigationAttempt = 0
  let viewport: DuoViewportRect | null = null
  let bridge: DuoUIBridge
  let cached: DuoViewState
  const mode = new ModeController({
    readPanel: () => ctx.layout.panelInfo.getSnapshot().activePanelId,
    selectPanel: panel => { ctx.layout.selectPanel(panel as MainPanelId | null) },
    mountChatNavigation: () => {
      const cleanup: (() => void)[] = []
      try {
        cleanup.push(ctx.slots.register({ name: 'sidebar', priority: -100, inject: () => ({ bridge }) }, DuoChatSidebar))
        cleanup.push(ctx.slots.register({ name: 'shell.leading', priority: -100, inject: () => ({ bridge }) }, DuoChatLeading))
      } catch (error) { cleanup.reverse().forEach(stop => stop()); throw error }
      return () => { cleanup.reverse().forEach(stop => stop()) }
    },
    cancelAccount: () => { authorizationGeneration++; webLoading = false; webError = null; publish() },
  }, Boolean(nativeBrowser))
  function availability(): string {
    const state = mode.getSnapshot()
    if (!nativeBrowser) return '网页嵌入目前需要 DSH 桌面版 0.2.0-rc.2 的官方浏览器能力。'
    if (state.authorization.status === 'pending') return '正在确认 DSH 的 DeepSeek 账号授权。'
    if (state.authorization.status === 'unauthorized') return '请先在 Harness 中登录并授权 DeepSeek 账号，再刷新授权。'
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
      desktopAvailable: Boolean(nativeBrowser), webLoading, webError, viewport,
      accountStorageKey: state.authorization.status === 'authorized' && state.authorization.accountId
        ? `dsh-duo:website:${state.authorization.accountId}` : null,
      authorizationGeneration, websiteReloadRevision,
    }
    for (const listener of listeners) listener()
  }
  function acceptAuthorization(value: AuthorizationState): void {
    const next = authorizationSchema.parse(value)
    const previous = mode.getSnapshot().authorization
    if (next.accountId !== previous.accountId || next.epoch !== previous.epoch) authorizationGeneration++
    connectionError = null
    mode.updateAuthorization(next)
    publish()
  }
  const metadata: DuoClientMetadata = {
    version: '0.2.0-rc.2', locale: globalThis.navigator?.language ?? 'zh-CN',
    timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
  }
  async function refreshAuthorization(): Promise<void> {
    if (!remoteReady || disposed) return
    const requestGeneration = authorizationGeneration
    try {
      const result = await ctx.remote.dshDuo.authorization(metadata, lifetime.signal)
      if (disposed || requestGeneration !== authorizationGeneration) return
      if (result.ok) acceptAuthorization(result.value)
      else { connectionError = '无法连接 DSH 账号服务，请稍后重试。'; publish() }
    } catch {
      if (!disposed && requestGeneration === authorizationGeneration) { connectionError = '无法连接 DSH 账号服务，请稍后重试。'; publish() }
    }
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
    reportWebsiteState: (generation, state) => {
      if (disposed || generation !== authorizationGeneration) return
      webLoading = state.loading; webError = state.error; publish()
    },
    reloadWebsite: () => { websiteReloadRevision++; publish() },
  }
  publish()
  // The enclosing effect's final cleanup restores navigation before registered main keys disappear.
  ctx.effect(() => {
    ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: CHAT_PANEL, inject: () => ({ bridge }) }, DuoChatPanel))
    ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({ name: 'sidebar.footer.action', id: 'dsh-duo.mode', order: -100, inject: () => ({ bridge }) }, DuoModeControl))
    ctx.slots.inject('shell.overlay', () => [
      ctx.slots.register({ name: 'shell.overlay', id: 'dsh-duo.control', order: 100, inject: () => ({ bridge }) }, DuoOverlayControl),
      ctx.slots.register({ name: 'shell.overlay', id: 'dsh-duo.website', order: 90, inject: () => ({ bridge, nativeBrowser }) }, DuoWebSurface),
    ])
    const stopMode = mode.subscribe(publish)
    const stopPanel = ctx.layout.panelInfo.subscribe(() => { mode.observePanel(ctx.layout.panelInfo.getSnapshot().activePanelId) })
    const refreshOnFocus = () => { void refreshAuthorization() }
    globalThis.addEventListener('focus', refreshOnFocus)
    ctx.effect(async () => {
      const unmount = await ctx.remote.$mount(DUO_REMOTE_CONTRIBUTION)
      if (disposed) { unmount(); return () => {} }
      remoteReady = true
      void refreshAuthorization()
      const stream = ctx.remote.$stream<AuthorizationState>({
        name: 'dsh-duo.authorization', open: signal => ctx.remote.dshDuo.watchAuthorization(metadata, signal),
        ended: () => new Error('DSH account stream ended'),
        carrierFailed: () => { if (!disposed) { connectionError = 'DSH 连接暂时中断，网页账号状态由网页自身处理。'; publish() } },
      })
      void (async () => {
        try {
          for await (const item of stream) {
            if (disposed) break
            if (item.signal.aborted) continue
            acceptAuthorization(item.value); item.accept()
          }
        } catch { if (!disposed) { connectionError = 'DSH 账号状态通知不可用，请刷新授权。'; publish() } }
      })()
      return async () => { await stream.dispose(); unmount() }
    }, 'dsh-duo safe account remote')
    return () => {
      navigationAttempt++
      mode.dispose(); stopPanel(); stopMode(); disposed = true; lifetime.abort(); listeners.clear()
      globalThis.removeEventListener('focus', refreshOnFocus)
    }
  }, 'dsh-duo reversible website UI')
}
