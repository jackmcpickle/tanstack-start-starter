// The Worker's bindings, from wrangler.jsonc vars and Worker secrets.
declare module 'cloudflare:workers' {
  export const env: {
    TURNSTILE_SITE_KEY: string
    TURNSTILE_SECRET_KEY?: string
  }
}
