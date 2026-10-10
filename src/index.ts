import schema from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import type { Context } from '@deepseek-ai/cordis'
import { DshChatController } from './server.js'

export const Config = schema.object({
  language: schema.union(['', 'system', 'zh-CN', 'en']).default('zh-CN').volatile(),
})

export const name = 'dsh-chat'

/** Host-half entry. Browser UI is declared separately by the `dsh.client` manifest. */
export const inject = ['deepseekAccount', 'typert']

export function apply(ctx: Context): void { new DshChatController(ctx)
  ctx.inject(['settings'], child => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
}
