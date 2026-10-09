import { Context } from '@deepseek-ai/cordis'
import { Remote, RemoteError, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '@deepseek-ai/dsh-deepseek-account'
import type {} from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-typert-registry'
import { AuthorizationAuthority } from './authorization.js'
import { DUO_HOST_CONTRIBUTION, clientMetadataSchema } from './protocol.js'
import type { AuthorizationState, DuoClientMetadata } from './protocol.js'

/** Fixed official rc.2 ownership key; the event exposes only this key, never its record. */
const ACCOUNT_RECORD_KEY = 'deepseek-account-platform/default'

/** Safe DSH account bridge. The actual chat website is not read or controlled by this Service. */
export class DuoController extends TypertRemoteService {
  static inject = ['deepseekAccount', 'typert']
  readonly authority: AuthorizationAuthority
  constructor(ctx: Context) {
    super(ctx, 'dshDuo')
    this.authority = new AuthorizationAuthority(ctx.deepseekAccount)
    ctx.typert.register(DUO_HOST_CONTRIBUTION)
    ctx.on('deepseek-account/signed-out', () => { this.authority.invalidate() })
    ctx.on('deepseek-account/session-expired', () => { this.authority.invalidate() })
    ctx.on('credentials/record-updated', key => {
      if (String(key) === ACCOUNT_RECORD_KEY) this.authority.grantChanged()
    })
    ctx.effect(() => () => { this.authority.dispose() }, 'dsh-duo safe account observation lifetime')
  }
  @Remote
  async authorization(metadata: DuoClientMetadata, signal: AbortSignal): Promise<AuthorizationState> {
    signal.throwIfAborted()
    try {
      const state = await this.authority.refresh(clientMetadataSchema.parse(metadata))
      signal.throwIfAborted()
      return state
    } catch {
      throw new RemoteError('gateway/internal', '无法确认 DSH 账号状态，请检查 DSH 服务。', {})
    }
  }
  @Remote({ mode: 'stream' })
  async *watchAuthorization(metadata: DuoClientMetadata, signal: AbortSignal): AsyncIterable<AuthorizationState> {
    yield* this.authority.watch(clientMetadataSchema.parse(metadata), signal)
  }
}

declare module '@deepseek-ai/cordis' { interface Context { dshDuo: DuoController } }
