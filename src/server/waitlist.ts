// Server functions for the waitlist form. They run in the Worker, on Cloudflare and under
// `npm run dev` (through the Cloudflare Vite plugin), and read their settings from `env`:
//   TURNSTILE_SITE_KEY    public, set in wrangler.jsonc vars
//   TURNSTILE_SECRET_KEY  private, set with `wrangler secret put TURNSTILE_SECRET_KEY`
// Locally, .dev.vars overrides both with Cloudflare's always-pass test keys.
import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** One JSON object per line, so Workers Logs can filter on each field. */
function log(level: 'info' | 'warn' | 'error', event: string, fields: Record<string, unknown> = {}) {
  console[level](JSON.stringify({ event, ...fields }))
}

function record(data: unknown): Record<string, unknown> {
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
}

export const getWaitlistConfig = createServerFn({ method: 'GET' }).handler(async () => ({
  siteKey: env.TURNSTILE_SITE_KEY,
}))

export type JoinResult = { ok: true } | { ok: false; error: string }

export const joinWaitlist = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const d = record(data)
    return {
      email: typeof d.email === 'string' ? d.email.trim() : '',
      token: typeof d.token === 'string' ? d.token : '',
    }
  })
  .handler(async ({ data }): Promise<JoinResult> => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { ok: false, error: 'Enter a valid email address.' }
    }
    if (!data.token) {
      log('warn', 'waitlist.rejected', { reason: 'no Turnstile token' })
      return { ok: false, error: 'Complete the spam check first.' }
    }
    if (!env.TURNSTILE_SECRET_KEY) {
      log('error', 'waitlist.misconfigured', { reason: 'TURNSTILE_SECRET_KEY is not set' })
      return { ok: false, error: "The form isn't set up yet. Try again later." }
    }

    const form = new FormData()
    form.append('secret', env.TURNSTILE_SECRET_KEY)
    form.append('response', data.token)
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form })
    const outcome = (await res.json().catch(() => ({}))) as { success?: boolean; 'error-codes'?: string[] }
    if (!outcome.success) {
      log('warn', 'waitlist.rejected', { reason: 'Turnstile rejected the token', errorCodes: outcome['error-codes'] ?? [] })
      return { ok: false, error: 'The spam check failed. Reload the page and try again.' }
    }

    // A real site would store the address. This one only notes that someone joined.
    log('info', 'waitlist.joined', { emailDomain: data.email.split('@')[1] })
    return { ok: true }
  })

/** The browser reports widget errors here, because they never reach the server otherwise. */
export const reportTurnstileError = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const d = record(data)
    return {
      code: typeof d.code === 'string' && /^[0-9a-z]{1,16}$/i.test(d.code) ? d.code : 'unknown',
      hostname: typeof d.hostname === 'string' ? d.hostname.slice(0, 253) : '',
    }
  })
  .handler(async ({ data }) => {
    log('error', 'turnstile.widget_error', { code: data.code, siteKey: env.TURNSTILE_SITE_KEY, hostname: data.hostname })
  })
