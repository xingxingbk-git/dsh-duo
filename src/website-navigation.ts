/** Visible website navigation only. Never access page globals, storage or request APIs. */
export interface WebsiteConversation {
  readonly href: string
  readonly title: string
  readonly group: string
}
export interface WebsiteNavigation {
  readonly status: 'loading' | 'ready' | 'sign-in' | 'unsupported'
  readonly conversations: readonly WebsiteConversation[]
  readonly selectedHref: string | null
  readonly canCreate: boolean
  readonly error: string | null
}
export type WebsiteCommand = { readonly type: 'snapshot'; readonly showOriginal: boolean }
  | { readonly type: 'open'; readonly href: string }
  | { readonly type: 'new' } | { readonly type: 'more' } | { readonly type: 'restore' }

export const emptyNavigation = (): WebsiteNavigation => ({ status: 'loading', conversations: [], selectedHref: null, canCreate: false, error: null })

/** This function is serialized into our isolated guest. Keep all helpers inside it. */
export function adaptWebsiteNavigation(doc: Document, page: Pick<Location, 'origin' | 'pathname'>, command: WebsiteCommand): WebsiteNavigation {
  const origin = 'https://chat.deepseek.com'
  const marker = 'data-dsh-duo-navigation'
  const styleId = 'dsh-duo-website-navigation-style'
  const empty = (status: WebsiteNavigation['status']): WebsiteNavigation => ({ status, conversations: [], selectedHref: null, canCreate: false, error: null })
  const restore = () => {
    doc.getElementById(styleId)?.remove()
    doc.querySelectorAll(`[${marker}]`).forEach(node => node.removeAttribute(marker))
  }
  if (page.origin !== origin) { restore(); return empty('unsupported') }
  if (command.type === 'restore') { restore(); return empty('unsupported') }
  if (/^\/sign_in\/?$/.test(page.pathname)) { restore(); return empty('sign-in') }
  const safeHref = (value: string | null) => {
    try {
      const url = new URL(value ?? '', origin)
      return url.origin === origin && /^\/a\/chat\/s\/[a-zA-Z0-9-]+$/.test(url.pathname)
        && !url.search && !url.hash && !url.username && !url.password ? url.href : null
    } catch { return null }
  }
  const labels = /^(开启新对话|新对话|New chat|New Chat)$/
  const groups = /^(置顶|今天|昨天|前天|\d+\s*天内|\d+\s*天前|\d{4}-\d{2}|Pinned|Today|Yesterday|Previous \d+ Days)$/i
  const findNew = (root: Element) => {
    const walker = doc.createTreeWalker(root, 4)
    let node: Node | null
    while ((node = walker.nextNode())) {
      if (labels.test((node.textContent ?? '').trim()) && node.parentElement instanceof HTMLElement) return node.parentElement
    }
    return null
  }
  const isNavigationColumn = (candidate: HTMLElement) => {
    const rect = candidate.getBoundingClientRect()
    const viewportHeight = doc.defaultView?.innerHeight ?? 600
    return rect.left >= -1 && rect.left <= 16 && rect.top >= -1 && rect.top <= 32
      && rect.width >= 160 && rect.width <= 480 && rect.height >= Math.max(200, viewportHeight * .75)
      && !candidate.querySelector('textarea,[contenteditable="true"]')
  }
  const allLinks = [...doc.querySelectorAll<HTMLAnchorElement>('a[href]')].filter(link => safeHref(link.getAttribute('href')))
  let sidebar: HTMLElement | null = doc.querySelector<HTMLElement>(`[${marker}]`)
  if (sidebar && (!sidebar.isConnected || !findNew(sidebar))) sidebar = null
  if (!sidebar) {
    // Choose the narrow navigation column containing both history and New Chat,
    // never the root/main/body (which could include chat message links).
    for (const link of allLinks) {
      let candidate = link.parentElement
      for (let depth = 0; candidate && candidate !== doc.body && depth < 12; depth++, candidate = candidate.parentElement) {
        if (isNavigationColumn(candidate) && findNew(candidate)) { sidebar = candidate; break }
      }
      if (sidebar) break
    }
  }
  // An empty-history account still has a navigation column with New Chat.
  if (!sidebar) {
    for (const candidate of doc.querySelectorAll<HTMLElement>('aside,nav,[role="navigation"],div')) {
      if (isNavigationColumn(candidate) && findNew(candidate)) { sidebar = candidate; break }
    }
  }
  if (!sidebar) { restore(); return empty('unsupported') }
  const newChat = findNew(sidebar)
  const conversations: WebsiteConversation[] = []
  let group = '对话'
  const walker = doc.createTreeWalker(sidebar, 1 | 4, {
    acceptNode(node) {
      if (node instanceof Element && (node.matches('script,style,svg,input') || (node.parentElement?.closest('a[href]')))) return 2
      return 1
    },
  })
  let node: Node | null
  while ((node = walker.nextNode()) && conversations.length < 1000) {
    if (node instanceof HTMLAnchorElement) {
      const href = safeHref(node.getAttribute('href'))
      const title = (node.getAttribute('title') || node.textContent || '').trim().slice(0, 300)
      if (href && title && !conversations.some(item => item.href === href)) conversations.push({ href, title, group })
    } else if (node.nodeType === 3 && groups.test((node.textContent ?? '').trim())) group = (node.textContent ?? '').trim()
  }
  if (command.type === 'open') {
    const target = safeHref(command.href)
    const link = [...sidebar.querySelectorAll<HTMLAnchorElement>('a[href]')].find(item => safeHref(item.getAttribute('href')) === target)
    if (!target || !link) { restore(); return { ...empty('unsupported'), error: '该对话不在当前官网列表，请刷新列表。' } }
    link.click()
  } else if (command.type === 'new') {
    if (!newChat) return empty('unsupported')
    newChat.click()
  } else if (command.type === 'more') {
    doc.getElementById(styleId)?.remove()
    const scrollable = [...sidebar.querySelectorAll<HTMLElement>('*')].find(element => element.scrollHeight > element.clientHeight + 20
      && /auto|scroll/.test(getComputedStyle(element).overflowY))
    scrollable?.scrollTo({ top: scrollable.scrollHeight, behavior: 'instant' })
  }
  if (command.type === 'snapshot' && command.showOriginal) restore()
  else {
    sidebar.setAttribute(marker, '')
    if (!doc.getElementById(styleId)) {
      const style = doc.createElement('style')
      style.id = styleId
      style.textContent = `[${marker}]{display:none!important}`
      doc.head.append(style)
    }
  }
  return { status: 'ready', conversations, selectedHref: safeHref(page.pathname), canCreate: newChat !== null, error: null }
}

