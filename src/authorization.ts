import { randomUUID } from 'node:crypto'
import type { AuthorizationState, DuoClientMetadata } from './protocol.js'

/** Only the official credential-free surface is accepted by this adapter. */
export interface AccountReader {
  getState(): Promise<{ status: 'signed-out' | 'credential-stored' }>
  getProfile(metadata: DuoClientMetadata): Promise<
    { status: 'ready'; value: { id: string | null } } | { status: 'failed' } | null
  >
  watch(signal: AbortSignal): AsyncIterable<{ status: 'signed-out' | 'credential-stored' }>
}

/** Host authority owns the account generation; a Client cannot choose or reopen it. */
export class AuthorizationAuthority {
  private state: AuthorizationState
  private readonly lifetime = new AbortController()
  private readonly listeners = new Set<() => void>()
  private revision = 0
  private started = false
  private closed = false
  private metadata: DuoClientMetadata | undefined
  private refreshing: { revision: number; promise: Promise<AuthorizationState> } | undefined

  constructor(private readonly account: AccountReader, private readonly issueEpoch: () => string = randomUUID) {
    this.state = { status: 'pending', accountId: null, epoch: issueEpoch(), error: null }
  }

  getSnapshot(): AuthorizationState { return { ...this.state } }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  private publish(next: AuthorizationState): void {
    this.state = next
    for (const listener of this.listeners) listener()
  }
  private unavailable(error: string): void {
    this.publish(this.state.status === 'authorized'
      ? { ...this.state, error }
      : { status: 'unavailable', accountId: null, epoch: this.state.epoch, error })
  }
  /** DSH signed-out/expiry is synchronous: UI observers run before any network refresh. */
  invalidate(): void {
    this.revision++
    const alreadyClosed = this.state.status === 'unauthorized'
    this.publish({ status: 'unauthorized', accountId: null,
      epoch: alreadyClosed ? this.state.epoch : this.issueEpoch(), error: null })
  }
  /** Public credential-record change supplies only a key; no credential record is read. */
  grantChanged(): void {
    this.revision++
    this.publish({ status: 'pending', accountId: null, epoch: this.issueEpoch(), error: null })
    if (this.metadata && !this.closed) void this.refresh(this.metadata).catch(() => undefined)
  }
  private start(metadata: DuoClientMetadata): void {
    this.metadata = { ...metadata }
    if (this.started || this.closed) return
    this.started = true
    void (async () => {
      for await (const view of this.account.watch(this.lifetime.signal)) {
        if (this.closed) break
        if (view.status === 'signed-out') this.invalidate()
        // Re-read the current projection to fence snapshots produced before a sign-out.
        else void this.refresh(this.metadata!).catch(() => undefined)
      }
      if (!this.closed) this.unavailable('account-watch-ended')
    })().catch(() => { if (!this.closed) this.unavailable('account-watch-unavailable') })
  }
  refresh(metadata: DuoClientMetadata): Promise<AuthorizationState> {
    this.start(metadata)
    if (this.closed) return Promise.reject(new Error('Account observation is disposed.'))
    if (this.refreshing?.revision === this.revision) return this.refreshing.promise
    const promise = this.refreshOnce(metadata)
    const current = { revision: this.revision, promise }
    this.refreshing = current
    void promise.finally(() => { if (this.refreshing === current) this.refreshing = undefined }).catch(() => undefined)
    return promise
  }
  private async refreshOnce(metadata: DuoClientMetadata): Promise<AuthorizationState> {
    const beforeRead = this.revision
    let view: Awaited<ReturnType<AccountReader['getState']>>
    try { view = await this.account.getState() }
    catch {
      if (beforeRead === this.revision) this.unavailable('account-state-unavailable')
      return this.getSnapshot()
    }
    if (beforeRead !== this.revision || this.closed) return this.getSnapshot()
    if (view.status === 'signed-out') {
      this.invalidate()
      return this.getSnapshot()
    }
    const generation = this.revision
    let profile: Awaited<ReturnType<AccountReader['getProfile']>>
    try { profile = await this.account.getProfile(metadata) }
    catch { profile = { status: 'failed' } }
    if (generation !== this.revision || this.closed) return this.getSnapshot()
    if (profile?.status !== 'ready' || !profile.value.id) {
      if (profile === null) {
        // Official null means grant absent/changed. Read its current safe state instead of guessing logout.
        let current: Awaited<ReturnType<AccountReader['getState']>> | undefined
        try { current = await this.account.getState() } catch { /* Safe failure stays unavailable. */ }
        if (generation !== this.revision || this.closed) return this.getSnapshot()
        if (current?.status === 'signed-out') { this.invalidate(); return this.getSnapshot() }
      }
      this.unavailable(profile?.status === 'ready' ? 'account-identity-unavailable' : 'account-profile-unavailable')
      return this.getSnapshot()
    }
    const sameAccount = this.state.status === 'authorized' && this.state.accountId === profile.value.id
    this.publish({ status: 'authorized', accountId: profile.value.id,
      epoch: sameAccount ? this.state.epoch : this.issueEpoch(), error: null })
    return this.getSnapshot()
  }

  async *watch(metadata: DuoClientMetadata, signal: AbortSignal): AsyncIterable<AuthorizationState> {
    this.start(metadata)
    let dirty = true
    let wake: (() => void) | undefined
    const changed = () => { dirty = true; wake?.() }
    const unsubscribe = this.subscribe(changed)
    signal.addEventListener('abort', changed, { once: true })
    this.lifetime.signal.addEventListener('abort', changed, { once: true })
    void this.refresh(metadata).catch(() => undefined)
    try {
      while (!signal.aborted && !this.closed) {
        if (dirty) { dirty = false; yield this.getSnapshot(); continue }
        await new Promise<void>(resolve => { wake = resolve })
      }
    } finally {
      unsubscribe()
      signal.removeEventListener('abort', changed)
      this.lifetime.signal.removeEventListener('abort', changed)
    }
  }
  dispose(): void {
    if (this.closed) return
    this.closed = true
    this.invalidate()
    this.lifetime.abort()
    this.listeners.clear()
  }
}
