/** User-approved rc.2 sidebar exception. No services, Session state or credentials. */
export interface SidebarAdapterState {
  readonly chat: boolean
  readonly canCreate: boolean
}

const newSessionLabels = new Set(['新建会话', '新会话', 'New Session'])
const pluginLabels = new Set(['插件', 'Plugins'])

/** Client-owned lifetime survives the brand seat unmounting on sidebar collapse. */
export function createSidebarBinding(read: () => SidebarAdapterState, create: () => void, report: (ready: boolean) => void) {
  let adapter: ReturnType<typeof attachSidebarAdapter> = null
  return {
    attach(name: HTMLElement) {
      adapter?.dispose()
      adapter = attachSidebarAdapter(name, read, create)
      report(adapter !== null)
    },
    sync() { adapter?.sync() },
    dispose() { adapter?.dispose(); adapter = null },
  }
}

/** Start at our own brand seat and require the shipped, direct-child shell shape.
 * Unknown layouts are left alone; no global search or hashed CSS selectors. */
export function attachSidebarAdapter(
  name: HTMLElement,
  read: () => SidebarAdapterState,
  create: () => void,
): { sync(): void; dispose(): void } | null {
  // The renderer's addressable SlotOutlet is display:contents, but remains a DOM ancestor.
  const outlet = name.parentElement
  const nameSeat = outlet?.getAttribute('data-slot') === 'sidebar.brand.name'
    ? outlet.parentElement : outlet
  const identity = nameSeat?.parentElement
  const brand = identity?.parentElement
  const row = brand?.parentElement
  const root = row?.parentElement
  if (!nameSeat || !identity || !brand || !row || !root
    || identity.getAttribute('aria-hidden') !== 'true'
    || !row.hasAttribute('data-window-drag') || identity.children.length !== 2) return null
  const newButton = Array.from(root.children).find(element => element.tagName === 'BUTTON'
    && newSessionLabels.has(element.getAttribute('aria-label') ?? '')) as HTMLButtonElement | undefined
  if (!newButton) return null

  const originalAttributes = new Map<Element, Map<string, string | null>>()
  const mark = (element: Element, key: string, value: string) => {
    let originals = originalAttributes.get(element)
    if (!originals) { originals = new Map(); originalAttributes.set(element, originals) }
    if (!originals.has(key)) originals.set(key, element.getAttribute(key))
    if (element.getAttribute(key) !== value) element.setAttribute(key, value)
  }
  mark(identity, 'data-dsh-chat-brand-fill', 'identity')
  mark(nameSeat, 'data-dsh-chat-brand-fill', 'name')
  mark(newButton, 'data-dsh-chat-new-session', 'true')
  const originallyDisabled = newButton.disabled
  let disposed = false
  const intercept = (event: Event) => {
    if (disposed || !read().chat) return
    // Keyboard activation also produces click; stop before React's delegated action.
    event.preventDefault(); event.stopImmediatePropagation()
    if (read().canCreate) create()
  }
  newButton.addEventListener('click', intercept, true)
  // On Web/Windows the entire brand is also a New Session button.
  if (brand.tagName === 'BUTTON') brand.addEventListener('click', intercept, true)
  const sync = () => {
    if (disposed) return
    const state = read()
    mark(root, 'data-dsh-chat-sidebar-mode', state.chat ? 'chat' : 'harness')
    newButton.disabled = state.chat ? !state.canCreate : originallyDisabled
    for (const nav of Array.from(root.children).filter(element => element.tagName === 'NAV')) {
      const buttons = Array.from(nav.children).filter(element => element.tagName === 'BUTTON')
      for (const button of buttons) {
        if (pluginLabels.has(button.getAttribute('aria-label') ?? '')) mark(button, 'data-dsh-chat-plugin-row', 'true')
      }
      mark(nav, 'data-dsh-chat-only-plugins', buttons.length > 0
        && buttons.every(button => pluginLabels.has(button.getAttribute('aria-label') ?? '')) ? 'true' : 'false')
    }
  }
  const observer = new MutationObserver(sync)
  observer.observe(root, { childList: true, subtree: true })
  sync()
  return {
    sync,
    dispose() {
      if (disposed) return
      disposed = true; observer.disconnect()
      newButton.removeEventListener('click', intercept, true)
      brand.removeEventListener('click', intercept, true)
      newButton.disabled = originallyDisabled
      for (const [element, attributes] of originalAttributes) for (const [key, value] of attributes) {
        if (value === null) element.removeAttribute(key)
        else element.setAttribute(key, value)
      }
    },
  }
}