export function websiteCommandScript(command: WebsiteCommand): string {
  return `(${adaptWebsiteNavigation.toString()})(document,location,${JSON.stringify(command)})`
}

/** Treat the guest response as untrusted; keep only bounded, origin-scoped list data. */
export function parseWebsiteNavigation(value: unknown): WebsiteNavigation {
  if (!value || typeof value !== 'object') throw new Error('Invalid navigation response')
  const source = value as WebsiteNavigation
  if (!['loading', 'ready', 'sign-in', 'unsupported'].includes(source.status) || !Array.isArray(source.conversations)) throw new Error('Invalid navigation response')
  const validHref = (href: unknown): href is string => typeof href === 'string' && /^https:\/\/chat\.deepseek\.com\/a\/chat\/s\/[a-zA-Z0-9-]+$/.test(href)
  const conversations = source.conversations.slice(0, 1000).filter(item => item && validHref(item.href) && typeof item.title === 'string' && typeof item.group === 'string')
    .map(item => ({ href: item.href, title: item.title.slice(0, 300), group: item.group.slice(0, 80) }))
  return { status: source.status, conversations: source.status === 'ready' ? conversations : [], selectedHref: validHref(source.selectedHref) ? source.selectedHref : null,
    canCreate: source.status === 'ready' && source.canCreate === true, error: typeof source.error === 'string' ? source.error.slice(0, 300) : null }
}
