import assert from 'node:assert/strict'
import test from 'node:test'
import { AuthorizationAuthority } from '../src/authorization.js'
import type { AccountReader } from '../src/authorization.js'
import { DUO_DESCRIPTORS, authorizationSchema, clientMetadataSchema } from '../src/protocol.js'

const metadata = { version: '0.2.0-rc.2', locale: 'zh-CN', timezoneOffsetSeconds: 28_800 }
type Profile = Awaited<ReturnType<AccountReader['getProfile']>>
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}
class AccountFixture implements AccountReader {
  status: 'signed-out' | 'credential-stored' = 'credential-stored'
  profile: Profile = { status: 'ready', value: { id: 'account-a' } }
  getState = async () => ({ status: this.status })
  getProfile = async (_metadata: typeof metadata): Promise<Profile> => this.profile
  async *watch(signal: AbortSignal) {
    yield { status: this.status }
    if (!signal.aborted) await new Promise<void>(resolve => { signal.addEventListener('abort', () => { resolve() }, { once: true }) })
  }
}
function authority(account = new AccountFixture()) {
  let epoch = 0
  return { account, auth: new AuthorizationAuthority(account, () => `epoch-${++epoch}`) }
}

test('stored credentials alone never enable CHAT; a ready stable profile enables it', async t => {
  const { account, auth } = authority()
  t.after(() => { auth.dispose() })
  assert.equal(auth.getSnapshot().status, 'pending')
  account.profile = { status: 'failed' }
  const unconfirmed = await auth.refresh(metadata)
  assert.equal(unconfirmed.status, 'unavailable')
  assert.equal(unconfirmed.accountId, null)
  account.profile = { status: 'ready', value: { id: null } }
  assert.equal((await auth.refresh(metadata)).status, 'unavailable')
  account.profile = { status: 'ready', value: { id: 'account-a' } }
  const confirmed = await auth.refresh(metadata)
  assert.equal(confirmed.status, 'authorized')
  assert.equal(confirmed.accountId, 'account-a')
  assert.equal(confirmed.error, null)
})

test('same-account refresh and ordinary network failure preserve its authorized generation', async t => {
  const { account, auth } = authority()
  t.after(() => { auth.dispose() })
  const initial = await auth.refresh(metadata)
  assert.deepEqual(await auth.refresh(metadata), initial)
  account.getProfile = async () => { throw new Error('fixture offline') }
  const failed = await auth.refresh(metadata)
  assert.equal(failed.status, 'authorized')
  assert.equal(failed.accountId, initial.accountId)
  assert.equal(failed.epoch, initial.epoch)
  assert.equal(failed.error, 'account-profile-unavailable')
  account.getProfile = async () => account.profile
  assert.deepEqual(await auth.refresh(metadata), initial)
})

test('confirmed sign-out publishes immediately and fences a delayed valid profile', async t => {
  const { account, auth } = authority()
  t.after(() => { auth.dispose() })
  const initial = await auth.refresh(metadata)
  const started = deferred<void>()
  const delayed = deferred<Profile>()
  account.getProfile = async () => { started.resolve(); return delayed.promise }
  const refreshing = auth.refresh(metadata)
  await started.promise
  let notification = auth.getSnapshot()
  const unsubscribe = auth.subscribe(() => { notification = auth.getSnapshot() })
  account.status = 'signed-out'
  auth.invalidate()
  assert.equal(notification.status, 'unauthorized')
  assert.equal(notification.accountId, null)
  assert.notEqual(notification.epoch, initial.epoch)
  delayed.resolve({ status: 'ready', value: { id: 'account-a' } })
  assert.equal((await refreshing).status, 'unauthorized')
  assert.equal(auth.getSnapshot().status, 'unauthorized')
  unsubscribe()
})

test('grant replacement closes the gate, changes epoch, and discards the old account response', async t => {
  const { account, auth } = authority()
  t.after(() => { auth.dispose() })
  const initial = await auth.refresh(metadata)
  const started = deferred<void>()
  const oldProfile = deferred<Profile>()
  account.getProfile = async () => { started.resolve(); return oldProfile.promise }
  const oldRefresh = auth.refresh(metadata)
  await started.promise
  account.profile = { status: 'ready', value: { id: 'account-b' } }
  account.getProfile = async () => account.profile
  auth.grantChanged()
  const pending = auth.getSnapshot()
  assert.equal(pending.status, 'pending')
  assert.equal(pending.accountId, null)
  assert.notEqual(pending.epoch, initial.epoch)
  const replacement = await auth.refresh(metadata)
  assert.equal(replacement.status, 'authorized')
  assert.equal(replacement.accountId, 'account-b')
  assert.notEqual(replacement.epoch, initial.epoch)
  oldProfile.resolve({ status: 'ready', value: { id: 'account-a' } })
  await oldRefresh
  assert.deepEqual(auth.getSnapshot(), replacement)
})

test('same account reauthorization receives a new epoch while ordinary refresh does not', async t => {
  const { auth } = authority()
  t.after(() => { auth.dispose() })
  const initial = await auth.refresh(metadata)
  auth.grantChanged()
  const renewed = await auth.refresh(metadata)
  assert.equal(renewed.accountId, initial.accountId)
  assert.notEqual(renewed.epoch, initial.epoch)
  assert.deepEqual(await auth.refresh(metadata), renewed)
})

test('a safe state read completed before sign-out cannot reenable authorization afterward', async t => {
  const { account, auth } = authority()
  t.after(() => { auth.dispose() })
  await auth.refresh(metadata)
  const started = deferred<void>()
  const delayed = deferred<{ status: 'credential-stored' }>()
  account.getState = async () => { started.resolve(); return delayed.promise }
  const refresh = auth.refresh(metadata)
  await started.promise
  auth.invalidate()
  delayed.resolve({ status: 'credential-stored' })
  await refresh
  assert.equal(auth.getSnapshot().status, 'unauthorized')
})

test('authorization stream starts closed, publishes confirmation and logout, then aborts cleanly', async t => {
  const { account, auth } = authority()
  t.after(() => { auth.dispose() })
  const delayed = deferred<Profile>()
  account.getProfile = async () => delayed.promise
  const controller = new AbortController()
  const iterator = auth.watch(metadata, controller.signal)[Symbol.asyncIterator]()
  const first = await iterator.next()
  assert.equal(first.done, false)
  assert.equal(first.value?.status, 'pending')
  const waiting = iterator.next()
  delayed.resolve({ status: 'ready', value: { id: 'account-a' } })
  assert.equal((await waiting).value?.status, 'authorized')
  auth.invalidate()
  assert.equal((await iterator.next()).value?.status, 'unauthorized')
  const end = iterator.next()
  controller.abort()
  assert.equal((await end).done, true)
})

test('the public descriptor surface has only authorization and strict credential-free payloads', () => {
  assert.deepEqual(DUO_DESCRIPTORS.map(item => item.method), ['authorization', 'watchAuthorization'])
  assert.ok(DUO_DESCRIPTORS.every(item => item.parameters.every(parameter => parameter.codec.mode === 'strict')))
  assert.throws(() => clientMetadataSchema.parse({ ...metadata, token: 'fixture-only' }))
  assert.throws(() => authorizationSchema.parse({
    status: 'authorized', accountId: 'account-a', epoch: 'epoch-1', error: null, cookie: 'fixture-only',
  }))
})
