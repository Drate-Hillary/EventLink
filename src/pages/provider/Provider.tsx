import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronLeft, Flag, ChevronRight, ClipboardList, Eye, ImagePlus, MessageSquare, Pencil, Plus, ShieldCheck, Star, Trash2, TrendingUp, X,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Chat } from '../../components/bookings/Chat'
import { providerViews } from '../../data/mock'
import { Art, Avatar, EmptyState, Field, Modal, PageHeader, Stars, Stat, StatusBadge, Tabs, categoryIcon } from '../../components/ui'
import { PROVIDER_ID, useStore } from '../../features/store'
import { CATEGORIES, type Booking, type BookingStatus, type Category, type Pkg, type Thread } from '../../types'
import { dateLong, money, uid } from '../../utils/format'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SelectInput } from '@/components/ui'

const useMe = () => {
  const s = useStore()
  return { ...s, me: s.vendors.find((v) => v.id === PROVIDER_ID)! }
}

function VerificationBanner() {
  const { accounts, me } = useMe()
  const acc = accounts.find((a) => a.business === me.name)
  const status = acc?.status ?? 'pending'
  const copy = {
    verified: 'Your business is verified. You show a verified badge and appear in public search.',
    pending: 'Your application is being reviewed. You will appear in public search once approved.',
    rejected: 'Your application was rejected. Update your documents and contact support to apply again.',
    suspended: 'Your account is suspended. You are hidden from public search until it is reinstated.',
  }[status]
  return (
    <Card className="mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary"><ShieldCheck className="h-5 w-5" aria-hidden /></span>
      <div className="min-w-0 flex-1"><p className="font-bold">Verification status</p><p className="text-sm text-slate-600">{copy}</p></div>
      <StatusBadge status={status} />
    </Card>
  )
}

export function ProviderOverview() {
  const { me, bookings, threads, blockedDates } = useMe()
  const inbox = bookings.filter((b) => b.vendorId === PROVIDER_ID)
  const pending = inbox.filter((b) => b.status === 'pending')
  const upcoming = inbox.filter((b) => b.status === 'accepted' && b.eventDate).sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''))
  const unread = threads.filter((t) => t.vendorId === PROVIDER_ID).reduce((n, t) => n + t.unread, 0)
  const checks = [
    { done: me.about.length > 40, label: 'Write your business description' },
    { done: me.packages.length > 0, label: 'Add at least one package' },
    { done: me.areas.length > 0, label: 'Choose the areas you serve' },
    { done: blockedDates.length > 0, label: 'Update your availability' },
    { done: me.verified, label: 'Get verified by our team' },
  ]
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100)
  const first = providerViews[providerViews.length - 1]

  return (
    <>
      <PageHeader title={me.name} subtitle="Your business at a glance." action={<Link to={`/vendors/${PROVIDER_ID}`} className={buttonVariants({ variant: 'outline' })}>View public page</Link>} />
      <VerificationBanner />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={MessageSquare} label="New enquiries" value={unread} hint="Unread messages" />
        <Stat icon={ClipboardList} label="Pending bookings" value={pending.length} hint="Waiting for your reply" />
        <Stat icon={Check} label="Accepted bookings" value={inbox.filter((b) => b.status === 'accepted').length} hint={`${upcoming.length} upcoming`} />
        <Stat icon={TrendingUp} label="Profile views" value={first.views} hint="This week" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Needs your reply</h2><Link to="/provider/bookings" className="text-sm font-semibold hover:underline">All requests</Link></div>
            {pending.length === 0 ? <p className="py-4 text-sm text-slate-600">You’re all caught up.</p> : (
              <ul className="divide-y">{pending.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <Avatar name={b.customer} size="sm" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{b.customer}</p><p className="truncate text-xs text-slate-500">{b.packageName}{b.eventDate ? ` · ${dateLong(b.eventDate)}` : ''}</p></div>
                  <StatusBadge status="pending" />
                </li>))}</ul>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Upcoming events</h2>
            {upcoming.length === 0 ? <p className="py-4 text-sm text-slate-600">Accepted bookings with an event date appear here.</p> : (
              <ul className="space-y-3">{upcoming.map((b) => (
                <li key={b.id} className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black text-center text-white"><span><span className="block text-base font-extrabold leading-none">{new Date(b.eventDate + 'T00:00:00').getDate()}</span><span className="text-[10px]">{new Date(b.eventDate + 'T00:00:00').toLocaleString('en-US', { month: 'short' })}</span></span></div>
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{b.customer}</p><p className="text-xs text-slate-500">{b.packageName}</p></div>
                </li>))}</ul>
            )}
          </Card>
        </div>
        <Card className="h-fit p-5">
          <h2 className="font-bold">Profile completeness</h2>
          <p className="mt-3 text-3xl font-extrabold">{pct}%</p>
          <div className="mt-2 h-2 rounded-full bg-secondary"><div className="h-full rounded-full bg-black transition-all" style={{ width: `${pct}%` }} /></div>
          <ul className="mt-4 space-y-2 text-sm">{checks.map((c) => (
            <li key={c.label} className={cn('flex items-center gap-2', c.done ? 'text-slate-500 line-through' : 'font-semibold')}>
              <span className={cn('grid h-5 w-5 place-items-center rounded-full', c.done ? 'bg-black text-white' : 'border')}>{c.done && <Check className="h-3 w-3" />}</span>{c.label}</li>))}</ul>
        </Card>
      </div>
    </>
  )
}

