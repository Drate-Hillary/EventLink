import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Ban, Check, FileText, Flag, Store, Users, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { monthlySignups } from '../../data/mock'
import { Avatar, EmptyState, PageHeader, Stat, StatusBadge, Tabs, categoryIcon } from '../../components/ui'
import { useStore } from '../../features/store'
import type { AccountStatus } from '../../types'
import { dateLong } from '../../utils/format'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function AdminOverview() {
  const { accounts, users, reports, bookings } = useStore()
  const pending = accounts.filter((a) => a.status === 'pending')
  return (
    <>
      <PageHeader title="Platform overview" subtitle="Verification, trust and activity across EventLink." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={BadgeCheck} label="Awaiting verification" value={pending.length} hint="Review within 2 working days" />
        <Stat icon={Users} label="Total users" value={users.length} hint={`${users.filter((u) => u.status === 'suspended').length} suspended`} />
        <Stat icon={Store} label="Verified providers" value={accounts.filter((a) => a.status === 'verified').length} />
        <Stat icon={Flag} label="Open reports" value={reports.filter((r) => !r.resolved).length} hint={`${bookings.length} requests sent in total`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border bg-card text-card-foreground shadow-card p-5">
          <h2 className="text-lg font-extrabold">New sign-ups by month</h2>
          <div className="mt-4 h-64" role="img" aria-label="Bar chart of customer and provider sign-ups from May to October">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySignups} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E4E2" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#FAFAFA' }} /><Legend />
                <Bar dataKey="customers" name="Customers" fill="#000000" radius={[6, 6, 0, 0]} />
                <Bar dataKey="providers" name="Providers" fill="#A3A3A3" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border bg-card text-card-foreground shadow-card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">Verification queue</h2><Link to="/admin/verification" className="text-sm font-semibold text-teal-700 hover:underline">Open</Link></div>
          {pending.length === 0 ? <p className="text-sm text-slate-600">Queue is empty.</p> : (
            <ul className="divide-y divide-soft">{pending.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3"><Avatar name={a.business} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{a.business}</p><p className="text-xs text-slate-500">{a.category} · {dateLong(a.submitted)}</p></div></li>))}</ul>
          )}
        </section>
      </div>
    </>
  )
}

export function AdminVerification() {
  const { accounts, setAccountStatus, toast } = useStore()
  const [tab, setTab] = useState<AccountStatus>('pending')
  const list = accounts.filter((a) => a.status === tab)
  const set = (id: string, s: AccountStatus, msg: string) => { setAccountStatus(id, s); toast(msg) }
  const count = (s: AccountStatus) => accounts.filter((a) => a.status === s).length

  return (
    <>
      <PageHeader title="Provider verification" subtitle="New providers stay pending until you review their details. Only approved providers display the verified badge." />
      <Tabs id="av" value={tab} onChange={setTab} tabs={(['pending', 'verified', 'rejected', 'suspended'] as const).map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1), count: count(s) }))} />
      <div className="mt-5 space-y-3">
        {list.length === 0 ? <EmptyState icon={BadgeCheck} title={`No ${tab} providers`} text="Providers appear here when their status changes." /> : list.map((a) => {
          const Icon = categoryIcon[a.category]
          return (
            <article key={a.id} className="rounded-2xl border bg-card text-card-foreground shadow-card flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon className="h-6 w-6" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">{a.business}</h2>
                <p className="text-sm text-slate-600">{a.owner} · {a.category} · {a.location} · submitted {dateLong(a.submitted)}</p>
                <p className="mt-1 flex flex-wrap gap-2 text-xs">{a.documents.length ? a.documents.map((d) => <span key={d} className="inline-flex items-center gap-1 rounded-full bg-ivory px-2.5 py-1 font-semibold"><FileText className="h-3 w-3" aria-hidden />{d}</span>) : <span className="font-semibold text-black">No documents submitted</span>}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={a.status} />
                {a.status === 'pending' && <>
                  <Button className="!py-2 h-auto" onClick={() => set(a.id, 'verified', `${a.business} approved`)}><Check className="h-4 w-4" /> Approve</Button>
                  <Button variant="outline" className="!py-2 h-auto" onClick={() => set(a.id, 'rejected', `${a.business} rejected`)}><X className="h-4 w-4" /> Reject</Button></>}
                {a.status === 'verified' && <Button variant="outline" className="!py-2 text-black h-auto" onClick={() => set(a.id, 'suspended', `${a.business} suspended`)}><Ban className="h-4 w-4" /> Suspend</Button>}
                {(a.status === 'suspended' || a.status === 'rejected') && <Button variant="outline" className="!py-2 h-auto" onClick={() => set(a.id, 'pending', `${a.business} moved back to pending`)}>Review again</Button>}
              </div>
            </article>)
        })}
      </div>
    </>
  )
}

