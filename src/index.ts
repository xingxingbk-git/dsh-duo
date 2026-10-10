import type { Context } from '@deepseek-ai/cordis'
import { DshChatController } from './server.js'

export const name = 'dsh-chat'

/** Host-half entry. Browser UI is declared separately by the `dsh.client` manifest. */
export const inject = ['deepseekAccount', 'typert']

export function apply(ctx: Context): void { new DshChatController(ctx) }
