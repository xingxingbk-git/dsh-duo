import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { BrandWordmark } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { duoStyles } from './styles.js'
import type { WebsiteCommand, WebsiteNavigation } from './website-navigation.js'

export type DuoMode = 'chat' | 'harness'

export interface DuoViewportRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/** Only in-memory navigation metadata; never message bodies or account secrets. */
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
  readonly brandAnchor: DuoViewportRect | null
  readonly sidebarAdapted: boolean | null
  readonly websiteNavigation: WebsiteNavigation
  readonly showWebsiteNavigation: boolean
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
  updateBrandAnchor(rect: DuoViewportRect | null): void
  attachSidebar(element: HTMLElement): void
  reloadWebsite(): void
  reportWebsiteState(generation: number, state: { readonly loading: boolean; readonly error: string | null }): void
  reportWebsiteNavigation(generation: number, value: unknown): void
  bindWebsiteNavigation(generation: number, handler: (command: WebsiteCommand) => Promise<void>): () => void
  commandWebsite(command: WebsiteCommand): void
  toggleWebsiteNavigation(): void
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

/** rc.2's official wordmark includes its HARNESS badge in the SVG artwork.
 * Crop only our own presentation to the DeepSeek lettering (x=26..128). */
function DuoWordmark() {
  return <svg className="dsh-duo-brand-wordmark" width="102" height="24" viewBox="0 0 102 24" aria-hidden="true">
    <BrandWordmark includeMark={false} size={24} />
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

/** Decorative brand content only: this slot has an aria-hidden/New Session owner. */
export function DuoBrandName({ bridge }: PropsRuntime<'sidebar.brand.name'> & DuoBridgeProps) {
  const name = useRef<HTMLSpanElement>(null)
  const anchor = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const element = anchor.current
    const group = name.current
    if (!element || !group) return
    bridge.attachSidebar(group)
    let visible = false
    const measure = () => {
      const rect = element.getBoundingClientRect()
      bridge.updateBrandAnchor(visible && rect.width > 0 && rect.height > 0
        ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null)
    }
    const resize = new ResizeObserver(measure)
    resize.observe(group); resize.observe(element)
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.target === element && entry.isIntersecting && entry.intersectionRatio >= 0.99)
      measure()
    }, { threshold: [0, 0.99, 1] })
    intersection.observe(element)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      resize.disconnect(); intersection.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      bridge.updateBrandAnchor(null)
    }
  }, [bridge])
  return <span ref={name} className="dsh-duo-brand-name">
    <DuoStyles />
    <DuoWordmark />
    <span ref={anchor} className="dsh-duo-brand-anchor" />
  </span>
}

function DuoAuthorizationNotice({ bridge, state }: DuoBridgeProps & { readonly state: DuoViewState }) {
  if (!state.error) return null
  return <div className="dsh-duo-authorization-notice" role="status">
    <p>{state.error}</p>
    <button type="button" className="dsh-duo-text-button" onClick={() => bridge.refreshAuthorization()}>重试授权检查</button>
  </div>
}

/** The interactive surface is outside the brand slot's hidden/button ancestry. */
export function DuoBrandControl({ bridge }: PropsRuntime<'shell.overlay'> & DuoBridgeProps) {
  const state = useDuo(bridge)
  const rect = state.brandAnchor
  if (rect === null) return null
  return <div className="dsh-duo-brand-control" aria-label="dsh-duo 模式选择" style={{
    left: rect.left, top: rect.top, width: rect.width, height: rect.height,
  }}>
    <DuoStyles />
    <DuoModeSelector bridge={bridge} state={state} />
    <DuoAuthorizationNotice bridge={bridge} state={state} />
    {state.sidebarAdapted === false && <div className="dsh-duo-authorization-notice" role="alert">当前侧栏不兼容：顶部新会话仍使用 HARNESS。CHAT 请使用对话列表旁的＋。</div>}
  </div>
}

/** Only the middle browsing region changes; the shipped shell and Settings stay mounted. */
export function DuoChatNavigation({ bridge, wide, expandSidebar }: PropsRuntime<'sidebar.workspaces'> & DuoBridgeProps) {
  const state = useDuo(bridge)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const navigation = state.websiteNavigation
  const groups = new Map<string, typeof navigation.conversations[number][]>()
  for (const item of navigation.conversations) {
    if (!item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())) continue
    const rows = groups.get(item.group) ?? []
    rows.push(item); groups.set(item.group, rows)
  }
  return <section className={`dsh-duo-navigation${wide ? '' : ' dsh-duo-navigation-rail'}`} aria-label="官网对话导航">
    <DuoStyles />
    {!wide ? <button type="button" className="dsh-duo-icon-button" onClick={expandSidebar} aria-label="展开官网对话列表"><PanelIcon /></button> : <>
      <header className="dsh-duo-navigation-header"><span>对话</span><div>
        <button type="button" className="dsh-duo-icon-button" aria-label="搜索官网对话" onClick={() => setSearching(value => !value)}><svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.4"/></svg></button>
        <button type="button" className="dsh-duo-icon-button" aria-label="新建官网对话" disabled={!navigation.canCreate} onClick={() => bridge.commandWebsite({type:'new'})}>＋</button>
      </div></header>
      {searching && <input className="dsh-duo-navigation-search" aria-label="搜索已加载的官网对话标题" placeholder="搜索对话" value={query} onChange={event => setQuery(event.target.value)} autoFocus />}
      <div className="dsh-duo-navigation-list">
        {navigation.status === 'ready' ? <>
          {[...groups].map(([label, rows]) => <section key={label} className="dsh-duo-conversation-group" aria-label={label}>
            <h3>{label}</h3>
            {rows.map(item => <button key={item.href} type="button" className="dsh-duo-conversation-row" title={item.title} aria-current={navigation.selectedHref === item.href ? 'page' : undefined} onClick={() => bridge.commandWebsite({type:'open',href:item.href})}>{item.title}</button>)}
          </section>)}
          {groups.size === 0 && <p className="dsh-duo-navigation-status">{query ? '没有匹配的对话' : '暂无对话'}</p>}
          {!query && navigation.conversations.length > 0 && <button type="button" className="dsh-duo-text-button" onClick={() => bridge.commandWebsite({type:'more'})}>加载更早的对话</button>}
        </> : <p className="dsh-duo-navigation-status" role="status">{navigation.status === 'sign-in' ? '请在右侧官网中登录，登录后显示对话列表。' : navigation.status === 'unsupported' ? '暂未识别官网列表，请使用右侧官网导航。' : '正在加载官网对话…'}</p>}
        {navigation.error && <p className="dsh-duo-navigation-status" role="alert">{navigation.error}</p>}
      </div>
    </>}
  </section>
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
