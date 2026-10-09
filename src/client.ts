import type { Context } from '@deepseek-ai/cordis'

// Type-only imports load the public client contracts without bundling them into
// the lazy-CJS browser artifact. Runtime ordering is declared in package.json.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'

export const name = 'dsh-duo'
export const inject = ['slots', 'layout']

/** Browser-half entry. UI contributions will be registered through public Slots. */
export function apply(_ctx: Context): void {
  // Next implementation milestone: register the mode switcher and Chat panel.
}
