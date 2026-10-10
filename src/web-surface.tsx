import { createPortal } from 'react-dom'
import { createElement, useCallback, useEffect, useRef, useState } from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { DesktopBrowserBridge, DesktopBrowserReservation } from '@deepseek-ai/dsh-client-ui-sidebar-browser/types'
import { DshChatStyles, useDshChat, type DshChatBridgeProps } from './ui.js'
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

function headerInset(viewport: {readonly left:number} | null): number {
  return viewport?.left===0 ? Math.max(24,Math.ceil(document.querySelector('.dsh-chat-leading')?.getBoundingClientRect().right ?? 144)+16) : 24
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
export function DshChatWebSurface({ bridge, nativeBrowser }: PropsRuntime<'shell.overlay'> & DshChatBridgeProps & {
  readonly nativeBrowser?: DesktopBrowserBridge
}) {
  const state = useDshChat(bridge)
  const [requestedGeneration, setRequestedGeneration] = useState<number | null>(null)
  const [reservation, setReservation] = useState<ReservationState | null>(null)
  const [recoveryRevision, setRecoveryRevision] = useState(0)
  const [presentationReady, setPresentationReady] = useState(false)
  const needsRecovery = useRef(false)
  const previousMode = useRef(state.mode)
  const guest = useRef<WebsiteWebview | null>(null)
  const guestEvents = useRef<AbortController | null>(null)
  const lastReload = useRef(state.websiteReloadRevision)

  useEffect(() => {
    if ((state.mode === 'chat' && state.modeEnabled || state.settingsViewport) && state.authorizationStatus === 'authorized') {
      setRequestedGeneration(state.authorizationGeneration)
      if (previousMode.current === 'harness' && needsRecovery.current) setRecoveryRevision(value => value + 1)
    }
    previousMode.current = state.mode
  }, [state.mode, state.modeEnabled, state.authorizationStatus, state.authorizationGeneration, state.settingsViewport])

  useEffect(() => {
    let stopped = false
    let held: DesktopBrowserReservation | undefined
    setReservation(null)
    setPresentationReady(false)
    if (nativeBrowser === undefined || state.accountStorageKey === null
      || requestedGeneration !== state.authorizationGeneration) return
    const generation = state.authorizationGeneration
    const storageKey = state.accountStorageKey
    needsRecovery.current = false
    bridge.reportWebsiteState(generation, { loading: true, error: null })
    const release = (value: DesktopBrowserReservation) => {
      void nativeBrowser.release(value.lease).catch(() => { console.warn('dsh-chat: website guest release failed') })
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
      if(command.type==='snapshot') command={...command,headerInset:headerInset(snapshot.viewport)}
      if (events.signal.aborted || snapshot.authorizationGeneration !== generation || (snapshot.mode !== 'chat' && !snapshot.settingsViewport)
        || (!snapshot.modeEnabled && !snapshot.settingsViewport) || snapshot.authorizationStatus !== 'authorized') return
      try {
        if(!current.getURL().startsWith('https://chat.deepseek.com/')) return
        const result = parseWebsiteNavigation(await execute(command))
        if (!events.signal.aborted) { bridge.reportWebsiteNavigation(generation, result); setPresentationReady(result.status !== 'loading') }
      } catch {
        if (!events.signal.aborted) {
          bridge.reportWebsiteNavigation(generation, { ...emptyNavigation(), status: 'unsupported' })
          setPresentationReady(!snapshot.settingsViewport)
          try { await execute({type:'restore'}) } catch { /* The next ready event retries a recovered guest. */ }
        }
      }
    }
    const snapshotCommand = (): WebsiteCommand => {const snapshot=bridge.getSnapshot();return {type:'snapshot',showOriginal:snapshot.showWebsiteNavigation, headerInset:headerInset(snapshot.viewport)}}
    const syncNavigation = () => {
      if (reading || events.signal.aborted) return
      reading = true
      queued = queued.then(() => adapt(snapshotCommand())).finally(() => { reading = false })
    }
    const stopCommands = bridge.bindWebsiteNavigation(generation, command => {
      queued = queued.then(() => adapt(command)).then(() => adapt(snapshotCommand()))
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
    current.addEventListener('did-start-loading', () => { setPresentationReady(false); report(true) }, { signal: events.signal })
    current.addEventListener('did-navigate-in-page', () => { setPresentationReady(false); syncNavigation() }, { signal: events.signal })
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

  useEffect(() => {
    if(state.mode==='chat' && state.viewport) bridge.commandWebsite({type:'snapshot',showOriginal:state.showWebsiteNavigation,headerInset:headerInset(state.viewport)})
  }, [bridge,state.mode,state.viewport?.left])

  useEffect(() => () => { guestEvents.current?.abort() }, [])

  const inSettings = state.settingsViewport !== null
  const rect = inSettings && state.websiteNavigation.status!=='sign-in' ? {left:0,top:0,width:globalThis.innerWidth,height:globalThis.innerHeight} : state.settingsViewport ?? state.viewport
  const visible = (inSettings && state.websiteNavigation.status==='sign-in' || !inSettings && state.mode === 'chat' && state.modeEnabled) && state.authorizationStatus === 'authorized' && rect !== null
  const activeReservation = reservation !== null && reservation.generation === state.authorizationGeneration
    && reservation.storageKey === state.accountStorageKey ? reservation : null
  const clearance = 0
  return createPortal(<section id="dsh-chat-website-surface" className="dsh-chat-web-surface" aria-label="DeepSeek 官网网页" aria-hidden={!visible} style={{
    zIndex: inSettings ? (visible ? 1001 : 0) : 14,
    visibility: visible ? 'visible' : 'hidden',
    display: (inSettings || state.mode==='chat') && rect ? 'flex' : 'none',
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    left: rect?.left ?? 0,
    top: (rect?.top ?? 0) + clearance,
    width: rect?.width ?? 0,
    height: Math.max(0,(rect?.height ?? 0) - clearance),
    borderRadius: inSettings ? 12 : 0, overflow: 'hidden',
  }}>
    <DshChatStyles />
    <div className="dsh-chat-web-content">
      {activeReservation !== null && createElement('webview', {
        key: activeReservation.native.lease,
        ref: attachGuest,
        className: 'dsh-chat-webview',
        style: { opacity: presentationReady ? 1 : 0 },
        name: activeReservation.native.lease,
        partition: activeReservation.native.partition,
        src: `about:blank#${activeReservation.native.lease}`,
        allowpopups: '',
        'data-sidebar-browser-frame': 'webview',
        'aria-label': 'DeepSeek 官网，登录、聊天和历史由网页提供',
      })}
      {(nativeBrowser === undefined || state.webError !== null || activeReservation === null || !presentationReady) && <div className={`dsh-chat-web-status${state.webError !== null ? ' dsh-chat-web-status-error' : ''}`} role={state.webError !== null ? 'alert' : 'status'}>
        <strong>{nativeBrowser === undefined ? '当前环境无法内嵌网页' : state.webError !== null ? '网页暂时无法使用' : '正在打开 DeepSeek 官网'}</strong>
        <p>{state.webError || (nativeBrowser === undefined ? '需要提供官方浏览器能力的 DSH 桌面版。' : '网页登录后，由官网显示该账号的聊天和历史。')}</p>
        {(state.webError !== null) && <button type="button" className="dsh-chat-text-button" onClick={() => bridge.reloadWebsite()} disabled={nativeBrowser === undefined || !state.modeEnabled}>重试网页</button>}
      </div>}
    </div>
  </section>, document.body)
}
