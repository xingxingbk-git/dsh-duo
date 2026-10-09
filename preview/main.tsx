/** Development fixture only. Never imported by either production plugin entry. */
import { useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import type { MainPanelId, PanelInfo, UsePanelInfo } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { DesktopBrowserBridge, DesktopBrowserReservation } from '@deepseek-ai/dsh-client-ui-sidebar-browser/types'
import { CHAT_PANEL, ModeController, type ModeAuthorization } from '../src/core/mode.js'
import { DuoChatPanel, DuoChatSidebar, DuoModeControl, DuoOverlayControl, useDuo, type DuoUIBridge, type DuoViewState, type DuoViewportRect } from '../src/ui.js'
import { DuoWebSurface } from '../src/web-surface.js'

const rootElement = document.getElementById('preview-root')!
type LedgerEntry = { sequence: number; action: string; lease?: string; storageKey?: string; url?: string }
const ledger: LedgerEntry[] = []
const partitions = new Map<string, string>()
const activeLeases = new Set<string>()
const popupListeners = new Map<string, (url: string) => void>()
const listeners = new Set<() => void>()
let leaseNumber = 0
let authorizationGeneration = 0
let epochNumber = 0
let sidebarMounted = false
let sidebarCollapsed = false
let websiteReloadRevision = 0
let webLoading = false
let webError: string | null = null
let viewport: DuoViewportRect | null = null
let cached: DuoViewState
let panelInfo: PanelInfo = { activePanelId: 'harness.original' as MainPanelId }

function record(entry: Omit<LedgerEntry, 'sequence'>): void {
  ledger.push({ sequence: ledger.length + 1, ...entry })
  publish()
}

const layout = {
  panelInfo: {
    getSnapshot: () => panelInfo,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
  },
  selectPanel(panel: string | null) {
    panelInfo = { activePanelId: panel as MainPanelId | null }
    controller.observePanel(panel)
    publish()
  },
  toggleSidebar() { sidebarCollapsed = !sidebarCollapsed; publish() },
}

const controller = new ModeController({
  readPanel: () => layout.panelInfo.getSnapshot().activePanelId,
  selectPanel: panel => layout.selectPanel(panel),
  mountChatNavigation: () => {
    sidebarMounted = true
    record({ action: 'mount-chat-sidebar' })
    return () => { sidebarMounted = false; record({ action: 'dispose-chat-sidebar' }) }
  },
  cancelAccount: accountId => {
    authorizationGeneration++
    webLoading = false
    webError = null
    record({ action: `invalidate:${accountId}` })
  },
}, true)

const nativeBrowser: DesktopBrowserBridge = {
  async acquire(storageKey) {
    const lease = `preview-lease-${++leaseNumber}` as DesktopBrowserReservation['lease']
    if (!partitions.has(storageKey)) partitions.set(storageKey, `preview-partition-${partitions.size + 1}`)
    activeLeases.add(lease)
    record({ action: 'acquire', lease, storageKey })
    return { lease, partition: partitions.get(storageKey)! }
  },
  async release(lease) {
    activeLeases.delete(lease)
    popupListeners.delete(lease)
    record({ action: 'release', lease })
  },
  onOpenRequested(lease, listener) {
    popupListeners.set(lease, listener)
    return () => { popupListeners.delete(lease) }
  },
}

function publish(): void {
  const state = controller.getSnapshot()
  const authorized = state.authorization.status === 'authorized'
  cached = {
    mode: state.mode, modeEnabled: controller.canEnter(), authorizationStatus: state.authorization.status,
    availabilityMessage: authorized ? '开发模拟：DSH 账号授权有效，网页容器不联网。' : '开发模拟：请使用上方按钮确认 DSH 账号授权。',
    accountLabel: authorized ? `模拟账号 ${state.authorization.accountId}` : null,
    error: state.error, desktopAvailable: true, webLoading, webError, viewport,
    accountStorageKey: authorized && state.authorization.accountId ? `preview:website:${state.authorization.accountId}` : null,
    authorizationGeneration, websiteReloadRevision,
  }
  for (const listener of listeners) listener()
}

function acceptAuthorization(next: ModeAuthorization): void {
  const previous = controller.getSnapshot().authorization
  if (next.accountId !== previous.accountId || next.epoch !== previous.epoch) authorizationGeneration++
  controller.updateAuthorization(next)
  publish()
}

function authorize(accountId: string): void {
  acceptAuthorization({ status: 'authorized', accountId, epoch: `preview-${++epochNumber}`, error: null })
}

function sameAccountRefresh(): void {
  acceptAuthorization({ ...controller.getSnapshot().authorization })
}

const bridge: DuoUIBridge = {
  getSnapshot: () => cached,
  subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener) } },
  selectMode: mode => { controller.select(mode) },
  refreshAuthorization: sameAccountRefresh,
  manageAccount: () => { controller.select('harness') },
  toggleSidebar: () => layout.toggleSidebar(),
  attachViewport: element => { if (!element) { viewport = null; publish() } },
  updateViewport: next => {
    if (viewport?.left === next?.left && viewport?.top === next?.top && viewport?.width === next?.width && viewport?.height === next?.height) return
    viewport = next
    publish()
  },
  reloadWebsite: () => { websiteReloadRevision++; publish() },
  reportWebsiteState: (generation, state) => {
    if (generation !== authorizationGeneration) return
    webLoading = state.loading
    webError = state.error
    publish()
  },
}
controller.subscribe(publish)
publish()

