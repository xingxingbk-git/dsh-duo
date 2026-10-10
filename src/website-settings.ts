import type { WebsiteCommand } from './website-navigation.js'

/** Public profile menu and General controls only; no site APIs or storage. */
export function adaptWebsiteSettings(doc: Document, profile: HTMLElement | null, command: WebsiteCommand) {
  const root = doc.documentElement
  const attr = (name: string) => `data-dsh-chat-settings-${name}`
  // Remove the discarded embedded-settings presentation on an existing guest.
  root.removeAttribute(attr('view'))
  doc.getElementById('dsh-chat-settings-view-style')?.remove()
  doc.querySelectorAll('[data-dsh-chat-settings-host],[data-dsh-chat-settings-tabs],[data-dsh-chat-settings-pane],[data-dsh-chat-settings-layout],[data-dsh-chat-settings-chrome],[data-dsh-chat-settings-appearance]').forEach(el => {
    for (const a of [...el.attributes]) if (/^data-dsh-chat-settings-(host|tabs|pane|layout|chrome|appearance)$/.test(a.name)) el.removeAttribute(a.name)
  })
  const exact = (parent: Element, re: RegExp) => {
    const selectors = 'button,[role="menuitem"],[role="option"],[role="button"],label,.ds-button,.ds-dropdown-menu-option,.ds-select-option,.ds-dropdown-menu div,.ds-dropdown-menu span,.ds-select-dropdown div'
    const semantic = [...parent.querySelectorAll<HTMLElement>(selectors)].find(el => re.test(el.textContent?.trim() ?? '') || re.test(el.getAttribute('aria-label') ?? ''))
    if (semantic) return semantic
    if (!parent.closest('[role="dialog"],.ds-modal-content')) return undefined
    return [...parent.querySelectorAll<HTMLElement>('div,span')].find(el => re.test(el.textContent?.trim() ?? '') && !el.querySelector('input,textarea,[contenteditable="true"]'))
  }
  const general = /^(General|通用设置|常规|通用)$/i
  const isModal = (el: HTMLElement) => !el.closest('[hidden],[aria-hidden="true"]')
    && /Settings|系统设置/.test(el.textContent ?? '') && !!exact(el, general)
    && !el.querySelector('textarea,[contenteditable="true"]')
  const dialog = [...doc.querySelectorAll<HTMLElement>('[role="dialog"],.ds-modal-content')].find(isModal)
  const closeDialog = () => dialog && [...dialog.querySelectorAll<HTMLElement>('button,[role="button"],.ds-icon-button')].find(el => !el.textContent?.trim() && el.querySelector('svg'))?.click()
  const openProfileMenu = () => {
    const trigger = profile?.querySelector('img') ?? (profile?.matches('button,[role="button"],[aria-haspopup]') ? profile : null) ?? profile?.querySelector('[aria-haspopup="menu"]')
    ;(trigger as HTMLElement | undefined)?.click()
  }
  const request = (goal: string) => {
    root.setAttribute(attr('request'), goal); root.removeAttribute(attr('phase')); root.removeAttribute(attr('error'))
    root.setAttribute(attr('deadline'), String(Date.now() + 12000))
  }
  if (command.type === 'settings-close') {closeDialog(); root.removeAttribute(attr('request'));root.removeAttribute(attr('phase'));root.removeAttribute(attr('deadline'))}
  if (command.type === 'settings-read') request('read')
  if (command.type === 'setting') request(`${command.key}:${command.value}`)
  if (command.type === 'preferences') {
    root.removeAttribute(attr('restored'))
    root.removeAttribute('data-dsh-chat-dark-complete')
    if (command.language) root.setAttribute(attr('restore-language'), command.language)
  }
  if (command.type === 'logout') request('logout')
  const rowFor = (re: RegExp) => {
    if (!dialog) return undefined
    const walker = doc.createTreeWalker(dialog, 4); let node: Node | null
    while ((node = walker.nextNode())) {
      if (!re.test(node.textContent?.trim() ?? '')) continue
      const label = node.parentElement
      for (let row = label, i = 0; row && row !== dialog && i < 5; row = row.parentElement, i++) {
        if (row.querySelector('button,[role="combobox"],.ds-select,.ds-button,[tabindex]') || (row.querySelector('svg') && (row.textContent?.trim().length ?? 0) > (label?.textContent?.trim().length ?? 0))) return row
      }
    }
  }
  const languageRow = rowFor(/^(Language|System language|语言|系统语言)$/i)
  const control = languageRow?.querySelector<HTMLElement>('[role="combobox"],.ds-select')
    ?? languageRow?.querySelector<HTMLElement>('.ds-button,[tabindex],button')
    ?? (languageRow ? [...languageRow.children].find(el => el.querySelector('svg')) as HTMLElement | undefined : undefined)
  const language = control?.textContent?.trim().slice(0, 80) || null
  const themeRow = rowFor(/^(Theme|Appearance|主题|外观)$/i)
  const themeButtons = themeRow ? [...themeRow.querySelectorAll<HTMLElement>('button,[role="button"],.ds-button')].filter(el => /^(Light|Dark|System|浅色|深色|跟随系统|系统)$/i.test(el.textContent?.trim() ?? '')) : []
  const selectedTheme = themeButtons.find(el => el.getAttribute('aria-pressed') === 'true' || el.getAttribute('aria-selected') === 'true' || el.getAttribute('data-state') === 'active')
    ?? (themeButtons.length === 3 ? themeButtons.find(el => themeButtons.filter(other => getComputedStyle(other).backgroundColor === getComputedStyle(el).backgroundColor).length === 1) : undefined)
  const theme = selectedTheme?.textContent?.trim().slice(0, 80) || null
  if (language) root.setAttribute('data-dsh-chat-language', language)
  if (theme) root.setAttribute('data-dsh-chat-theme', theme)
  if (!root.hasAttribute(attr('request')) && !root.hasAttribute(attr('error')) && command.type !== 'settings-close') {
    if (!root.hasAttribute('data-dsh-chat-dark-complete')) request('theme:dark')
    else if (root.hasAttribute(attr('restore-language'))) request(`language:${root.getAttribute(attr('restore-language'))}`)
  }
  const goal = root.getAttribute(attr('request')), phase = root.getAttribute(attr('phase'))
  const finish = (error?: string) => {
    root.removeAttribute(attr('request'));root.removeAttribute(attr('phase'));root.removeAttribute(attr('deadline'))
    if (error) root.setAttribute(attr('error'), error)
    if (goal === 'theme:dark' && !error) root.setAttribute('data-dsh-chat-dark-complete', '')
    if (goal?.startsWith('language:')) {
      root.removeAttribute(attr('restore-language'))
      // Language writes must recheck the fixed dark preference, including guests
      // that retained a stale completion marker from an earlier adapter.
      root.removeAttribute('data-dsh-chat-dark-complete')
    }
    if (goal !== 'logout') closeDialog()
  }
  if (goal) {
    if (Date.now() > Number(root.getAttribute(attr('deadline')))) finish('官网设置暂未响应，请重试。')
    else if (goal === 'logout') {
      // The exact current-session item, never the all-device settings action.
      const logout = [...doc.querySelectorAll('[role="menu"],.ds-dropdown-menu')].map(menu => exact(menu, /^(Log out|Logout|退出登录|登出)$/i)).find(Boolean)
      if (logout) {root.removeAttribute(attr('request'));root.removeAttribute(attr('phase'));logout.click()}
      else if (!phase) {closeDialog();root.setAttribute(attr('phase'), 'menu');openProfileMenu()}
    } else if (!dialog) {
      const settings = exact(doc.body, /^(Settings|设置|系统设置)$/i)
      if (settings) {root.setAttribute(attr('phase'), 'opening');settings.click()}
      else if (!phase) {root.setAttribute(attr('phase'), 'menu');openProfileMenu()}
    } else if (!languageRow) {
      if (phase !== 'general') {root.setAttribute(attr('phase'), 'general');exact(dialog, general)?.click()}
    } else if (goal === 'read') {
      if (language) finish()
    } else {
      const split = goal.indexOf(':'), key = goal.slice(0, split), value = goal.slice(split + 1)
      const values: Record<string, RegExp> = {'zh-CN':/^(简体中文|中文|Chinese|中文（简体）|Chinese \(Simplified\))$/i,en:/^(English|英语)$/i,dark:/^(Dark|深色|深色模式)$/i,system:/^(System|跟随系统|系统|Follow system)$/i}
      const regex = values[value], current = key === 'language' ? language : theme
      if (regex && current && regex.test(current)) finish()
      else if (key === 'theme') {const option = regex && exact(dialog, regex);if (option) {root.setAttribute(attr('phase'), 'verify');option.click()}}
      else if (regex && control) {
        // Preserve the previously verified global public-option lookup: the site's
        // language options can be portalled outside its settings modal.
        const option = [...doc.querySelectorAll<HTMLElement>('[role="option"],.ds-select-option,.ds-dropdown-menu-option,.ds-dropdown-menu div,.ds-dropdown-menu span,.ds-select-dropdown div,label,button,[role="button"],.ds-button')].find(el => regex.test(el.textContent?.trim() ?? '') && el !== control && !control.contains(el) && !themeButtons.includes(el))
        if (option) {root.setAttribute(attr('phase'), 'verify');option.click()}
        else if (phase !== 'options' && phase !== 'verify') {
          let trigger = control;const walker = doc.createTreeWalker(control,4);let node:Node|null
          while ((node=walker.nextNode())) if(node.textContent?.trim()===current){trigger=node.parentElement ?? control;break}
          if (phase==='pointer') {root.setAttribute(attr('phase'), 'options');trigger.click()}
          else {root.setAttribute(attr('phase'), 'pointer');trigger.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerType:'mouse',button:0,isPrimary:true}));trigger.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true,button:0}))}
        }
      }
    }
  }
  if (root.hasAttribute('data-dsh-chat-dark-complete') && !root.hasAttribute(attr('restore-language'))) root.setAttribute(attr('restored'),'')
  return {language:root.getAttribute('data-dsh-chat-language'),theme:root.getAttribute('data-dsh-chat-theme'),error:root.getAttribute(attr('error')),pending:root.hasAttribute(attr('request')),restored:root.hasAttribute(attr('restored'))}
}
