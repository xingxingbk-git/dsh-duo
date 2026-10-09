import type { Context } from '@deepseek-ai/cordis'
import { DuoController } from './server.js'

export const name = 'dsh-duo'

/** Host-half entry. Browser UI is declared separately by the `dsh.client` manifest. */
export const inject = ['deepseekAccount', 'typert']

export function apply(ctx: Context): void { new DuoController(ctx) }