export function AdminUsers() {
  const { users, setUserStatus, toast } = useStore()
  const [q, setQ] = useState('')
  const [role, setRole] = useState<'all' | 'customer' | 'provider'>('all')
  const list = users.filter((u) => (role === 'all' || u.role === role) && (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader title="Users" subtitle="Customers and providers on the platform. Suspended users cannot log in." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs id="au" value={role} onChange={setRole} tabs={[{ value: 'all', label: 'Everyone' }, { value: 'customer', label: 'Customers' }, { value: 'provider', label: 'Providers' }]} />
        <label className="sm:w-72"><span className="sr-only">Search users</span><Input  placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      </div>
      <Card className="overflow-x-auto">
        <Table className="w-full min-w-[640px] text-left text-sm">
          <TableHeader className="border-b border-soft bg-ivory text-xs font-semibold text-slate-500"><TableRow><TableHead className="p-4">User</TableHead><TableHead className="p-4">Role</TableHead><TableHead className="p-4">Joined</TableHead><TableHead className="p-4">Status</TableHead><TableHead className="p-4 text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody className="divide-y divide-soft">
            {list.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="p-4"><div className="flex items-center gap-3"><Avatar name={u.name} size="sm" /><div><p className="font-bold">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></div></div></TableCell>
                <TableCell className="p-4 capitalize">{u.role}</TableCell><TableCell className="p-4">{dateLong(u.joined)}</TableCell><TableCell className="p-4"><StatusBadge status={u.status} /></TableCell>
                <TableCell className="p-4 text-right">{u.status === 'active'
                  ? <Button variant="outline" className="!py-1.5 text-black h-auto" onClick={() => { setUserStatus(u.id, 'suspended'); toast(`${u.name} suspended`) }}>Suspend</Button>
                  : <Button variant="outline" className="!py-1.5 h-auto" onClick={() => { setUserStatus(u.id, 'active'); toast(`${u.name} reactivated`) }}>Reactivate</Button>}</TableCell>
              </TableRow>))}
            {list.length === 0 && <TableRow><TableCell colSpan={5} className="p-8 text-center text-slate-500">No users match your search.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}

export function AdminServices() {
  const { vendors } = useStore()
  return (
    <>
      <PageHeader title="Services" subtitle="Every listed provider, their category and packages." />
      <Card className="overflow-x-auto">
        <Table className="w-full min-w-[720px] text-left text-sm">
          <TableHeader className="border-b border-soft bg-ivory text-xs font-semibold text-slate-500"><TableRow><TableHead className="p-4">Provider</TableHead><TableHead className="p-4">Category</TableHead><TableHead className="p-4">Areas</TableHead><TableHead className="p-4">Packages</TableHead><TableHead className="p-4">Rating</TableHead><TableHead className="p-4">Badge</TableHead></TableRow></TableHeader>
          <TableBody className="divide-y divide-soft">{vendors.map((v) => (
            <TableRow key={v.id}><TableCell className="p-4"><Link to={`/vendors/${v.id}`} className="font-bold hover:underline">{v.name}</Link></TableCell><TableCell className="p-4">{v.category}</TableCell><TableCell className="p-4">{v.areas.join(', ')}</TableCell><TableCell className="p-4">{v.packages.length}</TableCell><TableCell className="p-4">{v.rating.toFixed(1)}</TableCell>
              <TableCell className="p-4">{v.verified ? <StatusBadge status="verified" /> : <span className="text-slate-400">None</span>}</TableCell></TableRow>))}</TableBody>
        </Table>
      </Card>
    </>
  )
}

export function AdminReports() {
  const { reports, resolveReport, toast } = useStore()
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  const list = reports.filter((r) => (tab === 'open' ? !r.resolved : r.resolved))
  return (
    <>
      <PageHeader title="Reports" subtitle="Suspicious activity reported by customers and providers." />
      <Tabs id="ar" value={tab} onChange={setTab} tabs={[{ value: 'open', label: 'Open', count: reports.filter((r) => !r.resolved).length }, { value: 'resolved', label: 'Resolved', count: reports.filter((r) => r.resolved).length }]} />
      <div className="mt-5 space-y-3">
        {list.length === 0 ? <EmptyState icon={Flag} title="No reports here" text="Reports from the community will appear in this list." /> : list.map((r) => (
          <article key={r.id} className="rounded-2xl border bg-card text-card-foreground shadow-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">{r.reporter} reported <strong className="text-navy-900">{r.target}</strong> · {dateLong(r.date)}</p>
              <p className="mt-1">{r.reason}</p>
            </div>
            <div className="flex items-center gap-2"><StatusBadge status={r.resolved ? 'resolved' : 'open'} />
              {!r.resolved && <Button className="!py-2 h-auto" onClick={() => { resolveReport(r.id); toast('Report resolved') }}>Mark resolved</Button>}</div>
          </article>))}
      </div>
    </>
  )
}
