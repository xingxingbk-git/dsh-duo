import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { DesktopBrowserBridge, DesktopBrowserReservation } from '@deepseek-ai/dsh-client-ui-sidebar-browser/types'
import { DuoModeSelector, DuoStyles, useDuo, type DuoBridgeProps } from './ui.js'
import { emptyNavigation, parseWebsiteNavigation, websiteCommandScript, type WebsiteCommand } from './website-navigation.js'

const WEBSITE_URL = 'https://chat.deepseek.com/'

/** Public Electron methods on our approved, isolated DSH Browser guest. */
interface WebsiteWebview extends HTMLElement {
  loadURL(url: string): Promise<void>
  getURL(): string
  reload(): void
  executeJavaScript(code: string): Promise<unknown>
}

interface ReservationState {
  readonly native: DesktopBrowserReservation
  readonly generation: number
  readonly storageKey: string
}

/** Read only the product's documented origin-scoped Browser capability. */
export function getDesktopBrowserBridge(): DesktopBrowserBridge | undefined {
  const carrier = (globalThis as typeof globalThis & {
    readonly dshDesktop?: { readonly protocolVersion?: number; readonly browser?: DesktopBrowserBridge }
  }).dshDesktop
  const browser = carrier?.protocolVersion === 1 ? carrier.browser : undefined
  return browser !== undefined && typeof browser.acquire === 'function' && typeof browser.release === 'function'
    && typeof browser.onOpenRequested === 'function' ? browser : undefined
}

