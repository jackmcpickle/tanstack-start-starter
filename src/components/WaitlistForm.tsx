import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { joinWaitlist, reportTurnstileError } from '#/server/waitlist'

// The waitlist form: shows a Cloudflare Turnstile widget, then sends the email address and
// the widget's token to the joinWaitlist server function.

interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': (code: string) => boolean
}

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, options: TurnstileOptions) => string
      reset: (id?: string) => void
      remove: (id: string) => void
    }
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadTurnstile(): Promise<NonNullable<Window['turnstile']>> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile)
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = SCRIPT
      script.async = true
      document.head.append(script)
    }
    script.addEventListener('load', () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load')),
    )
    script.addEventListener('error', () => reject(new Error('Turnstile did not load')))
  })
}

export function WaitlistForm({ siteKey }: { siteKey: string }) {
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | undefined>(undefined)
  const [token, setToken] = useState('')
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    let reported = false
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !widgetRef.current) return
        widgetId.current = turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          callback: setToken,
          'expired-callback': () => setToken(''),
          'error-callback': (code) => {
            setToken('')
            setStatus('The spam check could not load, so the form is switched off for now.')
            if (!reported) {
              reported = true
              void reportTurnstileError({ data: { code, hostname: location.hostname } })
            }
            return true
          },
        })
      })
      .catch(() => setStatus('The spam check could not load. Check your connection and reload the page.'))
    return () => {
      cancelled = true
      if (widgetId.current) window.turnstile?.remove(widgetId.current)
      widgetId.current = undefined
    }
  }, [siteKey])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    setPending(true)
    setStatus('Joining…')
    const result = await joinWaitlist({ data: { email: new FormData(form).get('email'), token } }).catch(() => null)
    if (result?.ok) {
      form.reset()
      setStatus("Thanks! You're on the list.")
    } else {
      setStatus(result?.error ?? 'Something went wrong. Try again in a moment.')
    }
    // Each token works once, so get a fresh one for the next try.
    setToken('')
    window.turnstile?.reset(widgetId.current)
    setPending(false)
  }

  return (
    <section className="mt-12 rounded-xl border border-slate-200 p-6" aria-labelledby="waitlist-heading">
      <h2 id="waitlist-heading" className="text-xl font-semibold">
        Join the waitlist
      </h2>
      <p className="mt-1 text-slate-600">Leave your email and we'll tell you when it's ready.</p>
      <form className="mt-4 flex flex-col gap-3" noValidate onSubmit={onSubmit}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-md border border-slate-300 px-3 py-2 text-base font-normal"
          />
        </label>
        <div ref={widgetRef} />
        <button
          type="submit"
          disabled={!token || pending}
          className="self-start rounded-md bg-slate-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          Join
        </button>
        <p role="status" className="text-sm text-slate-600">
          {status}
        </p>
      </form>
    </section>
  )
}
