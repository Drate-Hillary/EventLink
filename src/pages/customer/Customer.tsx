import { Slider } from '@/components/ui/slider'
import { DatePicker } from '@/components/ui/date-picker'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, CalendarDays, ClipboardList, MapPin, Pencil, Plus, Trash2, Wallet,
} from 'lucide-react'
import { photo } from '../../data/images'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Chat } from '../../components/bookings/Chat'
import { EmptyState, Field, Modal, PageHeader, StatusBadge, Tabs } from '../../components/ui'
import { CUSTOMER_NAME, useStore } from '../../features/store'
import { CATEGORIES, type BookingStatus, type Category, type EventItem } from '../../types'
import { dateLong, daysUntil, money } from '../../utils/format'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SelectInput } from '@/components/ui'

const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Anniversary', 'Baby shower', 'Graduation', 'Other']
const eventPhoto: Record<string, string> = {
  Wedding: photo.weddingBouquet, Birthday: photo.balloons, Corporate: photo.bannerHall, Anniversary: photo.tableFlowers,
  'Baby shower': photo.balloons, Graduation: photo.confetti, Other: photo.rusticTable,
}
const PALETTE = ['#000000', '#404040', '#737373', '#A3A3A3', '#D4D4D4']

/* ---------- Events ---------- */
const blank: Omit<EventItem, 'id'> = { name: '', type: 'Wedding', date: '', location: '', guests: 50, budget: 5000, categories: [] }

