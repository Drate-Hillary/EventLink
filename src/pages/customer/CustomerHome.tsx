import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, CalendarPlus, MessageSquare, SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VendorCard } from '../../components/providers/VendorCard'
import { Avatar, EmptyState, PageHeader, SelectInput } from '../../components/ui'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { photo } from '../../data/images'
import { CUSTOMER_NAME, useStore } from '../../features/store'
import { dateLong, daysUntil, money, timeShort } from '../../utils/format'
import { CustomerBookings, CustomerBudget, CustomerEvents, CustomerMessages } from './Customer'

const jump = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  history.replaceState(null, '', `#${id}`)
}

function Block({ id, children }: { id: string; children: ReactNode }) {
  return <section id={id} className="scroll-mt-32">{children}</section>
}

function FindProviders() {
  const { vendors: allVendors, categories } = useStore()
  const vendors = useMemo(() => allVendors.filter((v) => v.verified), [allVendors])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [verified, setVerified] = useState(false)

  const results = useMemo(() => vendors.filter((v) =>
    (!category || v.category === category) &&
    (!location || v.areas.some((a) => a.toLowerCase().includes(location.toLowerCase()))) &&
    (!q || v.name.toLowerCase().includes(q.toLowerCase())) &&
    (!verified || v.verified)).sort((a, b) => b.rating - a.rating), [vendors, q, category, location, verified])

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (location) params.set('location', location)

  return (
    <>
      <PageHeader section title="Find providers" subtitle="Search by service and location, then open a profile to request a quote."
        action={<Link to={`/vendors?${params}`} className={buttonVariants({ variant: 'outline' })}>Open full search <ArrowRight className="h-4 w-4" /></Link>} />
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-3xl border bg-ivory p-3 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_auto]">
        <Input aria-label="Business name" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} className="bg-white" />
        <SelectInput aria-label="Service" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All services</option>{categories.filter((c) => c.active).map((c) => <option key={c.id}>{c.name}</option>)}
        </SelectInput>
        <Input aria-label="Location" placeholder="City" value={location} onChange={(e) => setLocation(e.target.value)} className="bg-white" />
        <Button variant={verified ? 'default' : 'outline'} aria-pressed={verified} onClick={() => setVerified((v) => !v)}>Verified only</Button>
      </div>
      {results.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{results.slice(0, 6).map((v) => <VendorCard key={v.id} vendor={v} />)}</div>
      ) : (
        <EmptyState icon={SearchX} title="No providers match" text="Try another city or remove a filter." />
      )}
    </>
  )
}

/** Right-hand rail: quick glance at budget and the latest conversations. */
function Rail() {
  const { events, allocations, threads, vendors } = useStore()
  const next = [...events].sort((a, b) => a.date.localeCompare(b.date)).find((e) => daysUntil(e.date) >= 0) ?? events[0]
  const used = next ? Object.values(allocations[next.id] ?? {}).reduce((n, v) => n + (v ?? 0), 0) : 0
  const pct = next && next.budget ? Math.min(100, Math.round((used / next.budget) * 100)) : 0
  const mine = threads.filter((t) => t.customer === CUSTOMER_NAME).slice(0, 3)

  return (
    <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start" aria-label="Summary">
      {next && (
        <div className="rounded-3xl border bg-card p-5 shadow-card">
          <p className="text-sm font-semibold text-slate-600">Budget for {next.name}</p>
          <p className="mt-2 text-3xl font-extrabold">{money(used)}<span className="text-base font-semibold text-slate-500"> / {money(next.budget)}</span></p>
          <div className="mt-3 h-2 rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget planned">
            <div className="h-full rounded-full bg-black transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-600">{pct}% planned · {money(Math.max(0, next.budget - used))} left</p>
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => jump('budget')}>Open budget planner</Button>
        </div>
      )}
      <div className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent messages</h2>
          <button className="text-sm font-semibold hover:underline" onClick={() => jump('messages')}>View all</button>
        </div>
        {mine.length === 0 ? <p className="text-sm text-slate-600">No conversations yet.</p> : (
          <ul className="space-y-1">
            {mine.map((t) => {
              const v = vendors.find((x) => x.id === t.vendorId)
              const last = t.messages[t.messages.length - 1]
              return (
                <li key={t.id}>
                  <button onClick={() => jump('messages')} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-accent">
                    <Avatar name={v?.name ?? 'P'} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-bold">{v?.name}</span>{last && <span className="shrink-0 text-xs text-slate-500">{timeShort(last.time)}</span>}</span>
                      <span className="block truncate text-xs text-slate-600">{last?.text ?? 'Say hello'}</span>
                    </span>
                    {t.unread > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-black px-1.5 text-xs font-bold text-white">{t.unread}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}

export default function CustomerHome() {
  const { events, bookings, threads, session } = useStore()
  const next = [...events].sort((a, b) => a.date.localeCompare(b.date)).find((e) => daysUntil(e.date) >= 0)
  const first = session?.name.split(' ')[0] ?? 'there'
  const pending = bookings.filter((b) => b.customer === CUSTOMER_NAME && b.status === 'pending').length
  const accepted = bookings.filter((b) => b.customer === CUSTOMER_NAME && b.status === 'accepted').length
  const unread = threads.filter((t) => t.customer === CUSTOMER_NAME).reduce((n, t) => n + t.unread, 0)

  return (
    <>
      <div className="container-x pt-6 lg:pt-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-black text-white">
          <img src={photo.weddingBouquet} alt="" draggable={false} className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
          <div className="relative grid grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:p-12">
            <div>
              <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-5xl">Welcome back, {first}</h1>
              <p className="mt-3 max-w-md text-white/80">
                {next ? `${next.name} is ${daysUntil(next.date) === 0 ? 'today' : `in ${daysUntil(next.date)} days`}. Everything for it lives on this page.` : 'Create your first event to start planning.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="h-auto rounded-full bg-white px-6 py-3 text-black hover:bg-white/90" onClick={() => jump('events')}><CalendarPlus className="h-4 w-4" /> My events</Button>
                <Button variant="outline" className="h-auto rounded-full border-white/40 bg-transparent px-6 py-3 text-white hover:bg-white/10 hover:text-white" onClick={() => jump('find')}>Find providers</Button>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {[{ l: 'Pending', v: pending }, { l: 'Accepted', v: accepted }, { l: 'Unread', v: unread }].map((s) => (
                <div key={s.l} className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                  <dd className="text-3xl font-extrabold">{s.v}</dd>
                  <dt className="mt-1 text-xs text-white/75">{s.l}</dt>
                </div>
              ))}
            </dl>
          </div>
          {next && (
            <p className="relative flex items-center gap-2 border-t border-white/15 px-6 py-3 text-sm text-white/80 sm:px-10 lg:px-12">
              <MessageSquare className="h-4 w-4" aria-hidden /> Next up: <strong className="text-white">{next.name}</strong> · {dateLong(next.date)} · {next.location}
            </p>
          )}
        </div>
      </div>

      <div className="container-x grid grid-cols-1 gap-10 py-10 lg:grid-cols-[1fr_340px] lg:gap-12 lg:py-14">
        <div className="min-w-0 space-y-16">
          <Block id="events"><CustomerEvents /></Block>
          <Block id="requests"><CustomerBookings /></Block>
          <Block id="find"><FindProviders /></Block>
        </div>
        <Rail />
      </div>

      <div className="border-t bg-ivory">
        <div className="container-x space-y-16 py-12 lg:py-16">
          <Block id="messages"><CustomerMessages /></Block>
          <Block id="budget"><CustomerBudget /></Block>
        </div>
      </div>
    </>
  )
}
