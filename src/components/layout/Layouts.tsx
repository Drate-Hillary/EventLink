import { useState, type ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BadgeCheck, BarChart3, CalendarCheck, CalendarRange, ClipboardList, Flag, Image, LayoutDashboard,
  LogOut, Menu, MessageSquare, PackageOpen, Sparkles, Star, UserCog, Users, X, type LucideIcon,
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
const nav: Record<'provider' | 'admin', NavItem[]> = {
  provider: [
    { to: '/provider', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/provider/bookings', label: 'Requests', icon: ClipboardList },
    { to: '/provider/messages', label: 'Messages', icon: MessageSquare },
    { to: '/provider/profile', label: 'Business profile', icon: UserCog },
    { to: '/provider/portfolio', label: 'Portfolio', icon: Image },
    { to: '/provider/packages', label: 'Packages', icon: PackageOpen },
    { to: '/provider/availability', label: 'Availability', icon: CalendarRange },
    { to: '/provider/reviews', label: 'Reviews', icon: Star },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
    { to: '/admin/verification', label: 'Verification', icon: BadgeCheck },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/services', label: 'Services', icon: CalendarCheck },
    { to: '/admin/reports', label: 'Reports', icon: Flag },
  ],
}

export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { session } = useStore()
  const loc = useLocation()
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (session.role !== role) return <Navigate to={home[session.role]} replace />
  return <>{children}</>
}

export function DashboardLayout({ role }: { role: 'provider' | 'admin' }) {
  const { session, logout, threads, bookings } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const items = nav[role]
  const unread = threads.filter((t) => (t.vendorId === 'v1')).reduce((n, t) => n + t.unread, 0)
  const pending = role === 'provider' ? bookings.filter((b) => b.vendorId === 'v1' && b.status === 'pending').length : 0
  const badge = (to: string) => (to.endsWith('messages') ? unread : to === '/provider/bookings' ? pending : 0)

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900 p-4 text-slate-300">
      <div className="px-2 py-2"><Logo light /></div>
      <p className="mt-6 px-3 text-xs font-semibold text-slate-400">{role === 'admin' ? 'Administration' : 'Provider portal'}</p>
      <nav className="mt-2 flex-1 space-y-1 overflow-y-auto" aria-label="Dashboard" onClick={() => setOpen(false)}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-teal-600 text-white' : 'hover:bg-white/10 hover:text-white'}`}>
            <Icon className="h-5 w-5" aria-hidden /> <span className="flex-1">{label}</span>
            {badge(to) > 0 && <span className="rounded-full bg-white px-2 text-xs font-bold text-black">{badge(to)}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <Avatar name={session?.name ?? 'User'} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{session?.name}</p>
          <p className="truncate text-xs capitalize text-slate-400">{role}</p>
        </div>
        <button className="rounded-lg p-2 hover:bg-white/10" aria-label="Log out" onClick={() => { logout(); navigate('/') }}><LogOut className="h-4 w-4" /></button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block">{sidebar}</aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-soft bg-ivory/90 px-4 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></Button>
          <Logo />
          <Avatar name={session?.name ?? 'U'} size="sm" />
        </header>
        <AnimatePresence>
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div className="absolute inset-0 bg-navy-950/60" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
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
