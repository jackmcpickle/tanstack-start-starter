# TanStack Start starter

A small TanStack Start app (React 19, file-based routing) styled with Tailwind CSS v4. It
runs on Cloudflare Workers through the Cloudflare Vite plugin (see `vite.config.ts` and
`wrangler.jsonc`).

- Routes live in `src/routes/`; `src/routes/__root.tsx` is the HTML shell.
- `src/routeTree.gen.ts` is generated. Don't edit it by hand.
- Import from `src/` with the `#/` alias.
- This project uses npm. There is no pnpm lockfile.
- For components, routes and hooks, follow the `elite-react` skill in `.claude/skills/`.

## Waitlist form

The home page has a waitlist form protected by Cloudflare Turnstile
(`src/components/WaitlistForm.tsx` in the browser, server functions in
`src/server/waitlist.ts`). They read, through `env` from `cloudflare:workers`:

- `TURNSTILE_SITE_KEY`, public, from `vars` in `wrangler.jsonc`
- `TURNSTILE_SECRET_KEY`, private, a Worker secret (`wrangler secret put`)

In the local dev server, `.dev.vars` overrides both with Cloudflare's test keys, which always
pass. Declare new bindings in `src/env.d.ts`. The server logs one JSON object per line
(`event`, plus details), which shows up in Workers Logs once deployed.