export function ProviderBookings() {
  const { bookings, setBookingStatus, toast, addReport, blockedDates } = useMe()
  const [reportFor, setReportFor] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState<Booking | null>(null)
  const [tab, setTab] = useState<'all' | BookingStatus>('pending')
  const inbox = bookings.filter((b) => b.vendorId === PROVIDER_ID)
  const list = tab === 'all' ? inbox : inbox.filter((b) => b.status === tab)
  const n = (s: BookingStatus) => inbox.filter((b) => b.status === s).length
  const conflict = (b: Booking) => {
    if (!b.eventDate) return null
    if (blockedDates.includes(b.eventDate)) return 'You marked this date as unavailable.'
    const other = inbox.find((x) => x.id !== b.id && x.status === 'accepted' && x.eventDate === b.eventDate)
    return other ? `You already accepted ${other.customer} for this date.` : null
  }
  const act = (id: string, s: BookingStatus) => { setBookingStatus(id, s); setOpen(null); toast(s === 'accepted' ? 'Request accepted' : 'Request declined') }

  return (
    <>
      <PageHeader title="Booking requests" subtitle="Open a request to see the event details, then accept or decline. Agree payment directly with the customer." />
      <Tabs id="pb" value={tab} onChange={setTab} tabs={[{ value: 'pending', label: 'Pending', count: n('pending') }, { value: 'accepted', label: 'Accepted', count: n('accepted') }, { value: 'declined', label: 'Declined', count: n('declined') }, { value: 'all', label: 'All', count: inbox.length }]} />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {list.length === 0 ? <div className="lg:col-span-2"><EmptyState icon={ClipboardList} title="No requests here" text="New requests appear as soon as customers send them." /></div> : list.map((b) => {
          const warn = b.status === 'pending' ? conflict(b) : null
          return (
            <Card key={b.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar name={b.customer} />
                <div className="min-w-0 flex-1"><p className="font-bold">{b.customer}</p><p className="text-sm text-slate-600">{b.kind === 'quote' ? 'Quote request' : 'Booking request'} · {b.packageName}</p></div>
                <StatusBadge status={b.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-slate-500">Event date</dt><dd className="font-semibold">{b.eventDate ? dateLong(b.eventDate) : 'Not set'}</dd></div>
                <div><dt className="text-xs text-slate-500">Received</dt><dd className="font-semibold">{dateLong(b.createdAt)}</dd></div>
              </dl>
              {b.note && <p className="mt-3 rounded-2xl bg-secondary px-4 py-2.5 text-sm">“{b.note}”</p>}
              {warn && <p role="alert" className="mt-3 flex items-start gap-2 rounded-2xl border border-black p-3 text-sm font-semibold"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Date conflict: {warn}</p>}
              <div className="mt-auto flex flex-wrap gap-2 border-t pt-4 mt-4">
                <Button size="sm" variant="outline" onClick={() => setOpen(b)}>View details</Button>
                {b.status === 'pending' && <>
                  <Button size="sm" disabled={!!warn} onClick={() => act(b.id, 'accepted')}><Check className="h-4 w-4" /> Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => act(b.id, 'declined')}><X className="h-4 w-4" /> Decline</Button>
                </>}
                <Button size="sm" variant="ghost" aria-label={`Report ${b.customer}`} onClick={() => setReportFor(b.customer)}><Flag className="h-4 w-4" /></Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open ? `${open.customer}’s request` : ''} wide>
        {open && (() => {
          const warn = open.status === 'pending' ? conflict(open) : null
          return (
            <div className="space-y-5">
              <dl className="grid gap-4 text-sm sm:grid-cols-3">
                {[['Requested package', open.packageName], ['Event date', open.eventDate ? dateLong(open.eventDate) : 'Not set'], ['Request type', open.kind === 'quote' ? 'Quote' : 'Booking']].map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
              </dl>
              <div><p className="mb-1 text-sm font-semibold">Customer message</p><p className="rounded-2xl bg-secondary p-4 text-sm">{open.note || 'No message was included.'}</p></div>
              {warn && <p role="alert" className="flex items-start gap-2 rounded-2xl border border-black p-3 text-sm font-semibold"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Date conflict: {warn} Free the date in Availability before accepting.</p>}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                <StatusBadge status={open.status} />
                {open.status === 'pending' ? (
                  <div className="flex gap-2"><Button variant="outline" onClick={() => act(open.id, 'declined')}>Decline</Button><Button disabled={!!warn} onClick={() => act(open.id, 'accepted')}>Accept request</Button></div>
                ) : <Link to="/provider/messages" className={buttonVariants({ variant: 'outline' })}>Message customer</Link>}
              </div>
            </div>
          )
        })()}
      </Modal>

      <Modal open={!!reportFor} onClose={() => setReportFor(null)} title={`Report ${reportFor}`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!reason.trim() || !reportFor) return; addReport(reportFor, reason.trim()); setReason(''); setReportFor(null); toast('Report sent to our team') }}>
          <Field label="What happened?" hint="Our team reviews every report.">{(id) => <Textarea id={id} rows={4} required value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setReportFor(null)}>Cancel</Button><Button variant="destructive">Send report</Button></div>
        </form>
      </Modal>
    </>
  )
}

export function ProviderMessages() {
  const { threads, bookings } = useStore()
  const [tab, setTab] = useState<'new' | 'waiting' | 'all'>('new')
  const mine = threads.filter((t) => t.vendorId === PROVIDER_ID)
  const lastFromCustomer = (t: Thread) => t.messages[t.messages.length - 1]?.from === 'customer'
  const groups = { new: mine.filter(lastFromCustomer), waiting: mine.filter((t) => !lastFromCustomer(t)), all: mine }
  const info = (t: Thread) => bookings.find((b) => b.vendorId === PROVIDER_ID && b.customer === t.customer)
  return (
    <>
      <PageHeader title="Enquiries" subtitle="New enquiries need your reply. Awaiting customer means you replied last." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs id="pm" value={tab} onChange={setTab} tabs={[{ value: 'new', label: 'New', count: groups.new.length }, { value: 'waiting', label: 'Awaiting customer', count: groups.waiting.length }, { value: 'all', label: 'All', count: mine.length }]} />
      </div>
      <Chat key={tab} side="provider" threads={groups[tab]} nameOf={(t) => t.customer}
        subtitleOf={(t) => { const b = info(t); return b ? `${b.packageName}${b.eventDate ? ` · ${dateLong(b.eventDate)}` : ''}` : undefined }} />
    </>
  )
}

export function ProviderPerformance() {
  const { me, bookings } = useMe()
  const inbox = bookings.filter((b) => b.vendorId === PROVIDER_ID)
  const decided = inbox.filter((b) => b.status !== 'pending')
  const rate = decided.length ? Math.round((decided.filter((b) => b.status === 'accepted').length / decided.length) * 100) : 0
  const views = providerViews.reduce((n, w) => n + w.views, 0)
  const enq = providerViews.reduce((n, w) => n + w.enquiries, 0)
  const conv = enq ? Math.round((inbox.length / enq) * 100) : 0
  const byPkg = useMemo(() => me.packages.map((p) => ({ name: p.name, requests: inbox.filter((b) => b.packageName === p.name).length })).sort((a, b) => b.requests - a.requests), [me.packages, inbox])
  const axis = { tickLine: false, axisLine: false, fontSize: 12 } as const
  return (
    <>
      <PageHeader title="Performance" subtitle="Based on the last six weeks of recorded activity. Weekly view counts are sample data." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Eye} label="Profile views" value={views.toLocaleString()} hint="Last 6 weeks" />
        <Stat icon={MessageSquare} label="Enquiries received" value={enq} hint="Last 6 weeks" />
        <Stat icon={TrendingUp} label="Enquiry to request" value={`${conv}%`} hint="Share that became a request" />
        <Stat icon={Check} label="Acceptance rate" value={`${rate}%`} hint={`${decided.length} decided requests`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold">Views and enquiries</h2>
          <p className="text-sm text-slate-600">Views have grown every week since week 1.</p>
          <div className="mt-4 h-60" role="img" aria-label="Line chart of weekly profile views and enquiries">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={providerViews} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E2" /><XAxis dataKey="week" {...axis} /><YAxis {...axis} /><Tooltip /><Line type="monotone" dataKey="views" name="Views" stroke="#000000" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="enquiries" name="Enquiries" stroke="#A3A3A3" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-bold">Most requested packages</h2>
          <p className="text-sm text-slate-600">{byPkg[0]?.requests ? `${byPkg[0].name} is requested most.` : 'Requests by package will appear here.'}</p>
          <div className="mt-4 h-60" role="img" aria-label="Bar chart of requests per package">
            <ResponsiveContainer width="100%" height="100%"><BarChart data={byPkg} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4E4E2" /><XAxis type="number" allowDecimals={false} {...axis} /><YAxis type="category" dataKey="name" width={110} {...axis} /><Tooltip cursor={{ fill: '#FAFAFA' }} /><Bar dataKey="requests" name="Requests" fill="#000000" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  )
}

export function ProviderProfile() {
  const { me, updateVendor, toast } = useMe()
  const [f, setF] = useState({ name: me.name, category: me.category as Category, phone: me.phone, email: me.email, about: me.about, areas: me.areas.join(', ') })
  const [err, setErr] = useState<Record<string, string>>({})
  const save = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 2) e.name = 'Enter your business name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.'
    if (f.phone.trim().length < 7) e.phone = 'Enter a contact number.'
    const areas = f.areas.split(',').map((a) => a.trim()).filter(Boolean)
    if (!areas.length) e.areas = 'Add at least one location you serve.'
    setErr(e)
    if (Object.keys(e).length) return
    updateVendor(PROVIDER_ID, { name: f.name.trim(), category: f.category, phone: f.phone, email: f.email, about: f.about, areas, location: areas[0] })
    toast('Profile saved')
  }
  return (
    <>
      <PageHeader title="Business profile" subtitle="This is what customers see on your public page." action={<Link to={`/vendors/${PROVIDER_ID}`} className={buttonVariants({ variant: 'outline' })}>Preview public page</Link>} />
      <form className="rounded-2xl border bg-card text-card-foreground shadow-card grid gap-4 p-5 sm:grid-cols-2 sm:p-6" noValidate onSubmit={(e) => { e.preventDefault(); save() }}>
        <Field label="Business name" error={err.name}>{(id) => <Input id={id}  value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />}</Field>
        <Field label="Service category">{(id) => <SelectInput id={id}  value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</SelectInput>}</Field>
        <Field label="Contact email" error={err.email}>{(id) => <Input id={id} type="email"  value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />}</Field>
        <Field label="Phone" error={err.phone}>{(id) => <Input id={id} type="tel"  value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />}</Field>
        <div className="sm:col-span-2"><Field label="Locations you serve" error={err.areas} hint="Separate cities with commas. The first is your home base.">{(id) => <Input id={id}  value={f.areas} onChange={(e) => setF({ ...f, areas: e.target.value })} />}</Field></div>
        <div className="sm:col-span-2"><Field label="About your business">{(id) => <Textarea id={id} rows={5}  value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })} />}</Field></div>
        <div className="flex justify-end sm:col-span-2"><Button>Save profile</Button></div>
      </form>
    </>
  )
}