/** Only this development root gets a browser-tag simulation. No webpage is ever fetched. */
const simulatedGuests = new WeakSet<HTMLElement>()
function simulateGuest(element: HTMLElement): void {
  if (simulatedGuests.has(element)) return
  simulatedGuests.add(element)
  const lease = element.getAttribute('name') ?? 'unknown'
  let currentUrl = element.getAttribute('src') ?? 'about:blank'
  const load = async (url: string) => {
    currentUrl = url
    record({ action: 'loadURL', lease, url })
    element.dispatchEvent(new Event('did-start-loading'))
    queueMicrotask(() => { if (element.isConnected) element.dispatchEvent(new Event('did-stop-loading')) })
  }
  Object.assign(element, { loadURL: load, getURL: () => currentUrl, reload: () => { void load(currentUrl) } })
  const style = document.createElement('style')
  style.textContent = '.dsh-duo-webview:has([data-preview-guest]){display:flex;align-items:center;justify-content:center;background:#f8f9fc;color:#555d70;font-family:system-ui;text-align:center}[data-preview-guest] strong{font-size:20px;display:block;margin-bottom:12px}[data-preview-guest] p{font-size:13px;line-height:1.8;margin:0;max-width:430px}[data-preview-guest] code{font-size:11px;color:#8990a1}'
  const note = document.createElement('div')
  note.dataset.previewGuest = lease
  const title = document.createElement('strong')
  title.textContent = '网页容器模拟，未加载官网'
  const body = document.createElement('p')
  body.textContent = '这里只验证模式切换和网页容器生命周期。没有登录、聊天或官网历史；切回 HARNESS 后，同一授权下的容器保持不变。'
  const identity = document.createElement('code')
  identity.textContent = lease
  note.append(title, body, identity)
  element.append(style, note)
  queueMicrotask(() => { if (element.isConnected) element.dispatchEvent(new Event('dom-ready')) })
}
const guestObserver = new MutationObserver(records => {
  for (const record of records) for (const node of record.addedNodes) {
    if (!(node instanceof HTMLElement)) continue
    if (node.tagName === 'WEBVIEW') simulateGuest(node)
    for (const element of node.querySelectorAll<HTMLElement>('webview')) simulateGuest(element)
  }
})
guestObserver.observe(rootElement, { childList: true, subtree: true })

