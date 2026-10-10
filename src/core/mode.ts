export type Mode = 'harness' | 'chat'

export interface ModeAuthorization {
  status: 'pending' | 'authorized' | 'unauthorized' | 'unavailable'
  accountId: string | null
  epoch: string
  error: string | null
}

export interface ModeState {
  mode: Mode
  authorization: ModeAuthorization
  compatibilityEnabled: boolean
  error: string | null
}

/** Only public navigation and effect-scoped UI registration cross this boundary. */
export interface NavigationPort {
  readPanel(): string | null
  selectPanel(panel: string | null): void
  mountChatNavigation(): () => void
  cancelAccount(accountId: string): void
}

export const CHAT_PANEL = 'dsh-chat.chat'

/** Account validity and compatibility are checked for every entry, including direct navigation. */
export class ModeController {
  private state: ModeState
  private readonly listeners = new Set<() => void>()
  private originalPanel: string | null = null
  private unmountChat: (() => void) | null = null
  private transitioning = false
  private disposed = false
  private lastPanel: string | null

  constructor(private readonly port: NavigationPort, compatibilityEnabled: boolean) {
    this.lastPanel = port.readPanel()
    this.state = {
      mode: 'harness', compatibilityEnabled, error: null,
      authorization: { status: 'pending', accountId: null, epoch: '', error: null },
    }
  }

  getSnapshot = (): ModeState => this.state
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  canEnter(): boolean {
    return !this.disposed && this.state.compatibilityEnabled
      && this.state.authorization.status === 'authorized'
      && Boolean(this.state.authorization.accountId)
  }

  updateAuthorization(authorization: ModeAuthorization): void {
    if (this.disposed) return
    const prior = this.state.authorization
    const continuous = authorization.status === 'authorized'
      && prior.status === 'authorized'
      && authorization.accountId === prior.accountId
      && authorization.epoch === prior.epoch
    // Close the gate before restoring UI or cancelling. A synchronous observer
    // cannot send with the previous account during this transition.
    this.state = { ...this.state, authorization: continuous ? authorization : {
      status: 'pending', accountId: null, epoch: authorization.epoch, error: authorization.error,
    } }
    if (!continuous && (this.state.mode === 'chat' || prior.status === 'authorized')) {
      this.leave(true)
      if (prior.accountId) this.port.cancelAccount(prior.accountId)
    }
    this.state = { ...this.state, authorization }
    this.publish()
  }

  select(mode: Mode): boolean {
    if (this.disposed) return false
    if (mode === 'harness') {
      this.leave(true)
      return true
    }
    if (!this.canEnter()) return false
    if (this.state.mode === 'chat') return true
    return this.enter(this.port.readPanel())
  }

  private enter(originalPanel: string | null): boolean {
    this.originalPanel = originalPanel === CHAT_PANEL ? null : originalPanel
    this.transitioning = true
    try {
      this.unmountChat = this.port.mountChatNavigation()
      this.state = { ...this.state, mode: 'chat', error: null }
      this.port.selectPanel(CHAT_PANEL)
      this.publish()
      return true
    } catch (error) {
      this.cleanupNavigation()
      this.state = { ...this.state, mode: 'harness', error: 'CHAT 界面加载失败，已恢复 Harness。' }
      try { this.port.selectPanel(this.originalPanel) } catch { /* Original panel may have unloaded. */ }
      this.publish()
      return false
    } finally {
      this.transitioning = false
    }
  }

  /** The original DSH navigation remains authoritative; never overwrite its state. */
  observePanel(panel: string | null): void {
    const previous = this.lastPanel
    this.lastPanel = panel
    if (this.disposed || this.transitioning) return
    if (panel === CHAT_PANEL && this.state.mode !== 'chat') {
      // Selecting the registered main key directly must not bypass our gate.
      if (!this.canEnter() || !this.enter(previous)) {
        this.transitioning = true
        try { this.port.selectPanel(previous === CHAT_PANEL ? null : previous) } finally { this.transitioning = false }
      }
    } else if (panel !== CHAT_PANEL && this.state.mode === 'chat') {
      this.leave(false)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.leave(true)
    this.disposed = true
    if (this.state.authorization.accountId) this.port.cancelAccount(this.state.authorization.accountId)
    this.listeners.clear()
  }

  private leave(restore: boolean): void {
    if (this.state.mode !== 'chat') return
    this.transitioning = true
    this.state = { ...this.state, mode: 'harness' }
    // Recover the original panel while our own panel still exists. Do not
    // rewrite rightbar visibility/width/tab/fullscreen or a Harness Session.
    try {
      if (restore) this.port.selectPanel(this.originalPanel)
    } catch {
      this.state = { ...this.state, error: '原面板已被移除，已返回 Harness 对话区。' }
      this.port.selectPanel(null)
    } finally {
      this.cleanupNavigation()
      this.transitioning = false
      this.publish()
    }
  }

  private cleanupNavigation(): void {
    const cleanup = this.unmountChat
    this.unmountChat = null
    cleanup?.()
  }

  private publish(): void {
    for (const listener of this.listeners) listener()
  }
}