export function ProviderPortfolio() {
  const { me, portfolio, addPortfolio, removePortfolio, movePortfolio, toast } = useMe()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const Icon = categoryIcon[me.category]
  return (
    <>
      <PageHeader title="Portfolio" subtitle="Show customers your best previous work." action={<Button onClick={() => setOpen(true)}><ImagePlus className="h-4 w-4" /> Add photo</Button>} />
      {portfolio.length === 0 ? <EmptyState icon={ImagePlus} title="No photos yet" text="Profiles with six or more photos get more enquiries." action={<Button onClick={() => setOpen(true)}>Add your first photo</Button>} /> : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {portfolio.map((p) => (
            <figure key={p.id} className="group rounded-2xl border bg-card text-card-foreground shadow-card overflow-hidden">
              <div className="relative"><Art src={p.src} hue={p.hue} icon={Icon} className="aspect-[4/3] w-full" label={p.title} />
                <button className="absolute right-2 top-2 rounded-lg bg-white/95 p-2 text-black opacity-100 shadow transition sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100" aria-label={`Remove ${p.title}`} onClick={() => { removePortfolio(p.id); toast('Photo removed') }}><Trash2 className="h-4 w-4" /></button></div>
              <figcaption className="flex items-center justify-between gap-2 p-3 text-sm font-semibold"><span className="truncate">{p.title}</span><span className="flex shrink-0"><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${p.title} earlier`} onClick={() => movePortfolio(p.id, -1)}><ArrowLeft className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Move ${p.title} later`} onClick={() => movePortfolio(p.id, 1)}><ArrowRight className="h-4 w-4" /></Button></span></figcaption>
            </figure>))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add portfolio photo">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; addPortfolio(title.trim()); setTitle(''); setOpen(false); toast('Photo added') }}>
          <label className="grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-soft bg-ivory p-8 text-center text-sm text-slate-600 hover:border-teal-600">
            <ImagePlus className="mb-2 h-8 w-8 text-teal-600" aria-hidden /> Choose an image (JPG or PNG)
            <input type="file" accept="image/*" className="sr-only" />
          </label>
          <Field label="Caption">{(id) => <Input id={id} required  placeholder="e.g. Rooftop wedding dinner" value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button>Add photo</Button></div>
        </form>
      </Modal>
    </>
  )
}

export function ProviderPackages() {
  const { me, updateVendor, toast } = useMe()
  const [edit, setEdit] = useState<Pkg | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [includes, setIncludes] = useState('')
  const [err, setErr] = useState<Record<string, string>>({})

  const open = (p?: Pkg) => { setErr({}); setIsNew(!p); const base = p ?? { id: uid(), name: '', price: 0, description: '', includes: [] }; setEdit(base); setIncludes(base.includes.join('\n')) }
  const save = () => {
    if (!edit) return
    const e: Record<string, string> = {}
    if (!edit.name.trim()) e.name = 'Name your package.'
    if (!(edit.price > 0)) e.price = 'Enter a price above 0.'
    setErr(e)
    if (Object.keys(e).length) return
    const pkg = { ...edit, includes: includes.split('\n').map((s) => s.trim()).filter(Boolean) }
    const packages = isNew ? [...me.packages, pkg] : me.packages.map((p) => (p.id === pkg.id ? pkg : p))
    updateVendor(PROVIDER_ID, { packages, priceFrom: Math.min(...packages.map((p) => p.price)) })
    toast('Package saved'); setEdit(null)
  }
  const remove = (id: string) => { const packages = me.packages.filter((p) => p.id !== id); updateVendor(PROVIDER_ID, { packages, priceFrom: packages.length ? Math.min(...packages.map((p) => p.price)) : 0 }); toast('Package deleted') }

  return (
    <>
      <PageHeader title="Packages and pricing" subtitle="Customers pick a package when they request a quote or booking." action={<Button onClick={() => open()}><Plus className="h-4 w-4" /> New package</Button>} />
      {me.packages.length === 0 ? <EmptyState icon={Plus} title="No packages yet" text="Add a package so customers can see what you offer and what it costs." action={<Button onClick={() => open()}>Add package</Button>} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{me.packages.map((p) => (
          <article key={p.id} className="rounded-2xl border bg-card text-card-foreground shadow-card flex flex-col p-5">
            <div className="flex items-start justify-between"><h2 className="font-bold">{p.name}</h2><p className="text-xl font-extrabold">{money(p.price)}</p></div>
            <p className="mt-1 text-sm text-slate-600">{p.description}</p>
            <ul className="mt-3 flex-1 space-y-1 text-sm">{p.includes.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden />{i}</li>)}</ul>
            <div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1 !py-2 h-auto" onClick={() => open(p)}><Pencil className="h-4 w-4" /> Edit</Button><Button variant="ghost" className="!py-2 text-black hover:!bg-black/5 h-auto" aria-label={`Delete ${p.name}`} onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button></div>
          </article>))}</div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? 'New package' : 'Edit package'}>
        {edit && <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); save() }}>
          <Field label="Package name" error={err.name}>{(id) => <Input id={id}  value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />}</Field>
          <Field label="Price (USD)" error={err.price}>{(id) => <Input id={id} type="number" min={0}  value={edit.price || ''} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} />}</Field>
          <Field label="Short description">{(id) => <Input id={id}  value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />}</Field>
          <Field label="What’s included" hint="One item per line.">{(id) => <Textarea id={id} rows={4}  value={includes} onChange={(e) => setIncludes(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button>Save package</Button></div>
        </form>}
      </Modal>
    </>
  )
}

