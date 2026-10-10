import { useId, useLayoutEffect, useRef, useSyncExternalStore } from 'react'
import { FishLogo } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { duoStyles } from './styles.js'

export type DuoMode = 'chat' | 'harness'

export interface DuoViewportRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/** Website content, account secrets and history never enter this snapshot. */
export interface DuoViewState {
  readonly mode: DuoMode
  readonly modeEnabled: boolean
  readonly authorizationStatus: 'pending' | 'authorized' | 'unauthorized' | 'unavailable'
  readonly availabilityMessage: string
  readonly accountLabel: string | null
  readonly error: string | null
  readonly desktopAvailable: boolean
  readonly webLoading: boolean
  readonly webError: string | null
  readonly accountStorageKey: string | null
  readonly authorizationGeneration: number
  readonly websiteReloadRevision: number
  readonly viewport: DuoViewportRect | null
}

export interface DuoUIBridge {
  getSnapshot(): DuoViewState
  subscribe(listener: () => void): () => void
  selectMode(mode: DuoMode): void
  refreshAuthorization(): void
  manageAccount(): void
  toggleSidebar(): void
  attachViewport(element: HTMLElement | null): void
  updateViewport(rect: DuoViewportRect | null): void
  reloadWebsite(): void
  reportWebsiteState(generation: number, state: { readonly loading: boolean; readonly error: string | null }): void
}

export interface DuoBridgeProps { readonly bridge: DuoUIBridge }

export function useDuo(bridge: DuoUIBridge): DuoViewState {
  return useSyncExternalStore(bridge.subscribe, bridge.getSnapshot, bridge.getSnapshot)
}

export function DuoStyles() {
  return <style>{duoStyles}</style>
}

function PanelIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M7 3v14" stroke="currentColor" strokeWidth="1.4" />
  </svg>
}

export function DuoModeSelector({ bridge, state, compact = false }: DuoBridgeProps & {
  readonly state: DuoViewState
  readonly compact?: boolean
}) {
  const description = useId()
  return <div className={compact ? 'dsh-duo-mode-compact' : 'dsh-duo-mode-wrap'}>
    <fieldset className="dsh-duo-modes" disabled={!state.modeEnabled} aria-describedby={description}>
      <legend className="dsh-duo-sr-only">工作模式</legend>
      <button type="button" aria-label="CHAT 官网聊天模式" aria-pressed={state.mode === 'chat'} onClick={() => bridge.selectMode('chat')} title={state.availabilityMessage}>{compact ? 'C' : 'CHAT'}</button>
      <button type="button" aria-label="HARNESS 工作区模式" aria-pressed={state.mode === 'harness'} onClick={() => bridge.selectMode('harness')} title={state.availabilityMessage}>{compact ? 'H' : 'HARNESS'}</button>
    </fieldset>
    <span id={description} className="dsh-duo-sr-only">{state.availabilityMessage || '选择 CHAT 或 HARNESS 工作模式。'}</span>
  </div>
}

/** An additive candidate entrance: the shipped Harness sidebar stays untouched. */
export function DuoModeControl({ bridge, wide }: PropsRuntime<'sidebar.footer.action'> & DuoBridgeProps) {
  const state = useDuo(bridge)
  return <div className="dsh-duo-footer-control">
    <DuoStyles />
    <DuoModeSelector bridge={bridge} state={state} compact={!wide} />
    {wide && !state.modeEnabled && <p className="dsh-duo-footnote">{state.availabilityMessage}</p>}
    {wide && state.error && <p className="dsh-duo-footnote" role="status">{state.error}</p>}
    {wide && state.authorizationStatus !== 'pending' && <button type="button" className="dsh-duo-text-button" onClick={() => bridge.refreshAuthorization()}>刷新 DSH 授权状态</button>}
    {wide && state.authorizationStatus !== 'authorized' && <button type="button" className="dsh-duo-text-button" onClick={() => bridge.manageAccount()}>管理 DeepSeek 账号</button>}
  </div>
}

/** Reachable even on platforms whose collapsed sidebar is fully hidden. */
export function DuoOverlayControl({ bridge }: PropsRuntime<'shell.overlay'> & DuoBridgeProps) {
  const state = useDuo(bridge)
  if (state.mode === 'chat') return null
  return <aside className="dsh-duo-mode-overlay" aria-label="dsh-duo 模式选择">
    <DuoStyles />
    <DuoModeSelector bridge={bridge} state={state} />
    {(state.error || !state.modeEnabled) && <span className="dsh-duo-overlay-status" role="status" title={state.error || state.availabilityMessage}>{state.error || (state.authorizationStatus === 'pending' ? '正在确认账号授权' : state.authorizationStatus === 'unavailable' ? '暂时无法确认账号授权' : state.authorizationStatus === 'authorized' ? 'CHAT 暂不可用' : '需要 DeepSeek 账号授权')}</span>}
    {state.authorizationStatus !== 'pending' && <button type="button" className="dsh-duo-text-button" onClick={() => bridge.refreshAuthorization()}>刷新授权</button>}
  </aside>
}

