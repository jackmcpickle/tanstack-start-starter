import { createFileRoute } from '@tanstack/react-router'
import { WaitlistForm } from '#/components/WaitlistForm'
import { getWaitlistConfig } from '#/server/waitlist'

export const Route = createFileRoute('/')({
  loader: () => getWaitlistConfig(),
  component: Home,
})

function Home() {
  const { siteKey } = Route.useLoaderData()
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">TanStack Start starter</h1>
      <p className="mt-4 text-lg text-slate-600">
        Edit <code className="rounded bg-slate-100 px-1.5 py-0.5">src/routes/index.tsx</code> to get
        started.
      </p>
      <WaitlistForm siteKey={siteKey} />
    </main>
  )
}
