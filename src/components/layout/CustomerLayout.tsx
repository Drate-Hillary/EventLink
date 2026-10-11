import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useStore } from '../../features/store'
import { Avatar } from '../ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from './Layouts'

const customerSections = [
  { id: 'events', label: 'My events' },
  { id: 'requests', label: 'Requests' },
  { id: 'find', label: 'Find providers' },
  { id: 'messages', label: 'Messages' },
  { id: 'budget', label: 'Budget' },
] as const

/** One-page customer area: a sticky bar with section links that highlight as you scroll. */
export function CustomerLayout() {
  const { session, logout, threads, bookings } = useStore()
  const navigate = useNavigate()
  const [active, setActive] = useState<string>('events')

  const unread = threads.filter((t) => t.customer === 'Amara Okoye').reduce((n, t) => n + t.unread, 0)
  const pending = bookings.filter((b) => b.customer === 'Amara Okoye' && b.status === 'pending').length
  const badge: Record<string, number> = { messages: unread, requests: pending }

  useEffect(() => {
    const els = customerSections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
    setActive(id)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Logo />
          <nav className="no-scrollbar hidden items-center gap-1 overflow-x-auto md:flex" aria-label="Sections">
            {customerSections.map((s) => (
              <button key={s.id} onClick={() => go(s.id)} aria-current={active === s.id ? 'true' : undefined}
                className={cn('relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors', active === s.id ? 'bg-black text-white' : 'hover:bg-accent')}>
                {s.label}
                {badge[s.id] > 0 && <span className={cn('ml-1.5 rounded-full px-1.5 text-xs', active === s.id ? 'bg-white text-black' : 'bg-black text-white')}>{badge[s.id]}</span>}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden text-sm font-semibold hover:underline lg:block">Home</Link>
            <Avatar name={session?.name ?? 'U'} size="sm" />
            <Button variant="ghost" size="icon" aria-label="Log out" onClick={() => { logout(); navigate('/') }}><LogOut /></Button>
          </div>
        </div>
        <nav className="no-scrollbar container-x flex gap-1 overflow-x-auto pb-2 md:hidden" aria-label="Sections">
          {customerSections.map((s) => (
            <button key={s.id} onClick={() => go(s.id)} aria-current={active === s.id ? 'true' : undefined}
              className={cn('whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors', active === s.id ? 'bg-black text-white' : 'bg-secondary')}>
              {s.label}{badge[s.id] > 0 ? ` (${badge[s.id]})` : ''}
            </button>
          ))}
        </nav>
      </header>
      <main><Outlet /></main>
    </div>
  )
}
