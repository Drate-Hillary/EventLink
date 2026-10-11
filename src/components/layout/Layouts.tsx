import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck, BarChart3, Bell as BellIcon, CalendarRange, ClipboardList, Flag, Image, LayoutDashboard, LineChart,
  LogOut, Menu, MessageSquare, PackageOpen, ScrollText, Sparkles, Star, Store, Tags, UserCog, Users, X, type LucideIcon,
} from 'lucide-react'
import { useStore } from '../../features/store'
import type { Role } from '../../types'
import { Avatar } from '../ui'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Logo({ light }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight" aria-label="EventLink home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-white"><Sparkles className="h-5 w-5" aria-hidden /></span>
      <span className={`text-xl ${light ? 'text-white' : 'text-navy-900'}`}>Event<span className="text-teal-500">Link</span></span>
    </Link>
  )
}

const home: Record<Role, string> = { customer: '/customer', provider: '/provider', admin: '/admin' }

export function PublicLayout() {
  const { session } = useStore()
  const [open, setOpen] = useState(false)
  const links = [{ to: '/vendors', label: 'Find vendors' }, { to: '/#how', label: 'How it works' }, { to: '/#categories', label: 'Services' }]
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-soft bg-ivory/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((l) => <Link key={l.to} to={l.to} className={buttonVariants({ variant: 'ghost' })}>{l.label}</Link>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <Link to={home[session.role]} className={buttonVariants({ variant: 'default' })}>Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className={buttonVariants({ variant: 'ghost' })}>Log in</Link>
                <Link to="/register" className={buttonVariants({ variant: 'default' })}>Create account</Link>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </Button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-soft md:hidden">
              <div className="container-x flex flex-col gap-1 py-3" onClick={() => setOpen(false)}>
                {links.map((l) => <Link key={l.to} to={l.to} className={cn(buttonVariants({ variant: 'ghost' }), "justify-start")}>{l.label}</Link>)}
                {session ? <Link to={home[session.role]} className={cn(buttonVariants({ variant: 'default' }), "mt-2")}>Open dashboard</Link> : (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Link to="/login" className={buttonVariants({ variant: 'outline' })}>Log in</Link>
                    <Link to="/register" className={buttonVariants({ variant: 'default' })}>Create account</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="bg-navy-900 text-slate-300">
        <div className="container-x grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo light />
            <p className="mt-3 max-w-xs text-sm">Find, compare and book trusted event vendors, all in one place.</p>
          </div>
          <FooterCol title="Customers" items={[['Find vendors', '/vendors'], ['Plan an event', '/register'], ['Log in', '/login']]} />
          <FooterCol title="Providers" items={[['Join as a provider', '/register'], ['Provider log in', '/login']]} />
          <FooterCol title="Trust" items={[['Verified vendors', '/vendors'], ['Report a problem', '/login']]} />
        </div>
        <div className="border-t border-white/10 py-4 text-center text-xs">© 2026 EventLink. Bookings and payments are arranged directly between customers and providers.</div>
      </footer>
    </div>
  )
}

function FooterCol({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map(([l, to]) => <li key={l}><Link to={to} className="hover:text-white">{l}</Link></li>)}
      </ul>
    </div>
  )
}

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }
type NavGroup = { label: string; items: NavItem[] }

