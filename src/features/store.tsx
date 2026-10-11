import { categoryPhotos, photo } from '../data/images'
import { toast as notify } from 'sonner'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  allBookings, myEvents, providerAccounts as seedAccounts, reports as seedReports,
  threads as seedThreads, users as seedUsers, vendors as seedVendors,
} from '../data/mock'
import type {
  AccountStatus, Booking, BookingStatus, Category, EventItem, ProviderAccount, Report,
  Session, Thread, UserAccount, Vendor,
} from '../types'
import { uid } from '../utils/format'

export const PROVIDER_ID = 'v1'
export const CUSTOMER_NAME = 'Amara Okoye'

export interface PortfolioItem { id: string; title: string; hue: number; src?: string }

interface Store {
  session: Session | null
  login: (s: Session) => void
  logout: () => void

  vendors: Vendor[]
  updateVendor: (id: string, patch: Partial<Vendor>) => void

  events: EventItem[]
  saveEvent: (e: Omit<EventItem, 'id'> & { id?: string }) => string
  deleteEvent: (id: string) => void

  bookings: Booking[]
  createRequest: (r: Omit<Booking, 'id' | 'status' | 'createdAt' | 'customer'>) => void
  setBookingStatus: (id: string, status: BookingStatus) => void

  threads: Thread[]
  sendMessage: (threadId: string, from: 'customer' | 'provider', text: string) => void
  openThread: (vendorId: string) => string
  markRead: (threadId: string) => void

  allocations: Record<string, Partial<Record<Category, number>>>
  setAllocation: (eventId: string, cat: Category, amount: number) => void

  portfolio: PortfolioItem[]
  addPortfolio: (title: string) => void
  removePortfolio: (id: string) => void

  blockedDates: string[]
  toggleDate: (iso: string) => void

  accounts: ProviderAccount[]
  setAccountStatus: (id: string, status: AccountStatus) => void
  users: UserAccount[]
  setUserStatus: (id: string, status: 'active' | 'suspended') => void
  reports: Report[]
  resolveReport: (id: string) => void
  addReport: (target: string, reason: string) => void

  toast: (text: string) => void
}

const Ctx = createContext<Store | null>(null)

const readSession = (): Session | null => {
  try {
    const raw = localStorage.getItem('eventlink.session')
    return raw ? (JSON.parse(raw) as Session) : null
  } catch { return null }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession)
  const [vendors, setVendors] = useState(seedVendors)
  const [events, setEvents] = useState(myEvents)
  const [bookings, setBookings] = useState(allBookings)
  const [threads, setThreads] = useState(seedThreads)
  const [allocations, setAllocations] = useState<Store['allocations']>({
    e1: { Catering: 7000, Photography: 3500, 'DJs & Music': 2000, 'Tents & Seating': 3000 },
    e2: { Catering: 2500, 'DJs & Music': 800 },
  })
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { id: 'f1', title: 'Harvest wedding feast', hue: 18, src: photo.buffet }, { id: 'f2', title: 'Plated tasting menu', hue: 40, src: photo.platedDinner },
    { id: 'f3', title: 'Garden table styling', hue: 340, src: photo.rusticTable }, { id: 'f4', title: 'Seasonal small plates', hue: 215, src: photo.dishes },
    { id: 'f5', title: 'Floral banquet table', hue: 150, src: photo.tableFlowers }, { id: 'f6', title: 'Live grill station', hue: 8, src: photo.grill },
  ])
  const [blockedDates, setBlockedDates] = useState<string[]>(['2026-10-24', '2026-10-25', '2026-11-14', '2026-11-28'])
  const [accounts, setAccounts] = useState(seedAccounts)
  const [users, setUsers] = useState(seedUsers)
  const [reports, setReports] = useState(seedReports)

  const toast = useCallback((text: string) => { notify(text) }, [])

  const value = useMemo<Store>(() => ({
    session,
    login: (s) => {
      setSession(s)
      try { localStorage.setItem('eventlink.session', JSON.stringify(s)) } catch { /* storage unavailable */ }
    },
    logout: () => {
      setSession(null)
      try { localStorage.removeItem('eventlink.session') } catch { /* storage unavailable */ }
    },

    vendors,
    updateVendor: (id, patch) => setVendors((v) => v.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    events,
    saveEvent: (e) => {
      const id = e.id ?? uid()
      const item: EventItem = { ...e, id }
      setEvents((list) => (e.id ? list.map((x) => (x.id === id ? item : x)) : [...list, item]))
      return id
    },
    deleteEvent: (id) => setEvents((l) => l.filter((x) => x.id !== id)),

    bookings,
    createRequest: (r) =>
      setBookings((b) => [
        { ...r, id: uid(), status: 'pending', createdAt: new Date().toISOString().slice(0, 10), customer: CUSTOMER_NAME },
        ...b,
      ]),
    setBookingStatus: (id, status) => setBookings((b) => b.map((x) => (x.id === id ? { ...x, status } : x))),

    threads,
    sendMessage: (threadId, from, text) =>
      setThreads((t) =>
        t.map((x) =>
          x.id === threadId
            ? { ...x, messages: [...x.messages, { id: uid(), from, text, time: new Date().toISOString() }] }
            : x,
        ),
      ),
    openThread: (vendorId) => {
      const found = threads.find((t) => t.vendorId === vendorId && t.customer === CUSTOMER_NAME)
      if (found) return found.id
      const id = uid()
      setThreads((t) => [...t, { id, vendorId, customer: CUSTOMER_NAME, messages: [], unread: 0 }])
      return id
    },
    markRead: (threadId) => setThreads((t) => t.map((x) => (x.id === threadId && x.unread ? { ...x, unread: 0 } : x))),

    allocations,
    setAllocation: (eventId, cat, amount) =>
      setAllocations((a) => ({ ...a, [eventId]: { ...a[eventId], [cat]: amount } })),

    portfolio,
    addPortfolio: (title) =>
      setPortfolio((p) => [...p, { id: uid(), title, hue: p.length, src: categoryPhotos.Catering[p.length % categoryPhotos.Catering.length] }]),
    removePortfolio: (id) => setPortfolio((p) => p.filter((x) => x.id !== id)),

    blockedDates,
    toggleDate: (iso) => setBlockedDates((d) => (d.includes(iso) ? d.filter((x) => x !== iso) : [...d, iso])),

    accounts,
    setAccountStatus: (id, status) => {
      setAccounts((a) => a.map((x) => (x.id === id ? { ...x, status } : x)))
      const acc = accounts.find((x) => x.id === id)
      if (acc) setVendors((v) => v.map((x) => (x.name === acc.business ? { ...x, verified: status === 'verified' } : x)))
    },
    users,
    setUserStatus: (id, status) => setUsers((u) => u.map((x) => (x.id === id ? { ...x, status } : x))),
    reports,
    resolveReport: (id) => setReports((r) => r.map((x) => (x.id === id ? { ...x, resolved: true } : x))),
    addReport: (target, reason) =>
      setReports((r) => [
        { id: uid(), reporter: session?.name ?? 'Anonymous', target, reason, date: new Date().toISOString().slice(0, 10), resolved: false },
        ...r,
      ]),

    toast,
  }), [session, vendors, events, bookings, threads, allocations, portfolio, blockedDates, accounts, users, reports, toast])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
