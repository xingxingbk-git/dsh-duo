import { useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { BrandWordmark, IconNewChatOutlineRegular, IconPanelLeftOutlineRegular, Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { chatStyles } from './styles.js'
import type { WebsiteCommand, WebsiteNavigation } from './website-navigation.js'

export type DshChatMode = 'chat' | 'harness'

export interface DshChatViewportRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/** Only in-memory navigation metadata; never message bodies or account secrets. */
export interface DshChatViewState {
  readonly mode: DshChatMode
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
  readonly settingsViewport: DshChatViewportRect | null
  readonly preferenceError: string | null
  readonly viewport: DshChatViewportRect | null
  readonly brandAnchor: DshChatViewportRect | null
  readonly sidebarAdapted: boolean | null
  readonly websiteNavigation: WebsiteNavigation
  readonly showWebsiteNavigation: boolean
}

export interface DshChatUIBridge {
  getSnapshot(): DshChatViewState
  subscribe(listener: () => void): () => void
  selectMode(mode: DshChatMode): void
  refreshAuthorization(): void
  manageAccount(): void
  toggleSidebar(): void
  attachViewport(element: HTMLElement | null): void
  updateViewport(rect: DshChatViewportRect | null): void
  updateBrandAnchor(rect: DshChatViewportRect | null): void
  attachSidebar(element: HTMLElement): void
  reloadWebsite(): void
  reportWebsiteState(generation: number, state: { readonly loading: boolean; readonly error: string | null }): void
  reportWebsiteNavigation(generation: number, value: unknown): void
  bindWebsiteNavigation(generation: number, handler: (command: WebsiteCommand) => Promise<void>): () => void
  commandWebsite(command: WebsiteCommand): void
  toggleWebsiteNavigation(): void
  updateSettingsViewport(rect: DshChatViewportRect | null): void
  logoutWebsite(): void
}

export interface DshChatBridgeProps { readonly bridge: DshChatUIBridge }

export function useDshChat(bridge: DshChatUIBridge): DshChatViewState {
  return useSyncExternalStore(bridge.subscribe, bridge.getSnapshot, bridge.getSnapshot)
}

export function DshChatStyles() {
  return <style>{chatStyles}</style>
}

function PanelIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2.5" y="3" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M7 3v14" stroke="currentColor" strokeWidth="1.4" />
  </svg>
}

/** rc.2's official wordmark includes its HARNESS badge in the SVG artwork.
 * Crop only our own presentation to the DeepSeek lettering (x=26..128). */
function DshChatWordmark() {
  return <svg className="dsh-chat-brand-wordmark" width="102" height="24" viewBox="0 0 102 24" aria-hidden="true">
    <BrandWordmark includeMark={false} size={24} />
  </svg>
}

export function DshChatModeSelector({ bridge, state, compact = false }: DshChatBridgeProps & {
  readonly state: DshChatViewState
  readonly compact?: boolean
}) {
  const description = useId()
  return <div className={compact ? 'dsh-chat-mode-compact' : 'dsh-chat-mode-wrap'}>
    <fieldset className="dsh-chat-modes" disabled={!state.modeEnabled} aria-describedby={description}>
      <legend className="dsh-chat-sr-only">工作模式</legend>
      <button type="button" aria-label="CHAT 官网聊天模式" aria-pressed={state.mode === 'chat'} onClick={() => bridge.selectMode('chat')} title={state.availabilityMessage}>{compact ? 'C' : 'CHAT'}</button>
      <button type="button" aria-label="HARNESS 工作区模式" aria-pressed={state.mode === 'harness'} onClick={() => bridge.selectMode('harness')} title={state.availabilityMessage}>{compact ? 'H' : 'HARNESS'}</button>
    </fieldset>
    <span id={description} className="dsh-chat-sr-only">{state.availabilityMessage || '选择 CHAT 或 HARNESS 工作模式。'}</span>
  </div>
}

/** Decorative brand content only: this slot has an aria-hidden/New Session owner. */
export function DshChatBrandName({ bridge }: PropsRuntime<'sidebar.brand.name'> & DshChatBridgeProps) {
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
  return <span ref={name} className="dsh-chat-brand-name">
    <DshChatStyles />
    <DshChatWordmark />
    <span ref={anchor} className="dsh-chat-brand-anchor" />
  </span>
}

function DshChatAuthorizationNotice({ bridge, state }: DshChatBridgeProps & { readonly state: DshChatViewState }) {
  if (!state.error) return null
  return <div className="dsh-chat-authorization-notice" role="status">
    <p>{state.error}</p>
    <button type="button" className="dsh-chat-text-button" onClick={() => bridge.refreshAuthorization()}>重试授权检查</button>
  </div>
}

/** The interactive surface is outside the brand slot's hidden/button ancestry. */
export function DshChatBrandControl({ bridge }: PropsRuntime<'shell.overlay'> & DshChatBridgeProps) {
  const state = useDshChat(bridge)
  const rect = state.brandAnchor
  if (rect === null) return null
  return <div className="dsh-chat-brand-control" aria-label="dsh-chat 模式选择" style={{
    left: rect.left, top: rect.top, width: rect.width, height: rect.height,
  }}>
    <DshChatStyles />
    <DshChatModeSelector bridge={bridge} state={state} />
    <DshChatAuthorizationNotice bridge={bridge} state={state} />
    {state.sidebarAdapted === false && <div className="dsh-chat-authorization-notice" role="alert">当前侧栏不兼容：顶部新会话仍使用 HARNESS。CHAT 请使用对话列表旁的＋。</div>}
  </div>
}

/** Only the middle browsing region changes; the shipped shell and Settings stay mounted. */
export function DshChatChatNavigation({ bridge, wide, expandSidebar }: PropsRuntime<'sidebar.workspaces'> & DshChatBridgeProps) {
  const state = useDshChat(bridge)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const navigation = state.websiteNavigation
  const groups = new Map<string, typeof navigation.conversations[number][]>()
  for (const item of navigation.conversations) {
    if (!item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())) continue
    const rows = groups.get(item.group) ?? []
    rows.push(item); groups.set(item.group, rows)
  }
  return <section className={`dsh-chat-navigation${wide ? '' : ' dsh-chat-navigation-rail'}`} aria-label="官网对话导航">
    <DshChatStyles />
    {!wide ? <button type="button" className="dsh-chat-icon-button" onClick={expandSidebar} aria-label="展开官网对话列表"><PanelIcon /></button> : <>
      <header className="dsh-chat-navigation-header"><span>对话</span><div>
        <button type="button" className="dsh-chat-icon-button" aria-label="搜索官网对话" onClick={() => setSearching(value => !value)}><svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.4"/></svg></button>
        <button type="button" className="dsh-chat-icon-button" aria-label="新建官网对话" disabled={!navigation.canCreate} onClick={() => bridge.commandWebsite({type:'new'})}>＋</button>
      </div></header>
      {searching && <input className="dsh-chat-navigation-search" aria-label="搜索已加载的官网对话标题" placeholder="搜索对话" value={query} onChange={event => setQuery(event.target.value)} autoFocus />}
      <div className="dsh-chat-navigation-list">
        {navigation.status === 'ready' ? <>
          {[...groups].map(([label, rows]) => <section key={label} className="dsh-chat-conversation-group" aria-label={label}>
            <h3>{label}</h3>
            {rows.map(item => <button key={item.href} type="button" className="dsh-chat-conversation-row" title={item.title} aria-current={navigation.selectedHref === item.href ? 'page' : undefined} onClick={() => bridge.commandWebsite({type:'open',href:item.href})}>{item.title}</button>)}
          </section>)}
          {groups.size === 0 && <p className="dsh-chat-navigation-status">{query ? '没有匹配的对话' : '暂无对话'}</p>}
          {!query && navigation.conversations.length > 0 && <button type="button" className="dsh-chat-text-button" onClick={() => bridge.commandWebsite({type:'more'})}>加载更早的对话</button>}
        </> : <p className="dsh-chat-navigation-status" role="status">{navigation.status === 'sign-in' ? '请在右侧官网中登录，登录后显示对话列表。' : navigation.status === 'unsupported' ? '暂未识别官网列表，请使用右侧官网导航。' : '正在加载官网对话…'}</p>}
        {navigation.error && <p className="dsh-chat-navigation-status" role="alert">{navigation.error}</p>}
      </div>
    </>}
  </section>
}

