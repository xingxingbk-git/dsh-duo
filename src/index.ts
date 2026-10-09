import type { Context } from '@deepseek-ai/cordis'

export const name = 'dsh-duo'

/** Host-half entry. Browser UI is declared separately by the `dsh.client` manifest. */
export function apply(_ctx: Context): void {
  // Host responsibilities (if any) will be added only when the UI/data design needs them.
}