export function ProviderAvailability() {
  const { blockedDates, toggleDate } = useMe()
  const [cursor, setCursor] = useState(() => new Date(2026, 9, 1))
  const y = cursor.getFullYear(), m = cursor.getMonth()
  const days = useMemo(() => {
    const first = new Date(y, m, 1).getDay()
    const count = new Date(y, m + 1, 0).getDate()
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)] as (number | null)[]
  }, [y, m])
  const iso = (d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <PageHeader title="Availability" subtitle="Select a date to mark it as unavailable. Customers filtering for open dates will not see you on those days." />
      <Card className="max-w-xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setCursor(new Date(y, m - 1, 1))}><ChevronLeft /></Button>
          <h2 className="text-lg font-extrabold">{cursor.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setCursor(new Date(y, m + 1, 1))}><ChevronRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">{['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <div key={d} className="py-2">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d, i) => d === null ? <div key={i} /> : (() => {
            const blocked = blockedDates.includes(iso(d))
            const past = iso(d) < today
            return <button key={i} disabled={past} aria-pressed={blocked} aria-label={`${dateLong(iso(d))}, ${blocked ? 'unavailable' : 'available'}`} onClick={() => toggleDate(iso(d))}
              className={`aspect-square rounded-xl text-sm font-semibold transition disabled:opacity-30 ${blocked ? 'bg-navy-900 text-white' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'} ${iso(d) === today ? 'ring-2 ring-gold-500' : ''}`}>{d}</button>
          })())}
        </div>
        <div className="mt-4 flex gap-5 text-sm"><span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-teal-50 ring-1 ring-teal-200" /> Available</span><span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-navy-900" /> Unavailable</span></div>
      </Card>
    </>
  )
}

export function ProviderReviews() {
  const { me } = useMe()
  return (
    <>
      <PageHeader title="Reviews" subtitle="Reviews come from customers with completed bookings." />
      <Card className="mb-5 flex items-center gap-6 p-5"><p className="text-4xl font-extrabold">{me.rating.toFixed(1)}</p><div><Stars value={me.rating} /><p className="text-sm text-slate-600">{me.reviewCount} reviews</p></div></Card>
      {me.reviews.length === 0 ? <EmptyState icon={Star} title="No reviews yet" text="Complete a booking and your customer can leave a review." /> : (
        <ul className="space-y-4">{me.reviews.map((r) => (
          <li key={r.id} className="rounded-2xl border bg-card text-card-foreground shadow-card p-5"><div className="flex items-center justify-between"><p className="font-bold">{r.author}</p><Stars value={r.rating} /></div><p className="mt-2 text-slate-700">{r.text}</p><p className="mt-2 text-xs text-slate-500">{r.eventType} · {dateLong(r.date)}</p></li>))}</ul>
      )}
    </>
  )
}