const slotProps = {
  usePanelInfo: (<R,>(selector: (snapshot: PanelInfo) => R): R => selector(useSyncExternalStore(layout.panelInfo.subscribe, layout.panelInfo.getSnapshot))) as UsePanelInfo,
}

const previewStyles = `
  *{box-sizing:border-box}body{margin:0;background:#fff;color:#24262b;font:14px system-ui,sans-serif}
  button,textarea{font:inherit}button{cursor:pointer}button:disabled{cursor:default}button:focus-visible,textarea:focus-visible{outline:2px solid #3568e6;outline-offset:3px}
  .preview-page{height:100vh;display:flex;flex-direction:column;--dsw-specific-sidebar-fill:#f3f4f7;--dsw-alias-label-primary:#22252c;--dsw-alias-label-secondary:#717785;--dsw-alias-border-l2:#e1e4eb;--dsw-alias-bg-base:#fff;--dsw-alias-interactive-bg-hover:#e9edf4}
  .preview-header{background:#fff7db;border-bottom:1px solid #ede1b8;padding:12px 18px;flex-shrink:0}
  .preview-header h1{font-size:15px;margin:0 0 5px}.preview-header p{font-size:12px;margin:0;color:#756843}
  .preview-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.preview-actions button{padding:6px 9px;border:1px solid #ded4b9;border-radius:6px;background:white;font-size:12px}
  .preview-frame{display:flex;flex:1;min-height:0}.preview-sidebar-owner{flex:0 0 auto;min-width:0;height:100%}.preview-harness-sidebar{width:100%;height:100%;background:#f3f4f7;padding:20px 16px;display:flex;flex-direction:column;border-right:1px solid #e2e5ec}
  .preview-harness-sidebar h2{font-size:18px;margin:0 0 25px}.preview-harness-sidebar p{font-size:12px;line-height:1.6;color:#767b88}.preview-harness-sidebar nav{display:flex;flex-direction:column;gap:12px}.preview-footer{margin-top:auto}
  .preview-main{flex:1;min-width:0;min-height:0}.preview-original{height:100%;display:flex}.preview-conversation{padding:32px;flex:1;min-width:0}.preview-conversation h2{font-size:24px;margin:0 0 12px}.preview-conversation p{font-size:13px;line-height:1.8;color:#787d88}
  .preview-conversation textarea{width:100%;height:110px;padding:12px;border:1px solid #dfe3ea;border-radius:9px;resize:vertical}.preview-rightbar{width:240px;background:#fafbfc;padding:26px 18px;border-left:1px solid #e4e7ed}
  .preview-rightbar h3{font-size:13px;margin:0 0 12px}.preview-rightbar dl{font-size:12px;color:#727887}.preview-rightbar dd{margin:4px 0 15px;color:#252a35}
  .preview-ledger{font-size:11px;line-height:1.65;color:#697182;overflow-wrap:anywhere}.preview-ledger strong{color:#252a35}.preview-ledger ol{padding-left:17px}.preview-ledger small{font-size:10px}
  @media(max-width:850px){.preview-rightbar{width:180px}.preview-harness-sidebar{width:250px}.preview-conversation{padding:20px}}
`

