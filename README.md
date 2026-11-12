# TanStack Start starter

A minimal [TanStack Start](https://tanstack.com/start) app (React 19, file-based routing)
with Tailwind CSS v4 and strict TypeScript, running on Cloudflare Workers through the
Cloudflare Vite plugin.

Scaffolded with `npx @tanstack/cli create --deployment cloudflare --no-examples`, with the
devtools removed.

## Commands

| Command             | What it does                                       |
| :------------------ | :------------------------------------------------- |
| `npm install`       | Install dependencies                               |
| `npm run dev`       | Start the dev server on `0.0.0.0:3000`             |
| `npm run build`     | Build the client and the Worker into `dist/`       |
| `npm run preview`   | Serve the built app locally                        |
| `npm run typecheck` | Type-check with `tsc`                              |
| `npm run deploy`    | Build, then `wrangler deploy`                      |

## Layout

```text
src/
├── router.tsx             Creates the router
├── routes/__root.tsx      HTML shell, imports the Tailwind stylesheet
├── routes/index.tsx       The / route, with the waitlist form
├── components/WaitlistForm.tsx  The form and its Turnstile widget
├── server/waitlist.ts     Server functions that check Turnstile
├── env.d.ts               Types for the Worker's env (vars and secrets)
├── routeTree.gen.ts       Generated from src/routes on dev and build; don't edit
└── styles.css             @import 'tailwindcss'
vite.config.ts             TanStack Start, Cloudflare, Tailwind and React plugins
wrangler.jsonc             Cloudflare Workers config, including TURNSTILE_SITE_KEY
.dev.vars                  Local values for npm run dev (Turnstile test keys)
.claude/skills/elite-react/  Claude Code skill for working on this app
```

Add a route by adding a file to `src/routes/`, for example `src/routes/about.tsx` for
`/about`. Link between routes with `<Link to="/about">` from `@tanstack/react-router`.

## Deploy

```sh
npm run deploy
```

The waitlist form also needs its Turnstile secret key as a Worker secret:
`npx wrangler secret put TURNSTILE_SECRET_KEY`.

## Workshop preview

The workshop preview gives each port its own address and serves the dev server at `/`,
so links, assets and hot reload work as they do on your machine. The server listens on
`0.0.0.0:3000` so the preview can reach it.