export function CustomerEvents() {
  const { events, saveEvent, deleteEvent, toast, allocations } = useStore()
  const [editing, setEditing] = useState<EventItem | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const open = (e: EventItem | 'new') => {
    setEditing(e); setErrors({})
    setForm(e === 'new' ? blank : { ...e })
  }

  const submit = () => {
    const er: Record<string, string> = {}
    if (form.name.trim().length < 2) er.name = 'Give your event a name.'
    if (!form.date) er.date = 'Choose a date.'
    else if (editing === 'new' && daysUntil(form.date) < 0) er.date = 'Pick a date in the future.'
    if (!form.location.trim()) er.location = 'Enter the city or venue area.'
    if (form.guests < 1) er.guests = 'Guest count must be at least 1.'
    if (form.budget < 0) er.budget = 'Budget cannot be negative.'
    if (form.categories.length === 0) er.categories = 'Select at least one service.'
    setErrors(er)
    if (Object.keys(er).length) return
    saveEvent(editing === 'new' ? form : { ...form, id: (editing as EventItem).id })
    toast(editing === 'new' ? 'Event created' : 'Event updated')
    setEditing(null)
  }

  const toggleCat = (c: Category) => setForm((f) => ({ ...f, categories: f.categories.includes(c) ? f.categories.filter((x) => x !== c) : [...f.categories, c] }))

  return (
    <>
      <PageHeader section title="My events" subtitle="Save your event details once and reuse them in every request." action={<Button onClick={() => open('new')}><Plus className="h-4 w-4" /> Create event</Button>} />
      {events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events yet" text="Create your first event to start requesting quotes." action={<Button onClick={() => open('new')}>Create event</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {events.map((e) => {
            const used = Object.values(allocations[e.id] ?? {}).reduce((n, v) => n + (v ?? 0), 0)
            const pct = e.budget > 0 ? Math.min(100, Math.round((used / e.budget) * 100)) : 0
            const days = daysUntil(e.date)
            return (
              <article key={e.id} className="group overflow-hidden rounded-3xl border bg-card shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                <div className="relative h-40 overflow-hidden bg-black">
                  <img src={eventPhoto[e.type] ?? photo.rusticTable} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-xs font-bold">{e.type}</span>
                  <span className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    {days < 0 ? 'Past event' : days === 0 ? 'Today' : `In ${days} days`}
                  </span>
                  <h3 className="absolute bottom-4 left-4 right-4 font-serif text-xl font-semibold text-white">{e.name}</h3>
                </div>
                <div className="p-5">
                  <dl className="grid grid-cols-3 divide-x text-sm">
                    <div className="pr-3"><dt className="text-xs text-slate-500">Date</dt><dd className="mt-0.5 font-semibold">{dateLong(e.date)}</dd></div>
                    <div className="px-3"><dt className="text-xs text-slate-500">Guests</dt><dd className="mt-0.5 font-semibold">{e.guests}</dd></div>
                    <div className="pl-3"><dt className="text-xs text-slate-500">Budget</dt><dd className="mt-0.5 font-semibold">{money(e.budget)}</dd></div>
                  </dl>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-4 w-4" aria-hidden /> {e.location}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold"><span>Budget planned</span><span>{pct}%</span></div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Budget planned"><div className="h-full rounded-full bg-black transition-all" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {e.categories.map((c) => <Link key={c} to={`/vendors?category=${encodeURIComponent(c)}&location=${encodeURIComponent(e.location.split(',')[0])}`} className="rounded-full border px-3 py-1 text-xs font-semibold transition hover:bg-black hover:text-white">{c}</Link>)}
                  </div>
                  <div className="mt-5 flex gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => open(e)}><Pencil className="h-4 w-4" /> Edit</Button>
                    <Button variant="ghost" size="sm" aria-label={`Delete ${e.name}`} onClick={() => { deleteEvent(e.id); toast('Event deleted') }}><Trash2 className="h-4 w-4" /> Delete</Button>
                  </div>
                </div>
              </article>
            )
          })}
          <button onClick={() => open('new')} className="grid min-h-48 place-items-center rounded-3xl border-2 border-dashed p-6 text-center transition hover:border-black hover:bg-ivory">
            <span><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-black text-white"><Plus className="h-5 w-5" /></span><span className="mt-3 block font-bold">Plan another event</span><span className="block text-sm text-slate-600">Add the date, place and budget</span></span>
          </button>
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Create event' : 'Edit event'} wide>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
          <div className="sm:col-span-2"><Field label="Event name" error={errors.name}>{(id) => <Input id={id}  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field></div>
          <Field label="Event type">{(id) => <SelectInput id={id}  value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</SelectInput>}</Field>
          <Field label="Date" error={errors.date}>{(id) => <DatePicker id={id} value={form.date} onChange={(date) => setForm({ ...form, date })} />}</Field>
          <Field label="Location" error={errors.location}>{(id) => <Input id={id}  placeholder="City, State" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />}</Field>
          <Field label="Guests" error={errors.guests}>{(id) => <Input id={id} type="number" min={1}  value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />}</Field>
          <div className="sm:col-span-2"><Field label="Total budget (USD)" error={errors.budget}>{(id) => <Input id={id} type="number" min={0} step={100}  value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} />}</Field></div>
          <fieldset className="sm:col-span-2">
            <legend className="mb-1.5 block text-sm font-semibold">Services you need</legend>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <label key={c} className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${form.categories.includes(c) ? 'border-teal-600 bg-teal-600 text-white' : 'border-soft bg-white hover:bg-ivory'}`}>
                  <input type="checkbox" className="sr-only" checked={form.categories.includes(c)} onChange={() => toggleCat(c)} /> {c}
                </label>
              ))}
            </div>
            {errors.categories && <p role="alert" className="mt-1 text-xs font-medium text-black">{errors.categories}</p>}
          </fieldset>
          <div className="flex justify-end gap-2 sm:col-span-2"><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button>Save event</Button></div>
        </form>
      </Modal>
    </>
  )
}

/* ---------- Requests ---------- */
export function CustomerBookings() {
  const { bookings, vendors, events } = useStore()
  const [tab, setTab] = useState<'all' | BookingStatus>('all')
  const mine = bookings.filter((b) => b.customer === CUSTOMER_NAME)
  const list = tab === 'all' ? mine : mine.filter((b) => b.status === tab)
  const n = (s: BookingStatus) => mine.filter((b) => b.status === s).length

  return (
    <>
      <PageHeader section title="Quote and booking requests" subtitle="Track every request and see how providers respond." />
      <Tabs id="cb" value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: mine.length }, { value: 'pending', label: 'Pending', count: n('pending') }, { value: 'accepted', label: 'Accepted', count: n('accepted') }, { value: 'declined', label: 'Declined', count: n('declined') }]} />
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list.length === 0 ? <div className="lg:col-span-2"><EmptyState icon={ClipboardList} title="Nothing here yet" text="Requests you send to vendors will show up with their status." action={<Link to="/customer#find" className={buttonVariants({ variant: 'default' })}>Find providers</Link>} /></div> :
          list.map((b) => {
            const v = vendors.find((x) => x.id === b.vendorId)
            const ev = events.find((x) => x.id === b.eventId)
            return (
              <article key={b.id} className="flex flex-col rounded-3xl border bg-card p-4 shadow-card transition hover:shadow-lift sm:p-5">
                <div className="flex items-start gap-4">
                  {v && <img src={v.photos[0]} alt="" loading="lazy" draggable={false} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/vendors/${b.vendorId}`} className="truncate font-bold hover:underline">{v?.name}</Link>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-slate-600">{b.kind === 'quote' ? 'Quote request' : 'Booking request'} · {b.packageName}</p>
                  </div>
                </div>
                {b.note && <p className="mt-3 rounded-2xl bg-secondary px-4 py-2.5 text-sm text-slate-700">“{b.note}”</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
                  <p className="min-w-0 truncate text-slate-500">{ev?.name ?? 'Event'} · sent {dateLong(b.createdAt)}</p>
                  <Link to="/customer#messages" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'shrink-0')}>Message</Link>
                </div>
              </article>
            )
          })}
      </div>
    </>
  )
}