/** Measures only this plugin's own element; website content lives in the retained overlay. */
export function DshChatChatPanel({ bridge }: PropsRuntime<'main'> & DshChatBridgeProps) {
  const state = useDshChat(bridge)
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
  return <div className="dsh-chat-main-anchor" ref={anchor} aria-label="DeepSeek 官网聊天视图">
    <DshChatStyles />
    {!state.desktopAvailable && <div className="dsh-chat-unavailable"><h2>需要 DSH 桌面版</h2><p>当前环境未提供官方内嵌浏览器能力。</p><button type="button" onClick={() => bridge.selectMode('harness')}>返回 HARNESS</button></div>}
  </div>
}

/** Same public primitive icons, geometry and tooltip behavior as native rc.2 chrome. */
export function DshChatLeadingControls({bridge}: PropsRuntime<'shell.leading'> & DshChatBridgeProps) {
  const state = useDshChat(bridge)
  return <div className="dsh-chat-leading"><DshChatStyles />
    <Tooltip label="展开侧边栏" delayMs={500}><button type="button" aria-label="展开侧边栏" onClick={() => bridge.toggleSidebar()}><IconPanelLeftOutlineRegular size={16}/></button></Tooltip>
    <Tooltip label="新建对话" delayMs={500}><button type="button" aria-label="新建官网对话" disabled={!state.modeEnabled || !state.websiteNavigation.canCreate} onClick={() => bridge.commandWebsite({type:'new'})}><IconNewChatOutlineRegular size={16}/></button></Tooltip>
  </div>
}

