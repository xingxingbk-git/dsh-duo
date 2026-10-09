import { z } from 'zod'
import type {
  InvocationDescriptor, RemoteResult, RemoteStreamHandle, TypertRemoteContribution,
} from '@deepseek-ai/dsh-typert-protocol'
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry'

/** Credential-free identity of the UI making the official DSH account operation. */
export interface DuoClientMetadata {
  version: string
  locale: string
  timezoneOffsetSeconds: number
}

/** DSH account authorization only; this does not describe the separate chat website login. */
export interface AuthorizationState {
  status: 'pending' | 'authorized' | 'unauthorized' | 'unavailable'
  accountId: string | null
  /** Host-issued generation fence; it is an identifier, never an account credential. */
  epoch: string
  error: string | null
}

const identifier = z.string().min(1).max(512)
export const clientMetadataSchema = z.strictObject({
  version: z.string().min(1).max(100), locale: z.string().min(1).max(100),
  timezoneOffsetSeconds: z.number().int().min(-86_400).max(86_400),
}) satisfies z.ZodType<DuoClientMetadata>
export const authorizationSchema = z.strictObject({
  status: z.enum(['pending', 'authorized', 'unauthorized', 'unavailable']),
  accountId: identifier.nullable(), epoch: identifier, error: z.string().max(100).nullable(),
}) satisfies z.ZodType<AuthorizationState>

const strict = (name: string, schema: z.ZodType) => ({
  mode: 'strict' as const, typeSymbol: `dsh-duo#${name}`, create: () => schema,
})
const descriptor = (method: string, stream = false): InvocationDescriptor => ({
  id: `dsh-duo#dshDuo/${method}`, service: 'dshDuo', namespace: 'dshDuo', method,
  invocation: { kind: 'direct' },
  parameters: [{ name: 'metadata', wire: 'metadata', source: 'json', codec: strict('DuoClientMetadata', clientMetadataSchema) }],
  cancellation: { parameter: 'signal' }, result: strict('AuthorizationState', authorizationSchema),
  ...(stream ? { mode: 'stream' as const } : {}),
})

/** Explicit strict descriptors use the public registry; no source-mode method discovery. */
export const DUO_DESCRIPTORS: readonly InvocationDescriptor[] = [
  descriptor('authorization'), descriptor('watchAuthorization', true),
]
export const DUO_REMOTE_CONTRIBUTION: TypertRemoteContribution = {
  package: 'dsh-duo', descriptors: DUO_DESCRIPTORS,
}
export const DUO_HOST_CONTRIBUTION: TypertContribution = {
  package: 'dsh-duo', face: 'host', schemas: [],
  model: { services: [], events: [], objects: [] }, invocations: DUO_DESCRIPTORS,
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteMap {
    'dshDuo/authorization': (metadata: DuoClientMetadata, signal?: AbortSignal) => Promise<RemoteResult<AuthorizationState>>
    'dshDuo/watchAuthorization': (metadata: DuoClientMetadata, signal?: AbortSignal) => RemoteStreamHandle<AuthorizationState, never>
  }
  interface TypertRemoteNamespaceMap {
    dshDuo: import('@deepseek-ai/dsh-typert-protocol').TypertRemoteNamespace<'dshDuo'>
  }
}