/** CHAT's native shell controls. The actual website owns its own conversation navigation. */
export function DuoChatSidebar({ bridge, collapsed, width }: PropsRuntime<'sidebar'> & DuoBridgeProps) {
  const state = useDuo(bridge)
  return <aside className={`dsh-duo-sidebar${collapsed ? ' dsh-duo-sidebar-collapsed' : ''}`} style={collapsed ? undefined : { width }} aria-label="CHAT 模式控制">
    <DuoStyles />
    <div className="dsh-duo-sidebar-chrome" data-window-drag><button type="button" className="dsh-duo-icon-button" onClick={() => bridge.toggleSidebar()} aria-label={collapsed ? '展开模式侧栏' : '收起模式侧栏'}><PanelIcon /></button></div>
    <div className="dsh-duo-brand"><span className="dsh-duo-mark"><FishLogo size={24} /></span>{!collapsed && <DuoModeSelector bridge={bridge} state={state} />}</div>
    {collapsed ? <DuoModeSelector bridge={bridge} state={state} compact /> : <div className="dsh-duo-website-intro">
      <span className="dsh-duo-caption">DEEPSEEK CHAT</span>
      <h2>你的官网对话</h2>
      <p>聊天、新建对话和历史列表都由 DeepSeek 官网提供。</p>
      <div className="dsh-duo-note"><strong>在网页中登录</strong><p>网页登录与 DSH 账号登录分别管理。使用同一个网页账号，即可看到官网中的历史。</p></div>
      <p className="dsh-duo-footnote">切回 HARNESS 会保留当前网页，便于继续编辑草稿或查看回答。</p>
    </div>}
    <div className="dsh-duo-spacer" />
    {!collapsed && <p className="dsh-duo-footnote">网页退出状态暂不能由插件直接观察；官网自身控制聊天登录状态。</p>}
    {!collapsed && state.error && <p className="dsh-duo-footnote" role="status">{state.error}</p>}
    <button type="button" className={collapsed ? 'dsh-duo-icon-button' : 'dsh-duo-account-button'} onClick={() => bridge.manageAccount()} title="返回 HARNESS 管理账号" aria-label="返回 HARNESS 管理 DeepSeek 账号">{collapsed ? '⚙' : <><span className="dsh-duo-avatar" aria-hidden="true">D</span><span><strong>{state.accountLabel || 'DeepSeek 账号'}</strong><small>DSH 账号与设置</small></span><span aria-hidden="true">↗</span></>}</button>
    {!collapsed && <button type="button" className="dsh-duo-text-button" onClick={() => bridge.refreshAuthorization()}>刷新 DSH 授权状态</button>}
  </aside>
}

export function DuoChatLeading({ bridge }: PropsRuntime<'shell.leading'> & DuoBridgeProps) {
  const state = useDuo(bridge)
  return <div className="dsh-duo-leading"><DuoStyles /><button type="button" className="dsh-duo-icon-button" onClick={() => bridge.toggleSidebar()} aria-label="展开 CHAT 模式侧栏"><PanelIcon /></button><DuoModeSelector bridge={bridge} state={state} /></div>
}

/** Measures only this plugin's own element; website content lives in the retained overlay. */
export function DuoChatPanel({ bridge }: PropsRuntime<'main'> & DuoBridgeProps) {
  const state = useDuo(bridge)
  const anchor = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = anchor.current
    if (element === null) return
    bridge.attachViewport(element)
    const measure = () => {
      const rect = element.getBoundingClientRect()
      bridge.updateViewport({ left: rect.left, top: rect.top, width: rect.width, height: rect.height })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      bridge.attachViewport(null)
      bridge.updateViewport(null)
    }
  }, [bridge])
  return <div className="dsh-duo-main-anchor" ref={anchor} aria-label="DeepSeek 官网聊天视图">
    <DuoStyles />
    {!state.desktopAvailable && <div className="dsh-duo-unavailable"><h2>需要 DSH 桌面版</h2><p>当前环境未提供官方内嵌浏览器能力。</p><button type="button" onClick={() => bridge.selectMode('harness')}>返回 HARNESS</button></div>}
  </div>
}