export function DshChatChatSettings({bridge}: PropsRuntime<'settings.section'> & DshChatBridgeProps) {
  const state = useDshChat(bridge)
  const pane = useRef<HTMLDivElement>(null)
  const enabled = state.desktopAvailable && state.authorizationStatus === 'authorized'
  useLayoutEffect(() => {
    const element = pane.current
    if (!element || !enabled) { bridge.updateSettingsViewport(null); return }
    const measure = () => {
      const rect = element.getBoundingClientRect()
      bridge.updateSettingsViewport({left:rect.left,top:rect.top,width:rect.width,height:rect.height})
    }
    const resize = new ResizeObserver(measure); resize.observe(element)
    globalThis.addEventListener('resize',measure)
    globalThis.addEventListener('scroll',measure,true)
    measure()
    return () => { resize.disconnect(); globalThis.removeEventListener('resize',measure);globalThis.removeEventListener('scroll',measure,true);bridge.updateSettingsViewport(null) }
  }, [bridge,enabled])
  useLayoutEffect(() => {
    if (!enabled || !pane.current) return
    const rect=pane.current.getBoundingClientRect()
    bridge.updateSettingsViewport({left:rect.left,top:rect.top,width:rect.width,height:rect.height})
  }, [bridge,enabled,state.preferenceError,state.websiteNavigation.accountName,state.websiteNavigation.settings?.error])
  const navigation=state.websiteNavigation
  const settings=navigation.settings
  const language=/中文|Chinese/i.test(settings?.language ?? '') ? 'zh-CN' : /English|英语/i.test(settings?.language ?? '') ? 'en' : /^(System|跟随系统|系统|Follow system)$/i.test(settings?.language ?? '') ? 'system' : ''
  return <section className="dsh-chat-settings"><DshChatStyles/><h2>CHAT设置</h2>
    {enabled && navigation.status==='ready' && <div className="dsh-chat-settings-card">
      <div className="dsh-chat-settings-account"><div><strong>{navigation.accountName || 'DeepSeek Chat'}</strong><p>已登录</p></div><button type="button" onClick={()=>bridge.logoutWebsite()} disabled={settings?.pending}>退出登录</button></div>
      <label className="dsh-chat-settings-language">系统语言<select aria-label="CHAT系统语言" value={language} disabled={settings?.pending} onChange={event=>bridge.commandWebsite({type:'setting',key:'language',value:event.target.value})}>
        {!language && <option value="" hidden></option>}<option value="system">跟随系统</option><option value="zh-CN">简体中文</option><option value="en">English</option>
      </select></label>
      {!language && !settings?.pending && !settings?.error && <p className="dsh-chat-settings-progress" role="status">尚未读取到官网语言。<button type="button" onClick={()=>bridge.commandWebsite({type:'settings-read'})}>重试</button></p>}
      {settings?.pending && <p className="dsh-chat-settings-progress" role="status">正在同步网页设置…</p>}
      {settings?.error && <p className="dsh-chat-settings-error" role="alert">{settings.error} <button type="button" onClick={()=>bridge.commandWebsite({type:'settings-read'})}>重试</button></p>}
      {state.preferenceError && <p className="dsh-chat-settings-error" role="alert">{state.preferenceError}</p>}
    </div>}
    {!enabled && <p role="status">{state.desktopAvailable ? state.availabilityMessage : '需要 DSH 桌面版的官方网页容器。'}</p>}
    {enabled && navigation.status!=='ready' && navigation.status!=='sign-in' && <p role="status">{state.webError || (navigation.status==='unsupported' ? '暂时无法连接官网。' : '正在连接 DeepSeek 官网…')} <button type="button" onClick={()=>bridge.reloadWebsite()}>重试</button></p>}
    <div ref={pane} className={`dsh-chat-settings-pane${enabled && navigation.status==='sign-in' ? '' : ' dsh-chat-settings-pane-hidden'}`} aria-label="CHAT官网登录区域">
    </div>
  </section>
}