function Preview() {
  const state = useDuo(bridge)
  const chat = state.mode === 'chat'
  const counts = { acquired: ledger.filter(item => item.action === 'acquire').length, released: ledger.filter(item => item.action === 'release').length }
  return <div className="preview-page">
    <style>{previewStyles}</style>
    <header className="preview-header">
      <h1>dsh-duo 开发预览 · 模拟环境，不是 DSH 实机验收</h1>
      <p>复用插件实际 UI 和 ModeController；账号、布局和网页容器均为模拟，不连接 DeepSeek 官网。HARNESS 控件位置是临时候选。</p>
      <div className="preview-actions" aria-label="开发模拟控制">
        <button type="button" onClick={() => acceptAuthorization({ status: 'pending', accountId: null, epoch: `preview-${++epochNumber}`, error: null })}>模拟授权待确认</button>
        <button type="button" onClick={() => authorize('A')}>模拟授权账号 A</button>
        <button type="button" onClick={sameAccountRefresh} disabled={state.authorizationStatus !== 'authorized'}>同账号授权刷新</button>
        <button type="button" onClick={() => acceptAuthorization({ status: 'unauthorized', accountId: null, epoch: `preview-${++epochNumber}`, error: null })}>模拟退出 DSH</button>
        <button type="button" onClick={() => authorize('B')}>模拟切换账号 B</button>
      </div>
    </header>
    <div className="preview-frame">
      {/* Official AppFrame constrains this occupant inside a fixed-width grid column. */}
      <div className="preview-sidebar-owner" style={{ width: sidebarMounted && sidebarCollapsed ? 56 : 270 }}>
      {sidebarMounted ? <DuoChatSidebar {...slotProps} bridge={bridge} collapsed={sidebarCollapsed} width={sidebarCollapsed ? 56 : 270} /> : <aside className="preview-harness-sidebar" aria-label="原 Harness 模拟侧栏">
        <h2>DeepSeek Harness</h2>
        <nav aria-label="原 Harness 模拟导航"><strong>原工作区</strong><span>原会话与文件面板</span><span>设置和账号</span></nav>
        <p>这是保留状态的 Harness 模拟框架。CHAT 中的导航由插件暂时替换，返回后恢复。</p>
        <div className="preview-ledger" aria-label="网页容器生命周期">
          <strong>状态：{state.mode.toUpperCase()} / {state.authorizationStatus}</strong><br />
          <span>授权代次：{state.authorizationGeneration}</span><br />
          <span>创建 {counts.acquired} · 释放 {counts.released} · 当前 {activeLeases.size}</span>
          <ol>{ledger.slice(-5).map(item => <li key={item.sequence}>{item.action} <small>{item.lease}</small></li>)}</ol>
        </div>
        <div className="preview-footer"><DuoModeControl {...slotProps} bridge={bridge} wide /></div>
      </aside>}
      </div>
      <main className="preview-main">
        <div className="preview-original" style={{ display: chat ? 'none' : 'flex' }} data-preview-original="harness">
          <section className="preview-conversation" aria-label="原 Harness 模拟面板">
            <h2>原 Harness 工作区</h2>
            <p>原面板 ID：<code>{panelInfo.activePanelId ?? 'conversation'}</code><br />切入 CHAT 前的面板会由真正的模式控制器记录并恢复。</p>
            <label htmlFor="harness-draft">Harness 草稿（模拟，可修改后切换检验保留）</label>
            <textarea id="harness-draft" defaultValue="这是原 Harness 的草稿，切换模式后应保留。" />
            <p>此预览不能验证 DSH 加载、官网登录、聊天、真实历史、系统快捷键或原生右栏。</p>
          </section>
          <aside className="preview-rightbar" aria-label="原 Harness 模拟右栏"><h3>原右栏状态</h3><dl><dt>是否展开</dt><dd>展开</dd><dt>宽度</dt><dd>240 px</dd><dt>已选标签</dt><dd>原文件预览</dd><dt>展示模式</dt><dd>普通</dd></dl><p>CHAT 隐藏该模拟栏，HARNESS 恢复相同状态。</p></aside>
        </div>
        {chat && <DuoChatPanel {...slotProps} bridge={bridge} />}
      </main>
    </div>
    <DuoOverlayControl {...slotProps} bridge={bridge} />
    <DuoWebSurface {...slotProps} bridge={bridge} nativeBrowser={nativeBrowser} />
  </div>
}

/** Public, credential-free inspection hook for development browser assertions. */
Object.assign(window, { __DUO_PREVIEW__: {
  getSnapshot: () => ({ ...cached, activePanelId: panelInfo.activePanelId, sidebarMounted, sidebarCollapsed }),
  getLedger: () => ledger.map(entry => ({ ...entry })),
  getActiveLeases: () => [...activeLeases],
  controller,
} })
createRoot(rootElement).render(<Preview />)