/* ---------- Messages ---------- */
export function CustomerMessages() {
  const { threads, vendors } = useStore()
  const [params] = useSearchParams()
  const mine = threads.filter((t) => t.customer === CUSTOMER_NAME)
  return (
    <>
      <PageHeader section title="Messages" subtitle="Your full conversation history with providers." />
      <Chat side="customer" threads={mine} initialId={params.get('thread')} nameOf={(t) => vendors.find((v) => v.id === t.vendorId)?.name ?? 'Provider'} />
    </>
  )
}

/* ---------- Budget ---------- */
export function CustomerBudget() {
  const { events, allocations, setAllocation } = useStore()
  const [eventId, setEventId] = useState(events[0]?.id ?? '')
  const ev = events.find((e) => e.id === eventId)
  if (!ev) return <><PageHeader section title="Budget planner" /><EmptyState icon={Wallet} title="Create an event first" text="Budgets are planned per event." action={<Link to="/customer/events" className={buttonVariants({ variant: 'default' })}>Create event</Link>} /></>

  const alloc = allocations[ev.id] ?? {}
  const total = ev.categories.reduce((n, c) => n + (alloc[c] ?? 0), 0)
  const over = total > ev.budget
  const data = ev.categories.map((c) => ({ name: c, value: alloc[c] ?? 0 })).filter((d) => d.value > 0)

  return (
    <>
      <PageHeader section title="Budget planner" subtitle="Split your total budget across services. We warn you when you go over." action={
        <SelectInput aria-label="Event" className="!w-auto" value={ev.id} onChange={(e) => setEventId(e.target.value)}>{events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</SelectInput>} />
      {over && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-black bg-white p-4 text-sm text-black">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> <p><strong>You’re {money(total - ev.budget)} over budget.</strong> Lower one or more categories to get back under {money(ev.budget)}.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border bg-card text-card-foreground shadow-card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Allocate by service</h2>
          <div className="mt-5 space-y-5">
            {ev.categories.map((c) => (
              <div key={c}>
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={`b-${c}`} className="font-semibold">{c}</label>
                  <div className="relative w-32"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                    <Input id={`b-${c}`} type="number" min={0} step={100} className="!pl-6 text-right" value={alloc[c] ?? 0} onChange={(e) => setAllocation(ev.id, c, Math.max(0, Number(e.target.value)))} /></div>
                </div>
                <Slider aria-label={`${c} slider`} min={0} max={Math.max(ev.budget, 100)} step={100} value={[alloc[c] ?? 0]} onValueChange={([v]) => setAllocation(ev.id, c, v)} className="mt-2" />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border bg-card text-card-foreground shadow-card p-5 sm:p-6">
          <h2 className="text-lg font-extrabold">Summary</h2>
          <div className="mt-2 h-56">
            {data.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>{data.map((d, i) => <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />)}</Pie><Tooltip formatter={(v) => money(Number(v))} /></PieChart>
              </ResponsiveContainer>
            ) : <p className="grid h-full place-items-center text-sm text-slate-500">Set an amount to see the split.</p>}
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.map((d, i) => <li key={d.name} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />{d.name}</span><span className="font-semibold">{money(d.value)}</span></li>)}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between"><dt>Total budget</dt><dd className="font-bold">{money(ev.budget)}</dd></div>
            <div className="flex justify-between"><dt>Allocated</dt><dd className={`font-bold ${over ? 'text-black' : ''}`}>{money(total)}</dd></div>
            <div className="flex justify-between"><dt>{over ? 'Over by' : 'Remaining'}</dt><dd className={`font-bold ${over ? 'text-black' : 'text-black'}`}>{money(Math.abs(ev.budget - total))}</dd></div>
          </dl>
        </section>
      </div>
    </>
  )
}
