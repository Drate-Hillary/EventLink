import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Ban, BadgeCheck, Check, ClipboardList, FileText, Flag, HelpCircle, Plus, Search, Store, Tags, UserX, Users, X,
} from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { monthlySignups, requestTrend, verificationOutcomes } from '../../data/mock'
import { Avatar, EmptyState, Field, Modal, PageHeader, SelectInput, Stat, StatusBadge, Tabs, categoryIcon } from '../../components/ui'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useStore } from '../../features/store'
import type { AccountStatus, ProviderAccount, ReportStatus } from '../../types'
import { dateLong, timeShort } from '../../utils/format'

const INK = '#000000'
const GREY = '#A3A3A3'
const GRID = '#E4E4E2'

const ChartCard = ({ title, insight, children }: { title: string; insight?: string; children: ReactNode }) => (
  <Card className="p-5">
    <h2 className="font-bold">{title}</h2>
    {insight && <p className="mt-0.5 text-sm text-slate-600">{insight}</p>}
    <div className="mt-4 h-60" role="img" aria-label={title}>{children}</div>
  </Card>
)

const axis = { tickLine: false, axisLine: false, fontSize: 12 } as const

const sinceOptions = [
  { value: '', label: 'Any time' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' },
]
const withinDays = (iso: string, days: string) => !days || (Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86400000 <= Number(days)

function SearchBox({ q, onQ, placeholder }: { q: string; onQ: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <Input aria-label={placeholder} placeholder={placeholder} value={q} onChange={(e) => onQ(e.target.value)} className="bg-white pl-10" />
    </div>
  )
}

function FilterBar({ q, onQ, placeholder, children }: { q: string; onQ: (v: string) => void; placeholder: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchBox q={q} onQ={onQ} placeholder={placeholder} />
      <div className="flex flex-wrap gap-3">{children}</div>
    </div>
  )
}

const th = 'bg-ivory text-xs font-semibold'

function byCategory(bookings: { vendorId: string }[], vendors: { id: string; category: string }[]) {
  const m = new Map<string, number>()
  bookings.forEach((b) => { const c = vendors.find((v) => v.id === b.vendorId)?.category; if (c) m.set(c, (m.get(c) ?? 0) + 1) })
  return [...m].map(([name, requests]) => ({ name, requests })).sort((a, b) => b.requests - a.requests)
}

/* ------------------------------------------------------------------ Overview */
export function AdminOverview() {
  const { accounts, users, reports, bookings, vendors, activity, setAccountStatus, toast } = useStore()
  const pending = accounts.filter((a) => a.status === 'pending')
  const openReports = reports.filter((r) => r.status !== 'resolved')
  const customers = users.filter((u) => u.role === 'customer').length
  const byCat = useMemo(() => byCategory(bookings, vendors), [bookings, vendors])

  return (
    <>
      <PageHeader title="Platform overview" subtitle="What needs attention across EventLink today." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={Users} label="Customers" value={customers} hint="Registered accounts" />
        <Stat icon={Store} label="Vendors" value={accounts.length} hint="All provider accounts" />
        <Stat icon={BadgeCheck} label="Pending" value={pending.length} hint="Awaiting verification" />
        <Stat icon={Check} label="Approved" value={accounts.filter((a) => a.status === 'verified').length} hint="Show a verified badge" />
        <Stat icon={UserX} label="Suspended" value={accounts.filter((a) => a.status === 'suspended').length + users.filter((u) => u.status === 'suspended').length} hint="Vendors and customers" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Verification queue</h2><Link to="/admin/verification" className="text-sm font-semibold hover:underline">Open centre</Link></div>
          {pending.length === 0 ? <p className="py-6 text-center text-sm text-slate-600">Queue is empty. New applications appear here.</p> : (
            <ul className="divide-y">
              {pending.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar name={a.business} size="sm" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{a.business}</p><p className="text-xs text-slate-500">{a.category} · applied {dateLong(a.submitted)} · {a.documents.length} documents</p></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setAccountStatus(a.id, 'verified'); toast(`${a.business} approved`) }}><Check className="h-4 w-4" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => { setAccountStatus(a.id, 'rejected'); toast(`${a.business} rejected`) }}>Reject</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Open reports</h2><Link to="/admin/reports" className="text-sm font-semibold hover:underline">View all</Link></div>
          {openReports.length === 0 ? <p className="py-6 text-center text-sm text-slate-600">No open reports.</p> : (
            <ul className="space-y-3">
              {openReports.map((r) => (
                <li key={r.id} className="rounded-2xl bg-secondary p-3">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-bold">{r.target}</p><StatusBadge status={r.status} /></div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-700">{r.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="New sign-ups" insight="Customer growth is outpacing provider growth, so keep approving applications quickly.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySignups} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} /><XAxis dataKey="month" {...axis} /><YAxis {...axis} />
              <Tooltip cursor={{ fill: '#FAFAFA' }} /><Legend />
              <Bar dataKey="customers" name="Customers" fill={INK} radius={[6, 6, 0, 0]} /><Bar dataKey="providers" name="Providers" fill={GREY} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Requests by category" insight={byCat[0] ? `${byCat[0].name} receives the most requests.` : undefined}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCat} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} /><XAxis type="number" allowDecimals={false} {...axis} /><YAxis type="category" dataKey="name" width={110} {...axis} />
              <Tooltip cursor={{ fill: '#FAFAFA' }} /><Bar dataKey="requests" name="Requests" fill={INK} radius={[0, 6, 6, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card className="mt-6 p-5">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Recent admin activity</h2><Link to="/admin/activity" className="text-sm font-semibold hover:underline">Full log</Link></div>
        <ol className="space-y-3">
          {activity.slice(0, 5).map((a) => (
            <li key={a.id} className="flex items-start gap-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-black" /><p><strong>{a.action}</strong> · {a.target}<span className="block text-xs text-slate-500">{a.actor} · {dateLong(a.time.slice(0, 10))} {timeShort(a.time)}</span></p></li>
          ))}
        </ol>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ Verification centre */
export function AdminVerification() {
  const { accounts, setAccountStatus, requestInfo, toast } = useStore()
  const [tab, setTab] = useState<AccountStatus>('pending')
  const [q, setQ] = useState('')
  const [detail, setDetail] = useState<ProviderAccount | null>(null)
  const [asking, setAsking] = useState<ProviderAccount | null>(null)
  const [note, setNote] = useState('')
  const list = accounts.filter((a) => a.status === tab && (a.business + a.owner).toLowerCase().includes(q.toLowerCase()))
  const count = (s: AccountStatus) => accounts.filter((a) => a.status === s).length
  const set = (id: string, s: AccountStatus, msg: string) => { setAccountStatus(id, s); setDetail(null); toast(msg) }

  return (
    <>
      <PageHeader title="Provider verification" subtitle="New providers stay pending until you review their details. Only approved providers show the verified badge and appear in public search." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs id="av" value={tab} onChange={setTab} tabs={(['pending', 'verified', 'rejected', 'suspended'] as const).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: count(s) }))} />
        <SearchBox q={q} onQ={setQ} placeholder="Search applications" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.length === 0 ? <div className="md:col-span-2"><EmptyState icon={BadgeCheck} title={`No ${tab} providers`} text="Providers appear here when their status changes." /></div> : list.map((a) => {
          const Icon = categoryIcon[a.category]
          return (
            <Card key={a.id} className="flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-secondary"><Icon className="h-6 w-6" aria-hidden /></span>
                <div className="min-w-0 flex-1"><h2 className="truncate font-bold">{a.business}</h2><p className="text-sm text-slate-600">{a.owner} · {a.location}</p></div>
                <StatusBadge status={a.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-slate-500">Category</dt><dd className="font-semibold">{a.category}</dd></div>
                <div><dt className="text-xs text-slate-500">Applied</dt><dd className="font-semibold">{dateLong(a.submitted)}</dd></div>
              </dl>
              <p className="mt-3 flex flex-wrap gap-1.5 text-xs">{a.documents.length ? a.documents.map((d) => <span key={d} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold"><FileText className="h-3 w-3" aria-hidden />{d}</span>) : <span className="font-semibold">No documents submitted</span>}</p>
              <div className="mt-auto flex flex-wrap gap-2 border-t pt-4 mt-5">
                <Button size="sm" variant="outline" onClick={() => setDetail(a)}>Review details</Button>
                {a.status === 'pending' && <>
                  <Button size="sm" onClick={() => set(a.id, 'verified', `${a.business} approved`)}><Check className="h-4 w-4" /> Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => set(a.id, 'rejected', `${a.business} rejected`)}><X className="h-4 w-4" /> Reject</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setAsking(a); setNote('') }}><HelpCircle className="h-4 w-4" /> Request info</Button>
                </>}
                {a.status === 'verified' && <Button size="sm" variant="destructive" onClick={() => set(a.id, 'suspended', `${a.business} suspended`)}><Ban className="h-4 w-4" /> Suspend</Button>}
                {(a.status === 'suspended' || a.status === 'rejected') && <Button size="sm" variant="outline" onClick={() => set(a.id, 'pending', `${a.business} moved back to pending`)}>Review again</Button>}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.business ?? ''} wide>
        {detail && (
          <div className="space-y-5">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {[['Owner', detail.owner], ['Category', detail.category], ['Location', detail.location], ['Applied', dateLong(detail.submitted)]].map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
            </dl>
            <div>
              <p className="mb-2 text-sm font-semibold">Supporting documents</p>
              {detail.documents.length === 0 ? <p className="text-sm text-slate-600">None submitted. Consider rejecting or requesting information.</p> : (
                <ul className="space-y-2">{detail.documents.map((d) => <li key={d} className="flex items-center justify-between rounded-2xl border p-3 text-sm"><span className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4" aria-hidden />{d}</span><span className="text-xs text-slate-500">Uploaded</span></li>)}</ul>
              )}
            </div>
            {detail.status === 'pending' && (
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button variant="ghost" onClick={() => { setAsking(detail); setNote(''); setDetail(null) }}>Request info</Button>
                <Button variant="outline" onClick={() => set(detail.id, 'rejected', `${detail.business} rejected`)}>Reject</Button>
                <Button onClick={() => set(detail.id, 'verified', `${detail.business} approved`)}>Approve provider</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!asking} onClose={() => setAsking(null)} title={`Request information from ${asking?.business ?? ''}`}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!asking) return; requestInfo(asking.id, note.trim()); toast('Request sent to provider'); setAsking(null) }}>
          <Field label="What do you need?" hint="The provider sees this note and can resubmit.">{(id) => <Textarea id={id} rows={4} required value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setAsking(null)}>Cancel</Button><Button>Send request</Button></div>
        </form>
      </Modal>
    </>
  )
}

/* ------------------------------------------------------------------ Vendors */
export function AdminVendors() {
  const { accounts, setAccountStatus, categories, toast } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [status, setStatus] = useState('')
  const [since, setSince] = useState('')
  const list = accounts.filter((a) => (a.business + a.owner).toLowerCase().includes(q.toLowerCase()) && (!cat || a.category === cat) && (!status || a.status === status) && withinDays(a.submitted, since))
  const act = (a: ProviderAccount, s: AccountStatus, msg: string) => { setAccountStatus(a.id, s); toast(msg) }

  return (
    <>
      <PageHeader title="Vendors" subtitle="Search, filter and manage every provider account." />
      <FilterBar q={q} onQ={setQ} placeholder="Search vendors">
        <SelectInput aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className="w-44 bg-white"><option value="">All categories</option>{categories.map((c) => <option key={c.id}>{c.name}</option>)}</SelectInput>
        <SelectInput aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40 bg-white"><option value="">All statuses</option>{['pending', 'verified', 'rejected', 'suspended'].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</SelectInput>
        <SelectInput aria-label="Registered" value={since} onChange={(e) => setSince(e.target.value)} className="w-40 bg-white">{sinceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</SelectInput>
      </FilterBar>
      <Card className="overflow-hidden">
        <Table className="min-w-[760px]">
          <TableHeader><TableRow className={th}><TableHead>Vendor</TableHead><TableHead>Category</TableHead><TableHead>Location</TableHead><TableHead>Applied</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((a) => (
              <TableRow key={a.id}>
                <TableCell><div className="flex items-center gap-3"><Avatar name={a.business} size="sm" /><div><p className="font-bold">{a.business}</p><p className="text-xs text-slate-500">{a.owner}</p></div></div></TableCell>
                <TableCell>{a.category}</TableCell><TableCell>{a.location}</TableCell><TableCell>{dateLong(a.submitted)}</TableCell><TableCell><StatusBadge status={a.status} /></TableCell>
                <TableCell className="space-x-2 text-right">
                  {a.status === 'pending' && <><Button size="sm" onClick={() => act(a, 'verified', `${a.business} approved`)}>Approve</Button><Button size="sm" variant="outline" onClick={() => act(a, 'rejected', `${a.business} rejected`)}>Reject</Button></>}
                  {a.status === 'verified' && <Button size="sm" variant="destructive" onClick={() => act(a, 'suspended', `${a.business} suspended`)}>Suspend</Button>}
                  {(a.status === 'suspended' || a.status === 'rejected') && <Button size="sm" variant="outline" onClick={() => act(a, 'verified', `${a.business} reinstated`)}>Reinstate</Button>}
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-500">No vendors match these filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ Customers */
export function AdminCustomers() {
  const { users, setUserStatus, bookings, toast } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [since, setSince] = useState('')
  const list = users.filter((u) => u.role === 'customer' && (u.name + u.email).toLowerCase().includes(q.toLowerCase()) && (!status || u.status === status) && withinDays(u.joined, since))
  return (
    <>
      <PageHeader title="Customers" subtitle="View customer accounts and suspend those that break platform rules. Suspended users cannot log in." />
      <FilterBar q={q} onQ={setQ} placeholder="Search name or email">
        <SelectInput aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40 bg-white"><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></SelectInput>
        <SelectInput aria-label="Registered" value={since} onChange={(e) => setSince(e.target.value)} className="w-40 bg-white">{sinceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</SelectInput>
      </FilterBar>
      <Card className="overflow-hidden">
        <Table className="min-w-[640px]">
          <TableHeader><TableRow className={th}><TableHead>Customer</TableHead><TableHead>Joined</TableHead><TableHead>Requests</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((u) => (
              <TableRow key={u.id}>
                <TableCell><div className="flex items-center gap-3"><Avatar name={u.name} size="sm" /><div><p className="font-bold">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div></div></TableCell>
                <TableCell>{dateLong(u.joined)}</TableCell><TableCell>{bookings.filter((b) => b.customer === u.name).length}</TableCell><TableCell><StatusBadge status={u.status} /></TableCell>
                <TableCell className="text-right">{u.status === 'active'
                  ? <Button size="sm" variant="destructive" onClick={() => { setUserStatus(u.id, 'suspended'); toast(`${u.name} suspended`) }}>Suspend</Button>
                  : <Button size="sm" variant="outline" onClick={() => { setUserStatus(u.id, 'active'); toast(`${u.name} reactivated`) }}>Reactivate</Button>}</TableCell>
              </TableRow>
            ))}
            {list.length === 0 && <TableRow><TableCell colSpan={5} className="py-10 text-center text-slate-500">No customers match these filters.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}

/* ------------------------------------------------------------------ Categories */
export function AdminCategories() {
  const { categories, addCategory, updateCategory, vendors, toast } = useStore()
  const [editing, setEditing] = useState<{ id?: string; name: string; description: string } | null>(null)
  const [err, setErr] = useState('')
  const save = () => {
    if (!editing) return
    if (editing.name.trim().length < 2) return setErr('Enter a category name.')
    if (categories.some((c) => c.id !== editing.id && c.name.toLowerCase() === editing.name.trim().toLowerCase())) return setErr('That category already exists.')
    if (editing.id) updateCategory(editing.id, { name: editing.name.trim(), description: editing.description }); else addCategory(editing.name.trim(), editing.description)
    toast(editing.id ? 'Category updated' : 'Category added'); setEditing(null); setErr('')
  }
  return (
    <>
      <PageHeader title="Service categories" subtitle="Organise what providers can offer. Deactivated categories are hidden from search." action={<Button onClick={() => { setEditing({ name: '', description: '' }); setErr('') }}><Plus className="h-4 w-4" /> Add category</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const n = vendors.filter((v) => v.category === c.name).length
          const Icon = (categoryIcon as Record<string, typeof Tags>)[c.name] ?? Tags
          return (
            <Card key={c.id} className={cn('flex flex-col p-5', !c.active && 'opacity-60')}>
              <div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary"><Icon className="h-5 w-5" aria-hidden /></span><StatusBadge status={c.active ? 'active' : 'suspended'} /></div>
              <h2 className="mt-4 font-bold">{c.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{c.description || 'No description'}</p>
              <p className="mt-3 text-sm font-semibold">{n} {n === 1 ? 'provider' : 'providers'}</p>
              <div className="mt-auto flex gap-2 border-t pt-4 mt-4">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setEditing({ id: c.id, name: c.name, description: c.description }); setErr('') }}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => { updateCategory(c.id, { active: !c.active }); toast(c.active ? `${c.name} deactivated` : `${c.name} activated`) }}>{c.active ? 'Deactivate' : 'Activate'}</Button>
              </div>
            </Card>
          )
        })}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? 'Edit category' : 'Add category'}>
        {editing && (
          <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); save() }}>
            <Field label="Name" error={err}>{(id) => <Input id={id} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />}</Field>
            <Field label="Description">{(id) => <Input id={id} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />}</Field>
            <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button>Save category</Button></div>
          </form>
        )}
      </Modal>
    </>
  )
}

/* ------------------------------------------------------------------ Requests */
export function AdminRequests() {
  const { bookings, vendors } = useStore()
  const [tab, setTab] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')
  const [q, setQ] = useState('')
  const list = bookings.filter((b) => (tab === 'all' || b.status === tab) && (b.customer + (vendors.find((v) => v.id === b.vendorId)?.name ?? '')).toLowerCase().includes(q.toLowerCase()))
  const n = (s: string) => bookings.filter((b) => b.status === s).length
  return (
    <>
      <PageHeader title="Requests" subtitle="Every quote and booking request on the platform. Payments are agreed directly between customers and providers." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs id="ar2" value={tab} onChange={setTab} tabs={[{ value: 'all', label: 'All', count: bookings.length }, { value: 'pending', label: 'Pending', count: n('pending') }, { value: 'accepted', label: 'Accepted', count: n('accepted') }, { value: 'declined', label: 'Declined', count: n('declined') }]} />
        <SearchBox q={q} onQ={setQ} placeholder="Search customer or vendor" />
      </div>
      <Card className="overflow-hidden">
        <Table className="min-w-[760px]">
          <TableHeader><TableRow className={th}><TableHead>Customer</TableHead><TableHead>Vendor</TableHead><TableHead>Package</TableHead><TableHead>Type</TableHead><TableHead>Sent</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((b) => (
              <TableRow key={b.id}><TableCell className="font-bold">{b.customer}</TableCell><TableCell>{vendors.find((v) => v.id === b.vendorId)?.name}</TableCell><TableCell>{b.packageName}</TableCell><TableCell>{b.kind === 'quote' ? 'Quote' : 'Booking'}</TableCell><TableCell>{dateLong(b.createdAt)}</TableCell><TableCell><StatusBadge status={b.status} /></TableCell></TableRow>
            ))}
            {list.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-500">No requests match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><ClipboardList className="h-4 w-4" aria-hidden /> Read-only view. Providers decide on requests from their own workspace.</p>
    </>
  )
}

/* ------------------------------------------------------------------ Analytics */
export function AdminAnalytics() {
  const { bookings, vendors, accounts } = useStore()
  const byCat = useMemo(() => byCategory(bookings, vendors), [bookings, vendors])
  const last = verificationOutcomes[verificationOutcomes.length - 1]
  const rate = Math.round((last.approved / (last.approved + last.rejected)) * 100)
  const lastReq = requestTrend[requestTrend.length - 1]
  const conv = Math.round((lastReq.bookings / lastReq.quotes) * 100)
  return (
    <>
      <PageHeader title="Analytics" subtitle="Trends that help you decide where to act. Figures for earlier months are sample data." />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Provider registrations" insight={`${accounts.filter((a) => a.status === 'pending').length} applications are waiting. Faster reviews keep new providers from dropping off.`}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlySignups} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} /><XAxis dataKey="month" {...axis} /><YAxis {...axis} /><Tooltip cursor={{ fill: '#FAFAFA' }} /><Bar dataKey="providers" name="Providers" fill={INK} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Verification outcomes" insight={`${rate}% of decisions in ${last.month} were approvals.`}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={verificationOutcomes} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} /><XAxis dataKey="month" {...axis} /><YAxis {...axis} /><Tooltip cursor={{ fill: '#FAFAFA' }} /><Legend /><Bar dataKey="approved" name="Approved" stackId="a" fill={INK} /><Bar dataKey="rejected" name="Rejected" stackId="a" fill={GREY} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Booking-request trend" insight={`${conv}% of ${lastReq.month} quote requests turned into booking requests.`}>
          <ResponsiveContainer width="100%" height="100%"><LineChart data={requestTrend} margin={{ left: -20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} /><XAxis dataKey="month" {...axis} /><YAxis {...axis} /><Tooltip /><Legend /><Line type="monotone" dataKey="quotes" name="Quotes" stroke={GREY} strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="bookings" name="Bookings" stroke={INK} strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Most requested categories" insight={byCat[0] ? `${byCat[0].name} leads. Recruit more providers in thinner categories.` : undefined}>
          <ResponsiveContainer width="100%" height="100%"><BarChart data={byCat} layout="vertical" margin={{ left: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} /><XAxis type="number" allowDecimals={false} {...axis} /><YAxis type="category" dataKey="name" width={110} {...axis} /><Tooltip cursor={{ fill: '#FAFAFA' }} /><Bar dataKey="requests" name="Requests" fill={INK} radius={[0, 6, 6, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Suspicious activity */
export function AdminReports() {
  const { reports, updateReport, accounts, users, setAccountStatus, setUserStatus, toast } = useStore()
  const [tab, setTab] = useState<ReportStatus>('open')
  const [deciding, setDeciding] = useState<string | null>(null)
  const [decision, setDecision] = useState('')
  const list = reports.filter((r) => r.status === tab)
  const n = (s: ReportStatus) => reports.filter((r) => r.status === s).length

  const suspendTarget = (target: string) => {
    const acc = accounts.find((a) => a.business === target)
    const usr = users.find((u) => u.name === target)
    if (acc) { setAccountStatus(acc.id, 'suspended'); toast(`${target} suspended`) }
    else if (usr) { setUserStatus(usr.id, 'suspended'); toast(`${target} suspended`) }
    else toast('No matching account to suspend')
  }

  return (
    <>
      <PageHeader title="Suspicious activity" subtitle="Reports from customers and providers. Review the evidence, record a decision and track the outcome." />
      <Tabs id="ar" value={tab} onChange={setTab} tabs={(['open', 'investigating', 'resolved'] as const).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: n(s) }))} />
      <div className="mt-5 space-y-4">
        {list.length === 0 ? <EmptyState icon={Flag} title={`No ${tab} reports`} text="Reports from the community will appear in this list." /> : list.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-sm text-slate-500">{r.reporter} reported</p><h2 className="text-lg font-bold">{r.target}</h2><p className="text-xs text-slate-500">{dateLong(r.date)}</p></div>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-3 rounded-2xl bg-secondary p-4 text-sm">{r.reason}</p>
            {r.decision && <p className="mt-3 text-sm"><strong>Decision:</strong> {r.decision}</p>}
            {r.status !== 'resolved' && (
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                {r.status === 'open' && <Button size="sm" variant="outline" onClick={() => { updateReport(r.id, 'investigating'); toast('Marked as investigating') }}>Start investigating</Button>}
                <Button size="sm" onClick={() => { setDeciding(r.id); setDecision(r.decision ?? '') }}>Record decision and resolve</Button>
                <Button size="sm" variant="destructive" onClick={() => suspendTarget(r.target)}><Ban className="h-4 w-4" /> Suspend {r.target}</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      <Modal open={!!deciding} onClose={() => setDeciding(null)} title="Record decision">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!deciding) return; updateReport(deciding, 'resolved', decision.trim()); toast('Report resolved'); setDeciding(null) }}>
          <Field label="What did you decide, and why?" hint="This is saved to the report and the activity log.">{(id) => <Textarea id={id} rows={4} required value={decision} onChange={(e) => setDecision(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setDeciding(null)}>Cancel</Button><Button>Resolve report</Button></div>
        </form>
      </Modal>
    </>
  )
}

/* ------------------------------------------------------------------ Activity log */
export function AdminActivity() {
  const { activity } = useStore()
  const [q, setQ] = useState('')
  const list = activity.filter((a) => (a.action + a.target + a.actor).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader title="Admin activity log" subtitle="Who approved, rejected or suspended an account, and when. Visible to administrators only." />
      <FilterBar q={q} onQ={setQ} placeholder="Search the log" />
      <Card className="overflow-hidden">
        <Table className="min-w-[640px]">
          <TableHeader><TableRow className={th}><TableHead>When</TableHead><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead></TableRow></TableHeader>
          <TableBody>
            {list.map((a) => <TableRow key={a.id}><TableCell className="whitespace-nowrap">{dateLong(a.time.slice(0, 10))} · {timeShort(a.time)}</TableCell><TableCell>{a.actor}</TableCell><TableCell className="font-semibold">{a.action}</TableCell><TableCell>{a.target}</TableCell></TableRow>)}
            {list.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-slate-500">No entries match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
