/** Adapt only the public conversation title/share row. No message data is read. */
export function adaptWebsiteHeader(doc: Document, content: HTMLElement | undefined, title: string | null, inset: number) {
  if (!content || !title) {doc.querySelectorAll('[data-dsh-chat-header-row],[data-dsh-chat-header-title],[data-dsh-chat-header-share]').forEach(el=>{for(const a of [...el.attributes])if(/^data-dsh-chat-header-(row|title|share)$/.test(a.name))el.removeAttribute(a.name)});return}
  let label = doc.querySelector<HTMLElement>('[data-dsh-chat-header-title]')
  if (label?.textContent?.trim() !== title || [...(label?.children ?? [])].some(el=>el.textContent?.trim()===title)) {
    label?.removeAttribute('data-dsh-chat-header-title')
    label = [...content.querySelectorAll<HTMLElement>('header,div,span,h1,h2')].find(el => {
      const r = el.getBoundingClientRect()
      return r.top >= 0 && r.top <= 48 && r.height > 0 && r.height <= 48
        && !el.querySelector('textarea,[contenteditable="true"],pre,code,p,button,[role="button"]') && el.textContent?.trim() === title
        && ![...el.children].some(child=>child.textContent?.trim()===title)
    }) ?? null
  }
  if (!label) return
  let row: HTMLElement | null = label
  let share: HTMLElement | undefined
  for (let depth = 0; row && row !== content && depth < 7; depth++, row = row.parentElement) {
    const r = row.getBoundingClientRect()
    if (r.top < 0 || r.top > 48 || r.height > 80 || row.querySelector('textarea,[contenteditable="true"],pre,code')) break
    const buttons = [...row.querySelectorAll<HTMLElement>('button,[role="button"]')]
    share = buttons.find(el => /^(Share|分享|Share chat|分享对话)$/i.test(el.getAttribute('aria-label') ?? el.getAttribute('title') ?? ''))
      ?? buttons.find(el => {
        // The website includes two compact navigation buttons in this row.
        // Its share button may have no aria-label; constrain it to the right
        // edge of the bounded top row instead of assuming a single button.
        const b = el.getBoundingClientRect()
        return !el.textContent?.trim() && !!el.querySelector('svg') && b.width >= 20 && b.width <= 56
          && b.height >= 20 && b.height <= 56 && b.top >= 0 && b.top <= 60 && b.right >= r.right - 72
          && !el.closest('[data-dsh-chat-web-chrome]')
      })
      ?? (buttons.length === 1 && buttons[0]?.querySelector('svg') ? buttons[0] : undefined)
    if (share) break
  }
  if (!row || !share) return
  row.setAttribute('data-dsh-chat-header-row','')
  label.setAttribute('data-dsh-chat-header-title','')
  share.setAttribute('data-dsh-chat-header-share','')
  const left = Math.max(24, Math.min(320, Math.ceil(inset)))
  doc.documentElement.style.setProperty('--dsh-chat-title-inset',`${left}px`)
  if (!doc.getElementById('dsh-chat-header-style')) {
    const style=doc.createElement('style');style.id='dsh-chat-header-style'
    style.textContent=`html:not([data-dsh-chat-settings-view]) [data-dsh-chat-header-row]{height:48px!important;min-height:48px!important;margin:0!important;padding:0!important}
      html:not([data-dsh-chat-settings-view]) [data-dsh-chat-header-title]{position:fixed!important;top:0!important;left:var(--dsh-chat-title-inset,24px)!important;height:48px!important;max-width:calc(100% - var(--dsh-chat-title-inset,24px) - 64px)!important;width:calc(100% - var(--dsh-chat-title-inset,24px) - 64px)!important;min-width:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;text-align:left!important;margin:0!important;padding:0!important;transform:none!important;text-overflow:ellipsis!important;white-space:nowrap!important;overflow:hidden!important;z-index:10!important}
      html:not([data-dsh-chat-settings-view]) [data-dsh-chat-header-share]{position:fixed!important;top:10px!important;right:12px!important;left:auto!important;width:28px!important;height:28px!important;margin:0!important;transform:none!important;z-index:11!important}`
    doc.head.append(style)
  }
}
