/** Adapt only the public conversation title/share row. No message or input value is read. */
export function adaptWebsiteHeader(doc: Document, content: HTMLElement | undefined, title: string | null, inset: number) {
  const rowMarker = 'data-dsh-chat-header-row'
  const titleMarker = 'data-dsh-chat-header-title'
  const shareMarker = 'data-dsh-chat-header-share'
  const hostMarker = 'data-dsh-chat-header-title-host'
  const editorMarker = 'data-dsh-chat-header-editor'
  const markers = [rowMarker, titleMarker, shareMarker, hostMarker, editorMarker]
  const editors = 'input:not([type]),input[type="text"],[contenteditable="true"],[contenteditable="plaintext-only"]'
  const clearMarkers = () => {
    for (const marker of markers) doc.querySelectorAll(`[${marker}]`).forEach(el => el.removeAttribute(marker))
  }
  if (!content || !title) { clearMarkers(); return }
  const inTopRow = (el: HTMLElement, maxHeight = 80) => {
    const r = el.getBoundingClientRect()
    return content.contains(el) && r.top >= 0 && r.top <= 48 && r.width > 0 && r.height > 0 && r.height <= maxHeight
      && !el.closest('[hidden],[aria-hidden="true"],[role="dialog"],.ds-modal-content')
  }
  const findEditor = (row: HTMLElement) => {
    // The confirmed top row is the boundary. Never search inputs in the
    // composer, sign-in page, navigation, or settings; never read their values.
    const candidates = [...row.querySelectorAll<HTMLElement>(editors)].filter(el => inTopRow(el, 48)
      && !el.closest('[role="search"],[data-dsh-chat-navigation],[data-dsh-chat-web-chrome]')
      && !/search|搜索/i.test(el.getAttribute('aria-label') ?? ''))
    const focused = candidates.find(el => el === doc.activeElement || (doc.activeElement && el.contains(doc.activeElement)))
    return focused ?? (candidates.length === 1 ? candidates[0] : undefined)
  }
  const findShare = (row: HTMLElement) => {
    const r = row.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    const buttons = [...row.querySelectorAll<HTMLElement>('button,[role="button"]')]
    return buttons.find(el => /^(Share|分享|Share chat|分享对话)$/i.test(el.getAttribute('aria-label') ?? el.getAttribute('title') ?? ''))
      ?? buttons.find(el => {
        const b = el.getBoundingClientRect()
        return !el.textContent?.trim() && !!el.querySelector('svg') && b.width >= 20 && b.width <= 56
          && b.height >= 20 && b.height <= 56 && b.top >= 0 && b.top <= 60
          && r.width >= contentRect.width * 0.6 && b.right >= contentRect.right - 72
          && !el.closest('[data-dsh-chat-web-chrome]')
      })
  }
  let row = doc.querySelector<HTMLElement>(`[${rowMarker}]`)
  if (row && (!inTopRow(row) || row.querySelector('textarea,pre,code'))) row = null
  let share = row ? findShare(row) : undefined
  let editor = row && share ? findEditor(row) : undefined
  let label: HTMLElement | undefined

  if (!editor) {
    label = [...content.querySelectorAll<HTMLElement>(`[${titleMarker}],header,div,span,h1,h2`)].find(el => {
      if (!inTopRow(el, 48) || el.matches(editors) || el.querySelector(`${editors},textarea,pre,code,p,button,[role="button"]`)) return false
      return el.textContent?.trim() === title && ![...el.children].some(child => child.textContent?.trim() === title)
    })
    if (label) {
      row = label
      share = undefined
      for (let depth = 0; row && row !== content && depth < 7; depth++, row = row.parentElement) {
        if (!inTopRow(row) || row.querySelector('textarea,pre,code')) break
        share = findShare(row)
        if (share) break
      }
    } else {
      // React can replace the whole title branch. Recover only from a bounded
      // top row containing the same public share control and a title editor.
      row = null
      share = undefined
      for (const button of content.querySelectorAll<HTMLElement>('button,[role="button"]')) {
        if (!inTopRow(button, 56) || !button.querySelector('svg')) continue
        for (let parent = button.parentElement, depth = 0; parent && parent !== content && depth < 7; parent = parent.parentElement, depth++) {
          if (!inTopRow(parent) || parent.querySelector('textarea,pre,code')) break
          if (findShare(parent) !== button) continue
          const candidate = findEditor(parent)
          if (candidate) { row = parent; share = button; editor = candidate; break }
        }
        if (editor) break
      }
    }
  }
  const target = editor ?? label
  if (!row || !share || !target) { clearMarkers(); return }

  // Keep the highest title-only wrapper in place. Replacing a text child with
  // an input then inherits the same position before the next adapter pass.
  let host = target
  for (let parent = host.parentElement, depth = 0; parent && parent !== row && depth < 7; parent = parent.parentElement, depth++) {
    if (!inTopRow(parent) || parent.contains(share) || parent.querySelector('button,[role="button"],textarea,pre,code,p')) break
    if ([...parent.querySelectorAll(editors)].some(el => el !== editor)) break
    host = parent
  }
  const targets: (HTMLElement | undefined)[] = [row, label, share, host, editor]
  markers.forEach((marker, index) => {
    const element = targets[index]
    doc.querySelectorAll(`[${marker}]`).forEach(el => { if (el !== element) el.removeAttribute(marker) })
    if (element && !element.hasAttribute(marker)) element.setAttribute(marker, '')
  })
  const left = Math.max(24, Math.min(320, Math.ceil(inset)))
  doc.documentElement.style.setProperty('--dsh-chat-title-inset', `${left}px`)
  const scope = 'html:not([data-dsh-chat-settings-view])'
  const hostSelector = `${scope} [${hostMarker}]`
  const editorSelector = `${scope} [${editorMarker}],${hostSelector} :is(${editors})`
  const styleText = `
    ${scope} [${rowMarker}]{box-sizing:border-box!important;height:48px!important;min-height:48px!important;max-height:48px!important;flex-shrink:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}
    ${hostSelector}{position:fixed!important;top:0!important;right:auto!important;bottom:auto!important;left:var(--dsh-chat-title-inset,24px)!important;box-sizing:border-box!important;height:48px!important;min-height:0!important;max-height:48px!important;width:auto!important;max-width:calc(100% - var(--dsh-chat-title-inset,24px) - 64px)!important;min-width:0!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;line-height:28px!important;flex:none!important;text-align:left!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;outline:0!important;box-shadow:none!important;transform:none!important;white-space:nowrap!important;z-index:10!important}
    ${hostSelector} :is(div,span,label){min-width:0!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;outline:0!important;box-shadow:none!important;text-align:left!important;transform:none!important}
    ${scope} [${titleMarker}]:not([${hostMarker}]){position:static!important;height:auto!important;min-height:0!important;max-height:48px!important;width:auto!important;max-width:100%!important;min-width:0!important;display:block!important;line-height:28px!important;flex:0 1 auto!important;margin:0!important;padding:0!important;text-align:left!important;text-overflow:ellipsis!important;white-space:nowrap!important;overflow:hidden!important}
    ${scope} [${titleMarker}][${hostMarker}]{display:block!important;line-height:48px!important;text-overflow:ellipsis!important;overflow:hidden!important}
    ${editorSelector}{box-sizing:border-box!important;height:28px!important;min-height:28px!important;max-height:28px!important;width:min(360px,calc(100vw - var(--dsh-chat-title-inset,24px) - 64px))!important;min-width:0!important;max-width:100%!important;font:inherit!important;line-height:26px!important;color:inherit!important;margin:0!important;padding:0!important;border:0!important;border-bottom:1px solid #7d98ed!important;border-radius:0!important;background:transparent!important;outline:0!important;box-shadow:none!important;text-align:left!important;transform:none!important}
    ${scope} [${editorMarker}][${hostMarker}]{top:10px!important;display:block!important}
    ${scope} [${shareMarker}]{position:fixed!important;top:10px!important;right:12px!important;bottom:auto!important;left:auto!important;box-sizing:border-box!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;max-width:28px!important;max-height:28px!important;margin:0!important;transform:none!important;z-index:11!important}
  `
  let style = doc.getElementById('dsh-chat-header-style')
  if (!style) {
    style = doc.createElement('style')
    style.id = 'dsh-chat-header-style'
    doc.head.append(style)
  }
  if (style.textContent !== styleText) style.textContent = styleText
}