/** A persistent overlay occupant. Navigation back to Harness hides the native document, preserving drafts. */
export function DuoWebSurface({ bridge, nativeBrowser }: PropsRuntime<'shell.overlay'> & DuoBridgeProps & {
  readonly nativeBrowser?: DesktopBrowserBridge
}) {
  const state = useDuo(bridge)
  const [requestedGeneration, setRequestedGeneration] = useState<number | null>(null)
  const [reservation, setReservation] = useState<ReservationState | null>(null)
  const [recoveryRevision, setRecoveryRevision] = useState(0)
  const needsRecovery = useRef(false)
  const previousMode = useRef(state.mode)
  const guest = useRef<WebsiteWebview | null>(null)
  const guestEvents = useRef<AbortController | null>(null)
  const lastReload = useRef(state.websiteReloadRevision)

  useEffect(() => {
    if (state.mode === 'chat' && state.modeEnabled && state.authorizationStatus === 'authorized') {
      setRequestedGeneration(state.authorizationGeneration)
      if (previousMode.current === 'harness' && needsRecovery.current) setRecoveryRevision(value => value + 1)
    }
    previousMode.current = state.mode
  }, [state.mode, state.modeEnabled, state.authorizationStatus, state.authorizationGeneration])

  useEffect(() => {
    let stopped = false
    let held: DesktopBrowserReservation | undefined
    setReservation(null)
    if (nativeBrowser === undefined || state.accountStorageKey === null
      || requestedGeneration !== state.authorizationGeneration) return
    const generation = state.authorizationGeneration
    const storageKey = state.accountStorageKey
    needsRecovery.current = false
    bridge.reportWebsiteState(generation, { loading: true, error: null })
    const release = (value: DesktopBrowserReservation) => {
      void nativeBrowser.release(value.lease).catch(() => { console.warn('dsh-duo: website guest release failed') })
    }
    void nativeBrowser.acquire(storageKey).then(value => {
      if (stopped) { release(value); return }
      held = value
      setReservation({ native: value, generation, storageKey })
    }).catch(() => {
      if (!stopped) {
        needsRecovery.current = true
        bridge.reportWebsiteState(generation, { loading: false, error: '无法创建 DSH 内嵌网页，请点击「重试网页」。' })
      }
    })
    return () => {
      stopped = true
      guestEvents.current?.abort()
      guestEvents.current = null
      guest.current = null
      if (held !== undefined) release(held)
    }
  }, [bridge, nativeBrowser, requestedGeneration, state.authorizationGeneration, state.accountStorageKey, recoveryRevision])

  const attachGuest = useCallback((element: HTMLElement | null) => {
    guestEvents.current?.abort()
    guestEvents.current = null
    guest.current = null
    if (element === null || reservation === null || nativeBrowser === undefined) return
    const current = element as WebsiteWebview
    const events = new AbortController()
    guestEvents.current = events
    guest.current = current
    const generation = reservation.generation
    let bootstrapped = false
    let lastError: string | null = null
    let navigationRevision = 0
    const report = (loading: boolean, error: string | null = null) => {
      if (loading) lastError = null
      else if (error !== null) lastError = error
      if (!events.signal.aborted) bridge.reportWebsiteState(generation, { loading, error: lastError })
    }
    let reading = false
    let queued = Promise.resolve()
    const execute = async (command: WebsiteCommand) => {
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        return await Promise.race([current.executeJavaScript(websiteCommandScript(command)), new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Website navigation deadline exceeded')), 8000)
        })])
      } finally { clearTimeout(timer) }
    }
    const adapt = async (command: WebsiteCommand) => {
      const snapshot = bridge.getSnapshot()
      if (events.signal.aborted || snapshot.authorizationGeneration !== generation || snapshot.mode !== 'chat'
        || !snapshot.modeEnabled || snapshot.authorizationStatus !== 'authorized') return
      try {
        if (!current.getURL().startsWith('https://chat.deepseek.com/')) return
        const result = parseWebsiteNavigation(await execute(command))
        if (!events.signal.aborted) bridge.reportWebsiteNavigation(generation, result)
      } catch {
        if (!events.signal.aborted) {
          bridge.reportWebsiteNavigation(generation, { ...emptyNavigation(), status: 'unsupported' })
          try { await execute({type:'restore'}) } catch { /* The next ready event retries a recovered guest. */ }
        }
      }
    }
    const syncNavigation = () => {
      if (reading || events.signal.aborted) return
      reading = true
      queued = queued.then(() => adapt({ type: 'snapshot', showOriginal: bridge.getSnapshot().showWebsiteNavigation })).finally(() => { reading = false })
    }
    const stopCommands = bridge.bindWebsiteNavigation(generation, command => {
      queued = queued.then(() => adapt(command)).then(() => adapt({type:'snapshot',showOriginal:bridge.getSnapshot().showWebsiteNavigation}))
      return queued
    })
    const timer = setInterval(syncNavigation, 1200)
    events.signal.addEventListener('abort', () => { clearInterval(timer); stopCommands() }, { once: true })
    const navigate = (url: string) => {
      const revision = ++navigationRevision
      report(true)
      void current.loadURL(url).catch((error: unknown) => {
        if (revision !== navigationRevision || events.signal.aborted) return
        if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ERR_ABORTED') return
        report(false, 'DeepSeek 网页加载失败。请检查网络后重试。')
      })
    }
    current.addEventListener('dom-ready', () => {
      if (!bootstrapped) { bootstrapped = true; navigate(WEBSITE_URL) }
      else { bridge.reportWebsiteNavigation(generation, emptyNavigation()); syncNavigation() }
    }, { signal: events.signal })
    current.addEventListener('did-start-loading', () => report(true), { signal: events.signal })
    current.addEventListener('did-stop-loading', () => { report(false); syncNavigation() }, { signal: events.signal })
    current.addEventListener('did-fail-load', event => {
      const failure = event as Event & { readonly isMainFrame?: boolean; readonly errorCode?: number }
      if (failure.isMainFrame === true && failure.errorCode !== -3) report(false, 'DeepSeek 网页加载失败。请检查网络后重试。')
    }, { signal: events.signal })
    current.addEventListener('render-process-gone', () => {
      needsRecovery.current = true
      bridge.reportWebsiteNavigation(generation, { ...emptyNavigation(), status: 'unsupported' })
      report(false, '网页进程已退出，请点击「重试网页」。')
    }, { signal: events.signal })
    const offOpen = nativeBrowser.onOpenRequested(reservation.native.lease, url => {
      if (events.signal.aborted) return
      let target: URL
      try { target = new URL(url) } catch { return }
      if (target.protocol === 'https:' && target.hostname === 'chat.deepseek.com' && target.username === '' && target.password === '') {
        navigate(target.href)
      } else {
        report(false, '该链接未在此视图中打开，请使用系统浏览器访问。')
      }
    })
    events.signal.addEventListener('abort', offOpen, { once: true })
  }, [bridge, nativeBrowser, reservation])

  useEffect(() => {
    if (lastReload.current === state.websiteReloadRevision) return
    lastReload.current = state.websiteReloadRevision
    const current = guest.current
    if (current === null || reservation === null || needsRecovery.current) {
      if (nativeBrowser !== undefined && state.modeEnabled && state.authorizationStatus === 'authorized') {
        setRecoveryRevision(value => value + 1)
      }
      return
    }
    bridge.reportWebsiteState(reservation.generation, { loading: true, error: null })
    try {
      if (current.getURL().startsWith('about:blank')) {
        void current.loadURL(WEBSITE_URL).catch(() => bridge.reportWebsiteState(reservation.generation, { loading: false, error: 'DeepSeek 网页加载失败。' }))
      } else current.reload()
    } catch {
      needsRecovery.current = true
      bridge.reportWebsiteState(reservation.generation, { loading: false, error: '无法刷新当前网页，请点击「重试网页」。' })
    }
  }, [bridge, nativeBrowser, reservation, state.websiteReloadRevision, state.modeEnabled, state.authorizationStatus])

  useEffect(() => () => { guestEvents.current?.abort() }, [])

  const rect = state.viewport
  const visible = state.mode === 'chat' && state.modeEnabled && state.authorizationStatus === 'authorized' && rect !== null
  const activeReservation = reservation !== null && reservation.generation === state.authorizationGeneration
    && reservation.storageKey === state.accountStorageKey ? reservation : null
  return <section className="dsh-duo-web-surface" aria-label="DeepSeek 官网网页" aria-hidden={!visible} style={{
    display: visible ? 'flex' : 'none',
    left: rect?.left ?? 0,
    top: rect?.top ?? 0,
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
  }}>
    <DuoStyles />
    <header className="dsh-duo-web-toolbar" data-window-drag>
      {state.brandAnchor === null && <button type="button" onClick={() => bridge.toggleSidebar()} aria-label="显示或隐藏侧边栏"><svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M7 3v14" stroke="currentColor" strokeWidth="1.4"/></svg></button>}
      <strong>DeepSeek 官网</strong><small>chat.deepseek.com</small>
      <span className="dsh-duo-web-toolbar-spacer" />
      {state.brandAnchor === null && <DuoModeSelector bridge={bridge} state={state} />}
    </header>
    <div className="dsh-duo-web-content">
      {activeReservation !== null && createElement('webview', {
        key: activeReservation.native.lease,
        ref: attachGuest,
        className: 'dsh-duo-webview',
        name: activeReservation.native.lease,
        partition: activeReservation.native.partition,
        src: `about:blank#${activeReservation.native.lease}`,
        allowpopups: '',
        'data-sidebar-browser-frame': 'webview',
        'aria-label': 'DeepSeek 官网，登录、聊天和历史由网页提供',
      })}
      {(nativeBrowser === undefined || state.webError !== null || activeReservation === null) && <div className={`dsh-duo-web-status${state.webError !== null ? ' dsh-duo-web-status-error' : ''}`} role={state.webError !== null ? 'alert' : 'status'}>
        <strong>{nativeBrowser === undefined ? '当前环境无法内嵌网页' : state.webError !== null ? '网页暂时无法使用' : '正在打开 DeepSeek 官网'}</strong>
        <p>{state.webError || (nativeBrowser === undefined ? '需要提供官方浏览器能力的 DSH 桌面版。' : '网页登录后，由官网显示该账号的聊天和历史。')}</p>
        {state.webError !== null && <button type="button" className="dsh-duo-text-button" onClick={() => bridge.reloadWebsite()} disabled={nativeBrowser === undefined || !state.modeEnabled}>重试网页</button>}
      </div>}
    </div>
  </section>
}