const nav: Record<'provider' | 'admin', NavGroup[]> = {
  provider: [
    { label: 'Workspace', items: [
      { to: '/provider', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/provider/messages', label: 'Enquiries', icon: MessageSquare },
      { to: '/provider/bookings', label: 'Booking requests', icon: ClipboardList },
    ] },
    { label: 'Business', items: [
      { to: '/provider/profile', label: 'Business profile', icon: UserCog },
      { to: '/provider/portfolio', label: 'Portfolio', icon: Image },
      { to: '/provider/packages', label: 'Services and packages', icon: PackageOpen },
      { to: '/provider/availability', label: 'Availability', icon: CalendarRange },
    ] },
    { label: 'Growth', items: [
      { to: '/provider/reviews', label: 'Reviews', icon: Star },
      { to: '/provider/performance', label: 'Performance', icon: LineChart },
    ] },
  ],
  admin: [
    { label: 'Platform', items: [
      { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
      { to: '/admin/verification', label: 'Provider verification', icon: BadgeCheck },
      { to: '/admin/vendors', label: 'Vendors', icon: Store },
      { to: '/admin/customers', label: 'Customers', icon: Users },
    ] },
    { label: 'Marketplace', items: [
      { to: '/admin/categories', label: 'Service categories', icon: Tags },
      { to: '/admin/requests', label: 'Requests', icon: ClipboardList },
      { to: '/admin/analytics', label: 'Analytics', icon: LineChart },
    ] },
    { label: 'Trust and safety', items: [
      { to: '/admin/reports', label: 'Suspicious activity', icon: Flag },
      { to: '/admin/activity', label: 'Activity log', icon: ScrollText },
    ] },
  ],
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session } = useStore()
  const loc = useLocation()
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (session.role !== role) return <Navigate to={home[session.role]} replace />
  return <>{children}</>
}

interface Note { id: string; to: string; title: string; text: string }

function Bell({ notes }: { notes: Note[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <Button variant="outline" size="icon" aria-label={`Notifications, ${notes.length} new`} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="relative">
        <BellIcon />
        {notes.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-black px-1 text-[11px] font-bold text-white">{notes.length}</span>}
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border bg-white shadow-lift">
            <p className="border-b px-4 py-3 text-sm font-bold">Notifications</p>
            {notes.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-600">You’re all caught up.</p> : (
              <ul className="max-h-80 divide-y overflow-y-auto">
                {notes.map((n) => (
                  <li key={n.id}><Link to={n.to} onClick={() => setOpen(false)} className="block px-4 py-3 transition hover:bg-accent"><p className="text-sm font-semibold">{n.title}</p><p className="text-xs text-slate-600">{n.text}</p></Link></li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DashboardLayout({ role }: { role: 'provider' | 'admin' }) {
  const { session, logout, threads, bookings, accounts, reports } = useStore()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const groups = nav[role]

  const unread = threads.filter((t) => t.vendorId === 'v1').reduce((n, t) => n + t.unread, 0)
  const pendingReq = bookings.filter((b) => b.vendorId === 'v1' && b.status === 'pending').length
  const pendingApps = accounts.filter((a) => a.status === 'pending').length
  const openReports = reports.filter((r) => r.status !== 'resolved').length
  const badge: Record<string, number> = role === 'provider'
    ? { '/provider/messages': unread, '/provider/bookings': pendingReq }
    : { '/admin/verification': pendingApps, '/admin/reports': openReports }

  const notes: Note[] = role === 'provider'
    ? [
        ...(pendingReq ? [{ id: 'n1', to: '/provider/bookings', title: `${pendingReq} request${pendingReq > 1 ? 's' : ''} waiting`, text: 'Accept or decline to keep customers informed.' }] : []),
        ...(unread ? [{ id: 'n2', to: '/provider/messages', title: `${unread} unread message${unread > 1 ? 's' : ''}`, text: 'Customers are waiting for a reply.' }] : []),
      ]
    : [
        ...(pendingApps ? [{ id: 'n1', to: '/admin/verification', title: `${pendingApps} provider application${pendingApps > 1 ? 's' : ''} to review`, text: 'Approve or reject to publish them.' }] : []),
        ...(openReports ? [{ id: 'n2', to: '/admin/reports', title: `${openReports} open report${openReports > 1 ? 's' : ''}`, text: 'Review evidence and record a decision.' }] : []),
      ]

  const current = groups.flatMap((g) => g.items).filter((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to))).sort((a, b) => b.to.length - a.to.length)[0]

  const sidebar = (
    <div className="flex h-full flex-col bg-black p-4 text-slate-300">
      <div className="px-2 py-2"><Logo light /></div>
      <p className="mt-5 px-3 text-xs font-semibold text-white/50">{role === 'admin' ? 'Admin console' : 'Vendor workspace'}</p>
      <nav className="mt-2 flex-1 space-y-5 overflow-y-auto pr-1" aria-label="Dashboard" onClick={() => setOpen(false)}>
        {groups.map((g) => (
          <div key={g.label}>
            <p className="mb-1 px-3 text-[11px] font-semibold text-white/40">{g.label}</p>
            <div className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition', isActive ? 'bg-white text-black' : 'hover:bg-white/10 hover:text-white')}>
                  <Icon className="h-[18px] w-[18px]" aria-hidden /> <span className="flex-1">{label}</span>
                  {(badge[to] ?? 0) > 0 && <span className="rounded-full bg-white/90 px-2 text-xs font-bold text-black ring-1 ring-black/10">{badge[to]}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
        <Avatar name={session?.name ?? 'User'} size="sm" />
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{session?.name}</p><p className="truncate text-xs capitalize text-white/60">{role === 'admin' ? 'Administrator' : 'Provider'}</p></div>
        <button className="rounded-lg p-2 hover:bg-white/10" aria-label="Log out" onClick={() => { logout(); navigate('/') }}><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></Button>
            <div>
              <p className="text-xs text-slate-500">{role === 'admin' ? 'Admin' : 'Vendor'}</p>
              <p className="-mt-0.5 font-bold leading-tight">{current?.label ?? 'Dashboard'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden text-sm font-semibold hover:underline sm:block">View site</Link>
            <Bell notes={notes} />
            <div className="hidden items-center gap-2 rounded-full border py-1 pl-1 pr-3 sm:flex"><Avatar name={session?.name ?? 'U'} size="sm" /><span className="text-sm font-semibold">{session?.name?.split(' ')[0]}</span></div>
          </div>
        </header>
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.div className="absolute inset-y-0 left-0 w-72 max-w-[85vw]" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 32, stiffness: 340 }}>
                {sidebar}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
      </div>
    </div>
  )
}
