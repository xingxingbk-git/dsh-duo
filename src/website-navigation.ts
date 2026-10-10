import { adaptWebsiteHeader } from './website-header.js'
import { adaptWebsiteSettings } from './website-settings.js'
/** Visible website navigation/account/preferences only; no credentials, storage or request APIs. */
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
  readonly accountName?: string | null
  readonly settings?: {language: string | null; theme: string | null; error: string | null; pending?: boolean; restored?: boolean }
}
export type WebsiteCommand = { readonly type: 'snapshot'; readonly showOriginal: boolean; readonly headerInset?: number }
  | { readonly type: 'open'; readonly href: string }
  | { readonly type: 'settings-read' } | { readonly type: 'settings-close' } | { readonly type: 'setting'; readonly key: 'language' | 'theme'; readonly value: string }
  | { readonly type: 'preferences'; readonly language: string }
  | { readonly type: 'logout' }
  | { readonly type: 'new' } | { readonly type: 'more' } | { readonly type: 'restore' }

export const emptyNavigation = (): WebsiteNavigation => ({ status: 'loading', conversations: [], selectedHref: null, canCreate: false, error: null })

/** This function is serialized into our isolated guest. Keep all helpers inside it. */
export function adaptWebsiteNavigation(doc: Document, page: Pick<Location, 'origin' | 'pathname'>, command: WebsiteCommand): WebsiteNavigation {
  const origin = 'https://chat.deepseek.com'
  const marker = 'data-dsh-chat-navigation'
  const styleId = 'dsh-chat-website-navigation-style'
  const preparingStyleId = 'dsh-chat-website-preparing-style'
  const owned = [marker, 'data-dsh-chat-layout', 'data-dsh-chat-content', 'data-dsh-chat-web-chrome', 'data-dsh-chat-profile', 'data-dsh-chat-settings-dialog', 'data-dsh-chat-settings-host', 'data-dsh-chat-expanding', 'data-dsh-chat-settings-tabs', 'data-dsh-chat-settings-pane', 'data-dsh-chat-settings-layout', 'data-dsh-chat-settings-chrome', 'data-dsh-chat-settings-appearance', 'data-dsh-chat-header-row', 'data-dsh-chat-header-title', 'data-dsh-chat-header-share']
  const empty = (status: WebsiteNavigation['status']): WebsiteNavigation => ({ status, conversations: [], selectedHref: null, canCreate: false, error: null })
  const clearSettings = () => {
    for (const attr of [...doc.documentElement.attributes]) if (/^data-dsh-chat-(settings-|language$|theme$|dark-complete$)/.test(attr.name)) doc.documentElement.removeAttribute(attr.name)
  }
  const restore = () => {
    clearSettings()
    doc.getElementById(styleId)?.remove()
    doc.getElementById('dsh-chat-header-style')?.remove()
    doc.documentElement.style.removeProperty('--dsh-chat-title-inset')
    doc.getElementById(preparingStyleId)?.remove()
    doc.getElementById('dsh-chat-settings-view-style')?.remove()
    doc.documentElement.removeAttribute('data-dsh-chat-voice')
    doc.documentElement.removeAttribute('data-dsh-chat-preparing')
    owned.forEach(attr => doc.querySelectorAll(`[${attr}]`).forEach(node => node.removeAttribute(attr)))
  }
  if (page.origin !== origin) { restore(); return empty('unsupported') }
  if (command.type === 'restore' || (command.type === 'snapshot' && command.showOriginal)) {
    doc.dispatchEvent(new Event('dsh-chat-stop-adapting'))
    restore()
    if (command.type === 'restore') return empty('unsupported')
  }
  // Own observer runs in the same DOM microtask checkpoint as the site's React
  // commit, before paint. No app globals or data stores cross the guest boundary.
  if (!(command.type === 'snapshot' && command.showOriginal) && !doc.documentElement.hasAttribute('data-dsh-chat-observing') && doc.defaultView) {
    doc.documentElement.setAttribute('data-dsh-chat-observing', '')
    let queued = false
    const observer = new MutationObserver(() => {
      if (queued) return
      queued = true
      queueMicrotask(() => {
        queued = false
        if (!doc.documentElement.hasAttribute('data-dsh-chat-observing')) return
        adaptWebsiteNavigation(doc, doc.defaultView!.location, { type: 'snapshot', showOriginal: false })
      })
    })
    observer.observe(doc.body, {childList:true,subtree:true,characterData:true})
    doc.addEventListener('dsh-chat-stop-adapting', () => {
      observer.disconnect(); doc.documentElement.removeAttribute('data-dsh-chat-observing')
    }, {once:true})
  }
  if (/^\/sign_in\/?$/.test(page.pathname)) { restore(); return empty('sign-in') }
  // Login SPA commits can precede the host navigation event. Gate that guest
  // paint locally as well, then reveal only the adapted, dark page.
  if (!(command.type==='snapshot' && command.showOriginal) && !doc.documentElement.hasAttribute('data-dsh-chat-dark-complete')) {
    doc.documentElement.setAttribute('data-dsh-chat-preparing','')
    if (!doc.getElementById(preparingStyleId)) {
      const style=doc.createElement('style'); style.id=preparingStyleId
      style.textContent='html[data-dsh-chat-preparing] body{opacity:0!important}'
      doc.head.append(style)
    }
  }
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
  if (!sidebar) {
    // A narrow viewport can initially mount only the site's compact controls.
    // Open its own navigation once, while the guest is still paint-gated.
    if (!(command.type === 'snapshot' && command.showOriginal)) {
      const compact = [...doc.querySelectorAll<HTMLElement>('div,header')].find(el => {
        const r = el.getBoundingClientRect()
        const buttons = el.querySelectorAll('button,[role="button"]')
        return r.top >= -1 && r.top < 80 && r.left >= -1 && r.left < 180 && r.width > 30 && r.width < 400 && r.height > 16 && r.height < 80
          && buttons.length >= 2 && buttons.length <= 3 && el.querySelector('svg,img') && !el.textContent?.trim()
      })
      const mobileToggle = [...doc.querySelectorAll<HTMLElement>('button,[role="button"]')].find(el => {
        const r=el.getBoundingClientRect(); return r.left>=0 && r.left<80 && r.top>=0 && r.top<80 && r.width>=20 && r.width<=72 && r.height>=20 && r.height<=72 && !el.textContent?.trim() && !!el.querySelector('svg') && !el.closest('[data-dsh-chat-settings-dialog]')
      })
      const expandable = compact ?? mobileToggle
      if (expandable) {
        const started = Number(expandable.getAttribute('data-dsh-chat-expanding'))
        if (!started) {
          expandable.setAttribute('data-dsh-chat-expanding',String(Date.now()));
          (compact?.querySelector<HTMLElement>('button,[role="button"]') ?? mobileToggle)?.click()
          return empty('loading')
        }
        if (Date.now() - started < 5000) return empty('loading')
      }
    }
    restore(); return empty('unsupported')
  }
  const newChat = findNew(sidebar)
  // The navigation's outer track can outlive an inner sidebar hidden with
  // display:none. Hide the whole bounded track and let its sibling fill it.
  let track = sidebar
  for (let depth = 0; depth < 5 && track.parentElement && track.parentElement !== doc.body; depth++) {
    const parent = track.parentElement
    const r = parent.getBoundingClientRect()
    if (parent.querySelector('textarea,[contenteditable="true"]') || r.width > 480 || r.width < 160 || r.left > 16) break
    track = parent
  }
  const layout = track.parentElement
  const content = layout ? [...layout.children].find(el => el !== track && el.querySelector('textarea,[contenteditable="true"]')) as HTMLElement | undefined : undefined
  const avatars = [...track.querySelectorAll<HTMLImageElement>('img')].filter(img => !img.closest('a[href]'))
  const avatar = avatars.find(img => {
    const r = img.getBoundingClientRect()
    return r.top > (doc.defaultView?.innerHeight ?? 600) * .75 && r.height <= 80
  }) ?? (track.hasAttribute(marker) ? avatars.at(-1) : undefined)
  let profile = doc.querySelector<HTMLElement>('[data-dsh-chat-profile]') ?? avatar?.parentElement ?? null
  for (let depth = 0; profile?.parentElement && depth < 3; depth++) {
    const p = profile.parentElement
    if (p === sidebar || p.querySelector('a[href]') || p.getBoundingClientRect().height > 100) break
    profile = p
  }
  profile?.setAttribute('data-dsh-chat-profile','')
  const accountName = profile?.textContent?.trim().slice(0, 100) || null
  const settings = adaptWebsiteSettings(doc, profile, command)
  const settingsRoot = doc.documentElement
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
    track.setAttribute(marker, '')
    // Keep the inner navigation addressable after the track is hidden.
    sidebar.setAttribute(marker, '')
    if (content && layout) {
      layout.setAttribute('data-dsh-chat-layout', '')
      content.setAttribute('data-dsh-chat-content', '')
      for (const candidate of content.querySelectorAll<HTMLElement>('div,header')) {
        const r = candidate.getBoundingClientRect()
        if (r.top >= -1 && r.top <= 72 && r.height > 0 && r.height <= 80 && r.width <= 400
          && candidate.querySelectorAll('button,[role="button"]').length >= 2 && candidate.querySelectorAll('button,[role="button"]').length <= 3 && candidate.querySelector('svg,img')
          && !candidate.querySelector('textarea,[contenteditable="true"]') && !candidate.textContent?.trim()) candidate.setAttribute('data-dsh-chat-web-chrome', '')
      }
    }
    const styleText=`html:not([data-dsh-chat-settings-request]) [${marker}],[data-dsh-chat-web-chrome]{display:none!important}
        [data-dsh-chat-layout]{grid-template-columns:minmax(0,1fr)!important}
        [data-dsh-chat-content]{margin-left:0!important;min-width:0!important;width:100%!important;max-width:none!important;flex:1 1 0%!important}`
    let style=doc.getElementById(styleId)
    if(!style){style=doc.createElement('style');style.id=styleId;doc.head.append(style)}
    if(style.textContent!==styleText) style.textContent=styleText

  }
  const selected = conversations.find(item => item.href === safeHref(page.pathname))
  if (!(command.type === 'snapshot' && command.showOriginal)) adaptWebsiteHeader(doc, content, selected?.title ?? null, command.type === 'snapshot' ? command.headerInset ?? (Number.parseInt(settingsRoot.style.getPropertyValue('--dsh-chat-title-inset')) || 24) : Number.parseInt(settingsRoot.style.getPropertyValue('--dsh-chat-title-inset')) || 24)
  const ready=settingsRoot.hasAttribute('data-dsh-chat-dark-complete') || (command.type==='snapshot' && command.showOriginal)
  if (ready) settingsRoot.removeAttribute('data-dsh-chat-preparing')
  return { status: ready ? 'ready' : 'loading', conversations, selectedHref: safeHref(page.pathname), canCreate: newChat !== null, error: null, accountName, settings }
}

export function websiteCommandScript(command: WebsiteCommand): string {
  return `(() => { const adaptWebsiteSettings = ${adaptWebsiteSettings.toString()}; const adaptWebsiteHeader = ${adaptWebsiteHeader.toString()}; return (${adaptWebsiteNavigation.toString()})(document,location,${JSON.stringify(command)}); })()`
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
    accountName: source.status === 'ready' && typeof source.accountName === 'string' ? source.accountName.slice(0,100) : null,
    settings: source.settings ? {language:typeof source.settings.language === 'string' ? source.settings.language.slice(0,80) : null,theme:typeof source.settings.theme === 'string' ? source.settings.theme.slice(0,80) : null,error:typeof source.settings.error === 'string' ? source.settings.error.slice(0,200) : null,pending:source.settings.pending===true,restored:source.settings.restored===true} : undefined,
    canCreate: source.status === 'ready' && source.canCreate === true, error: typeof source.error === 'string' ? source.error.slice(0, 300) : null }
}
