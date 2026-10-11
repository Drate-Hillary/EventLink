import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check, ChevronLeft, Flag, ChevronRight, ClipboardList, ImagePlus, MessageSquare, Pencil, Plus, Star, Trash2, TrendingUp, X,
} from 'lucide-react'
import { Chat } from '../../components/bookings/Chat'
import { Art, EmptyState, Field, Modal, PageHeader, Stars, Stat, StatusBadge, Tabs, VerifiedBadge, categoryIcon } from '../../components/ui'
import { PROVIDER_ID, useStore } from '../../features/store'
import { CATEGORIES, type BookingStatus, type Category, type Pkg } from '../../types'
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

export function ProviderOverview() {
  const { me, bookings, threads, blockedDates } = useMe()
  const inbox = bookings.filter((b) => b.vendorId === PROVIDER_ID)
  const pending = inbox.filter((b) => b.status === 'pending')
  const unread = threads.filter((t) => t.vendorId === PROVIDER_ID).reduce((n, t) => n + t.unread, 0)
  const checks = [
    { done: me.about.length > 40, label: 'Write your business description' },
    { done: me.packages.length > 0, label: 'Add at least one package' },
    { done: me.areas.length > 0, label: 'Choose the areas you serve' },
    { done: blockedDates.length > 0, label: 'Update your availability' },
    { done: me.verified, label: 'Get verified by our team' },
  ]
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100)

  return (
    <>
      <PageHeader title={me.name} subtitle="Your business at a glance." action={me.verified ? <VerifiedBadge /> : <StatusBadge status="pending" />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ClipboardList} label="Pending requests" value={pending.length} hint="Waiting for your reply" />
        <Stat icon={Check} label="Accepted bookings" value={inbox.filter((b) => b.status === 'accepted').length} />
        <Stat icon={MessageSquare} label="Unread messages" value={unread} />
        <Stat icon={TrendingUp} label="Rating" value={me.rating.toFixed(1)} hint={`${me.reviewCount} reviews`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border bg-card text-card-foreground shadow-card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">Needs your reply</h2><Link to="/provider/bookings" className="text-sm font-semibold text-teal-700 hover:underline">All requests</Link></div>
          {pending.length === 0 ? <p className="text-sm text-slate-600">You’re all caught up.</p> : (
            <ul className="divide-y divide-soft">{pending.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0"><p className="truncate font-bold">{b.customer}</p><p className="truncate text-sm text-slate-500">{b.packageName} · {b.note || 'No message'}</p></div>
                <StatusBadge status="pending" />
              </li>))}</ul>
          )}
        </section>
        <section className="rounded-2xl border bg-card text-card-foreground shadow-card p-5">
          <h2 className="text-lg font-extrabold">Profile strength</h2>
          <div className="mt-3 h-2.5 rounded-full bg-soft"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-sm font-semibold">{pct}% complete</p>
          <ul className="mt-4 space-y-2 text-sm">{checks.map((c) => (
            <li key={c.label} className={`flex items-center gap-2 ${c.done ? 'text-slate-500 line-through' : 'font-semibold'}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full ${c.done ? 'bg-teal-600 text-white' : 'border border-soft'}`}>{c.done && <Check className="h-3 w-3" />}</span>{c.label}</li>))}</ul>
        </section>
      </div>
    </>
  )
}

export function ProviderBookings() {
  const { bookings, setBookingStatus, toast, addReport } = useMe()
  const [reportFor, setReportFor] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [tab, setTab] = useState<'all' | BookingStatus>('pending')
  const inbox = bookings.filter((b) => b.vendorId === PROVIDER_ID)
  const list = tab === 'all' ? inbox : inbox.filter((b) => b.status === tab)
  const n = (s: BookingStatus) => inbox.filter((b) => b.status === s).length
  const act = (id: string, s: BookingStatus) => { setBookingStatus(id, s); toast(s === 'accepted' ? 'Request accepted' : 'Request declined') }

  return (
    <>
      <PageHeader title="Requests" subtitle="Accept or decline quote and booking requests. Agree payment directly with the customer." />
      <Tabs id="pb" value={tab} onChange={setTab} tabs={[{ value: 'pending', label: 'Pending', count: n('pending') }, { value: 'accepted', label: 'Accepted', count: n('accepted') }, { value: 'declined', label: 'Declined', count: n('declined') }, { value: 'all', label: 'All', count: inbox.length }]} />
      <div className="mt-5 space-y-3">
        {list.length === 0 ? <EmptyState icon={ClipboardList} title="No requests here" text="New requests appear as soon as customers send them." /> : list.map((b) => (
          <article key={b.id} className="rounded-2xl border bg-card text-card-foreground shadow-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-teal-700">{b.kind === 'quote' ? 'Quote request' : 'Booking request'}</p>
              <h2 className="text-lg font-bold">{b.customer}</h2>
              <p className="text-sm text-slate-600">{b.packageName} · received {dateLong(b.createdAt)}</p>
              {b.note && <p className="mt-1 text-sm text-slate-500">“{b.note}”</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={b.status} />
              {b.status === 'pending' && <>
                <Button className="!py-2 h-auto" onClick={() => act(b.id, 'accepted')}><Check className="h-4 w-4" /> Accept</Button>
                <Button variant="outline" className="!py-2 h-auto" onClick={() => act(b.id, 'declined')}><X className="h-4 w-4" /> Decline</Button>
              </>}
              <Link to="/provider/messages" className={cn(buttonVariants({ variant: 'ghost' }), "!py-2 h-auto")}>Message</Link>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-black" aria-label={`Report ${b.customer}`} onClick={() => setReportFor(b.customer)}><Flag className="h-4 w-4" /></Button>
            </div>
          </article>))}
      </div>
      <Modal open={!!reportFor} onClose={() => setReportFor(null)} title={`Report ${reportFor}`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!reason.trim() || !reportFor) return; addReport(reportFor, reason.trim()); setReason(''); setReportFor(null); toast('Report sent to our team') }}>
          <Field label="What happened?" hint="Our team reviews every report.">{(id) => <Textarea id={id} rows={4} required  value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setReportFor(null)}>Cancel</Button><Button variant="destructive">Send report</Button></div>
        </form>
      </Modal>
    </>
  )
}

export function ProviderMessages() {
  const { threads } = useStore()
  return (<><PageHeader title="Messages" subtitle="Reply to enquiries. Your conversation history is saved." />
    <Chat side="provider" threads={threads.filter((t) => t.vendorId === PROVIDER_ID)} nameOf={(t) => t.customer} /></>)
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
  const { me, portfolio, addPortfolio, removePortfolio, toast } = useMe()
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
              <figcaption className="p-3 text-sm font-semibold">{p.title}</figcaption>
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
