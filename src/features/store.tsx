import { categoryPhotos } from '../data/images'
import { toast as notify } from 'sonner'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type {
  AccountStatus, ActivityEntry, AppNotification, Booking, CategoryItem, ReportStatus, BookingStatus, Category, ChatMessage, EventItem, Pkg,
  PortfolioItem, ProviderAccount, Report, Role, Session, SubscriptionPayment, Thread, UserAccount, Vendor,
} from '../types'

export type { PortfolioItem } from '../types'

export interface RegisterInput { name: string; email: string; password: string; role: 'customer' | 'provider'; business?: string; category?: string }

interface Store {
  /** False until the saved auth session (if any) has been restored. */
  ready: boolean
  session: Session | null
  login: (email: string, password: string) => Promise<{ error?: string; role?: Role }>
  register: (input: RegisterInput) => Promise<{ error?: string; needsConfirmation?: boolean }>
  logout: () => Promise<void>

  vendors: Vendor[]
  /** The signed-in provider's vendor id, or null. */
  myVendorId: string | null
  updateVendor: (id: string, patch: Partial<Vendor>) => void
  savePackage: (pkg: Pkg, isNew: boolean) => void
  deletePackage: (id: string) => void

  events: EventItem[]
  saveEvent: (e: Omit<EventItem, 'id'> & { id?: string }) => string
  deleteEvent: (id: string) => void

  bookings: Booking[]
  createRequest: (r: Omit<Booking, 'id' | 'status' | 'createdAt' | 'customer'> & {
    eventId?: string
    customer?: string
    customerEmail?: string
    customerPhone?: string
    customerLocation?: string
    guestRequestId?: string
  }) => Promise<boolean>
  setBookingStatus: (id: string, status: BookingStatus) => void
  billingPriceUgx: number
  subscriptionPayments: SubscriptionPayment[]
  setBillingPrice: (priceUgx: number) => Promise<boolean>
  requestSubscriptionPayment: (paymentReference: string) => Promise<boolean>
  setSubscriptionPaymentStatus: (id: string, status: 'paid' | 'rejected') => Promise<boolean>

  threads: Thread[]
  sendMessage: (threadId: string, from: 'customer' | 'provider', text: string) => void
  openThread: (vendorId: string) => Promise<string | null>
  markRead: (threadId: string) => void
  notifications: AppNotification[]
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  allocations: Record<string, Partial<Record<Category, number>>>
  setAllocation: (eventId: string, cat: Category, amount: number) => void

  portfolio: PortfolioItem[]
  movePortfolio: (id: string, dir: -1 | 1) => void
  addPortfolio: (title: string, file?: File) => void
  removePortfolio: (id: string) => void

  blockedDates: string[]
  toggleDate: (iso: string) => void

  accounts: ProviderAccount[]
  setAccountStatus: (id: string, status: AccountStatus) => void
  users: UserAccount[]
  setUserStatus: (id: string, status: 'active' | 'suspended') => void
  reports: Report[]
  updateReport: (id: string, status: ReportStatus, decision?: string) => void
  requestInfo: (accountId: string, note: string) => Promise<boolean>
  activity: ActivityEntry[]
  categories: CategoryItem[]
  addCategory: (name: string, description: string) => void
  updateCategory: (id: string, patch: Partial<CategoryItem>) => void
  addReport: (target: string, reason: string) => void

  toast: (text: string) => void
}

const Ctx = createContext<Store | null>(null)

/* ---------- Row -> app shape ---------- */
/* eslint-disable @typescript-eslint/no-explicit-any */
const day = (ts: string | null | undefined) => (ts ?? '').slice(0, 10)

const toPortfolio = (r: any): PortfolioItem => ({ id: r.id, title: r.title, hue: r.hue, src: r.image_url ?? undefined })

const toVendor = (r: any): Vendor => {
  const packages: Pkg[] = [...(r.packages ?? [])].sort((a, b) => a.position - b.position)
    .map((p) => ({ id: p.id, name: p.name, price: Number(p.price), description: p.description, includes: p.includes }))
  const reviews = [...(r.reviews ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((x) => ({ id: x.id, author: x.author, rating: x.rating, text: x.text, date: day(x.created_at), eventType: x.event_type }))
  const portfolio = [...(r.portfolio_items ?? [])].sort((a, b) => a.position - b.position).map(toPortfolio)
  const uploaded = portfolio.map((p) => p.src).filter((s): s is string => !!s)
  const fallback = categoryPhotos[r.category as Category] ?? categoryPhotos.Catering
  return {
    id: r.id, ownerId: r.owner_id, name: r.name, category: r.category, location: r.location, areas: r.areas,
    about: r.about, phone: r.phone, email: r.email, hue: r.hue, available: r.available,
    status: r.verification_status, verified: r.verification_status === 'verified',
    rating: reviews.length ? Math.round((reviews.reduce((n, x) => n + x.rating, 0) / reviews.length) * 10) / 10 : 0,
    reviewCount: reviews.length,
    priceFrom: packages.length ? Math.min(...packages.map((p) => p.price)) : 0,
    packages, reviews, portfolio,
    photos: uploaded.length ? uploaded : fallback,
    ownerName: r.owner?.full_name ?? '', submitted: day(r.submitted_at), documents: r.documents ?? [],
  }
}

const toAccount = (v: Vendor): ProviderAccount => ({
  id: v.id, business: v.name, owner: v.ownerName ?? '', category: v.category, location: v.location,
  status: v.status ?? 'pending', submitted: v.submitted ?? '', documents: v.documents ?? [],
})

const toBooking = (r: any): Booking => ({
  id: r.id, eventId: r.event_id ?? '', vendorId: r.vendor_id, customerId: r.customer_id, customer: r.customer_name,
  packageName: r.package_name, kind: r.kind, status: r.status, note: r.note, createdAt: day(r.created_at), eventDate: r.event_date ?? undefined,
  customerEmail: r.customer_email ?? undefined,
  customerPhone: r.customer_phone ?? undefined,
  customerLocation: r.customer_location ?? undefined,
  guestRequestId: r.guest_request_id ?? undefined,
})

const toMessage = (m: any): ChatMessage => ({ id: m.id, from: m.sender, text: m.body, time: m.created_at })

const toThread = (r: any, role: Role): Thread => ({
  id: r.id, vendorId: r.vendor_id, customerId: r.customer_id, customer: r.customer_name,
  unread: role === 'provider' ? r.vendor_unread : r.customer_unread,
  messages: [...(r.messages ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(toMessage),
})

const toEvent = (r: any): EventItem => ({
  id: r.id, name: r.name, type: r.type, date: r.date ?? '', location: r.location,
  guests: r.guests, budget: Number(r.budget), categories: r.categories,
})
const toNotification = (r: any): AppNotification => ({
  id: r.id, kind: r.kind, title: r.title, body: r.body, href: r.href,
  createdAt: r.created_at, readAt: r.read_at,
})
const toSubscriptionPayment = (r: any): SubscriptionPayment => ({
  id: r.id, vendorId: r.vendor_id, amountUgx: Number(r.amount_ugx), status: r.status,
  paymentReference: r.payment_reference ?? '', receiptNumber: r.receipt_number ?? undefined,
  createdAt: r.created_at, paidAt: r.paid_at ?? undefined,
  periodStart: r.period_start ?? undefined, periodEnd: r.period_end ?? undefined,
})
/* eslint-enable @typescript-eslint/no-explicit-any */

const VENDOR_SELECT = '*, packages(*), reviews(*), portfolio_items(*), owner:profiles(full_name)'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [threads, setThreads] = useState<Thread[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [allocations, setAllocations] = useState<Store['allocations']>({})
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [users, setUsers] = useState<UserAccount[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [billingPriceUgx, setBillingPriceUgx] = useState(0)
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPayment[]>([])

  const toast = useCallback((text: string) => { notify(text) }, [])
  const fail = useCallback((what: string, error: { message: string } | null) => {
    if (error) notify.error(`${what}: ${error.message}`)
    return !!error
  }, [])

  const myVendorId = useMemo(
    () => (session?.role === 'provider' ? vendors.find((v) => v.ownerId === session.id)?.id ?? null : null),
    [session, vendors],
  )
  const me = vendors.find((v) => v.id === myVendorId)
  const portfolio = useMemo(() => me?.portfolio ?? [], [me])
  const accounts = useMemo(() => vendors.map(toAccount), [vendors])

  /* ---------- Auth ---------- */
  useEffect(() => {
    let current: string | null | undefined
    const resolve = async (u: { id: string } | null) => {
      setSubscriptionPayments([])
      setBillingPriceUgx(0)
      if (!u) { setSession(null); setNotifications([]); setReady(true); return }
      const { data, error } = await supabase.from('profiles').select('full_name, email, role, status').eq('id', u.id).single()
      if (u.id !== current) return
      if (error) {
        notify.error(`Could not restore your profile: ${error.message}`)
        setSession(null)
        setReady(true)
        return
      }
      if (!data || data.status === 'suspended') {
        if (data?.status === 'suspended') notify.error('Your account is suspended. Contact support.')
        else notify.error('Your account profile could not be found. Contact support.')
        setSession(null)
        setReady(true)
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) notify.error(`Could not sign out: ${signOutError.message}`)
        return
      }
      setSession({ id: u.id, name: data.full_name || data.email, email: data.email, role: data.role })
      setReady(true)
    }
    // Fires once on subscribe with the restored session, then on every sign-in/out.
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      const u = s?.user ?? null
      if ((u?.id ?? null) === current) return
      current = u?.id ?? null
      // Calling Supabase inside this callback can deadlock, so defer it.
      setTimeout(() => void resolve(u), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  /* ---------- Load data for whoever is signed in ---------- */
  const loadVendors = useCallback(async () => {
    const { data, error } = await supabase.from('vendors').select(VENDOR_SELECT).order('created_at')
    if (!fail('Could not load vendors', error)) setVendors((data ?? []).map(toVendor))
  }, [fail])

  const loadThreads = useCallback(async (role: Role) => {
    const { data, error } = await supabase.from('threads').select('*, messages(*)').order('created_at')
    if (!fail('Could not load messages', error)) setThreads((data ?? []).map((r) => toThread(r, role)))
  }, [fail])

  const loadBillingPayments = useCallback(async (role: Role, vendorId?: string) => {
    if (role === 'provider' && !vendorId) return
    let query = supabase.from('provider_subscription_payments').select('*').order('created_at', { ascending: false })
    if (role === 'provider') query = query.eq('vendor_id', vendorId!)
    const { data, error } = await query
    if (!fail('Could not load subscription payments', error)) setSubscriptionPayments((data ?? []).map(toSubscriptionPayment))
  }, [fail])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    const role = session?.role
    const none = Promise.resolve({ data: null, error: null })
    const load = async () => {
      const paymentRows = role === 'admin'
        ? supabase.from('provider_subscription_payments').select('*').order('created_at', { ascending: false })
        : role === 'provider' && myVendorId
          ? supabase.from('provider_subscription_payments').select('*').eq('vendor_id', myVendorId).order('created_at', { ascending: false })
          : none
      const [cats, books, evs, allocs, blocked, profs, reps, acts, notes, billing, payments] = await Promise.all([
        supabase.from('categories').select('*').order('created_at'),
        role ? supabase.from('bookings').select('*').order('created_at', { ascending: false }) : none,
        role === 'customer' ? supabase.from('events').select('*').order('date') : none,
        role === 'customer' ? supabase.from('budget_allocations').select('*') : none,
        role === 'provider' ? supabase.from('vendors').select('id, vendor_blocked_dates(day)').eq('owner_id', session!.id).maybeSingle() : none,
        role === 'admin' ? supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false }) : none,
        role === 'admin' ? supabase.from('reports').select('*, profiles(full_name)').order('created_at', { ascending: false }) : none,
        role === 'admin' ? supabase.from('activity_log').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(200) : none,
        role ? supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50) : none,
        role ? supabase.from('platform_billing_settings').select('monthly_price_ugx').eq('singleton', true).single() : none,
        paymentRows,
      ])
      if (cancelled) return
      fail('Could not load data', [cats, books, evs, allocs, blocked, profs, reps, acts, notes, billing, payments].find((r) => r.error)?.error ?? null)

      setCategories((cats.data ?? []).map((c) => ({ id: c.id, name: c.name, description: c.description, active: c.active })))
      setBookings((books.data ?? []).map(toBooking))
      setEvents((evs.data ?? []).map(toEvent))
      const a: Store['allocations'] = {}
      for (const r of allocs.data ?? []) (a[r.event_id] ??= {})[r.category as Category] = Number(r.amount)
      setAllocations(a)
      setBlockedDates((blocked.data?.vendor_blocked_dates ?? []).map((d: { day: string }) => d.day))
      setUsers((profs.data ?? []).map((u) => ({ id: u.id, name: u.full_name || u.email, email: u.email, role: u.role, status: u.status, joined: day(u.created_at) })))
      setReports((reps.data ?? []).map((r) => ({ id: r.id, reporter: r.profiles?.full_name ?? 'Unknown', target: r.target, reason: r.reason, date: day(r.created_at), status: r.status, decision: r.decision ?? undefined })))
      setActivity((acts.data ?? []).map((x) => ({ id: x.id, actor: x.profiles?.full_name ?? 'Admin', action: x.action, target: x.target, time: x.created_at.slice(0, 16) })))
      setNotifications((notes.data ?? []).map(toNotification))
      setBillingPriceUgx(Number(billing.data?.monthly_price_ugx ?? 0))
      setSubscriptionPayments((payments.data ?? []).map(toSubscriptionPayment))
      if (role) await loadThreads(role); else setThreads([])
      await loadVendors()
    }
    void load()
    return () => { cancelled = true }
  }, [ready, session, myVendorId, fail, loadVendors, loadThreads])

  useEffect(() => {
    if (!session) return
    const role = session.role
    const vendorId = myVendorId ?? undefined
    if (role === 'provider' && !vendorId) return
    const channel = supabase.channel(`subscription-payments:${session.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'provider_subscription_payments',
        ...(role === 'provider' ? { filter: `vendor_id=eq.${vendorId}` } : {}),
      }, () => { void loadBillingPayments(role, vendorId) })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [session, myVendorId, loadBillingPayments])

  /* ---------- Live chat ---------- */
  useEffect(() => {
    const role = session?.role
    if (!role) return
    const channel = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, ({ new: m }) => {
        const msg = toMessage(m)
        setThreads((ts) => {
          const t = ts.find((x) => x.id === m.thread_id)
          // A thread we haven't loaded yet means someone just opened a new conversation.
          if (!t) { void loadThreads(role); return ts }
          if (t.messages.some((x) => x.id === msg.id)) return ts
          const mine = msg.from === role
          return ts.map((x) => (x.id === t.id ? { ...x, messages: [...x.messages, msg], unread: mine ? x.unread : x.unread + 1 } : x))
        })
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [session?.role, loadThreads])

  /* ---------- Live booking updates ---------- */
  useEffect(() => {
    if (!session) return
    if (session.role === 'provider' && !myVendorId) return

    const filter = session.role === 'provider'
      ? `vendor_id=eq.${myVendorId}`
      : session.role === 'customer'
        ? `customer_id=eq.${session.id}`
        : undefined
    const channel = supabase.channel(`bookings:${session.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        ...(filter ? { filter } : {}),
      }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setBookings((current) => current.filter((booking) => booking.id !== payload.old.id))
          return
        }

        const item = toBooking(payload.new)
        setBookings((current) => current.some((booking) => booking.id === item.id)
          ? current.map((booking) => booking.id === item.id ? item : booking)
          : [item, ...current])
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [session, myVendorId])

  useEffect(() => {
    if (!session) return

    const channel = supabase.channel(`notifications:${session.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${session.id}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const item = toNotification(payload.new)
          setNotifications((current) => [item, ...current.filter((n) => n.id !== item.id)].slice(0, 50))
        } else if (payload.eventType === 'UPDATE') {
          const item = toNotification(payload.new)
          setNotifications((current) => current.map((n) => n.id === item.id ? item : n))
        }
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [session])

  /* ---------- Budget writes are debounced (sliders fire on every step) ---------- */
  const allocTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const log = useCallback((action: string, target: string) => {
    if (session?.role !== 'admin') return
    const entry = { id: crypto.randomUUID(), actor: session.name, action, target, time: new Date().toISOString().slice(0, 16) }
    setActivity((a) => [entry, ...a])
    void supabase.from('activity_log').insert({ id: entry.id, actor_id: session.id, action, target }).then(({ error }) => fail('Could not record activity', error))
  }, [session, fail])

  const value = useMemo<Store>(() => ({
    ready,
    session,
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      const { data: p, error: profileError } = await supabase.from('profiles').select('role, status').eq('id', data.user.id).single()
      if (profileError || !p) {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) notify.error(`Could not sign out: ${signOutError.message}`)
        return { error: profileError?.message ?? 'Your account profile could not be found. Contact support.' }
      }
      if (p.status === 'suspended') {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) notify.error(`Could not sign out: ${signOutError.message}`)
        return { error: 'Your account is suspended. Contact support.' }
      }
      return { role: p.role }
    },
    register: async ({ name, email, password, role, business, category }) => {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name, role, business, category }, emailRedirectTo: `${window.location.origin}/login` },
      })
      if (error) return { error: error.message }
      return { needsConfirmation: !data.session }
    },
    logout: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) fail('Could not log out', error)
    },

    vendors,
    myVendorId,
    updateVendor: (id, patch) => {
      setVendors((v) => v.map((x) => (x.id === id ? { ...x, ...patch } : x)))
      const row: Record<string, unknown> = {}
      for (const k of ['name', 'category', 'location', 'areas', 'about', 'phone', 'email', 'hue', 'available'] as const) if (k in patch) row[k] = patch[k]
      if (Object.keys(row).length) void supabase.from('vendors').update(row).eq('id', id).then(({ error }) => { if (fail('Could not save profile', error)) void loadVendors() })
    },
    savePackage: (pkg, isNew) => {
      if (!myVendorId) return
      const id = isNew ? crypto.randomUUID() : pkg.id
      const next = { ...pkg, id }
      setVendors((vs) => vs.map((v) => {
        if (v.id !== myVendorId) return v
        const packages = isNew ? [...v.packages, next] : v.packages.map((p) => (p.id === id ? next : p))
        return { ...v, packages, priceFrom: Math.min(...packages.map((p) => p.price)) }
      }))
      const row = { id, vendor_id: myVendorId, name: pkg.name, price: pkg.price, description: pkg.description, includes: pkg.includes, ...(isNew ? { position: me?.packages.length ?? 0 } : {}) }
      void supabase.from('packages').upsert(row).then(({ error }) => { if (fail('Could not save package', error)) void loadVendors() })
    },
    deletePackage: (id) => {
      setVendors((vs) => vs.map((v) => {
        if (v.id !== myVendorId) return v
        const packages = v.packages.filter((p) => p.id !== id)
        return { ...v, packages, priceFrom: packages.length ? Math.min(...packages.map((p) => p.price)) : 0 }
      }))
      void supabase.from('packages').delete().eq('id', id).then(({ error }) => { if (fail('Could not delete package', error)) void loadVendors() })
    },

    events,
    saveEvent: (e) => {
      const id = e.id ?? crypto.randomUUID()
      const item: EventItem = { ...e, id }
      setEvents((list) => (e.id ? list.map((x) => (x.id === id ? item : x)) : [...list, item]))
      const row = { id, customer_id: session?.id, name: e.name, type: e.type, date: e.date || null, location: e.location, guests: e.guests, budget: e.budget, categories: e.categories }
      void supabase.from('events').upsert(row).then(({ error }) => {
        if (fail('Could not save event', error)) setEvents((list) => (e.id ? list : list.filter((x) => x.id !== id)))
      })
      return id
    },
    deleteEvent: (id) => {
      setEvents((l) => l.filter((x) => x.id !== id))
      void supabase.from('events').delete().eq('id', id).then(({ error }) => fail('Could not delete event', error))
    },

    bookings,
    createRequest: async (r) => {
      const now = new Date().toISOString()
      const date = now.slice(0, 10)
      const targetVendor = vendors.find((v) => v.id === r.vendorId)
      if (!targetVendor) {
        notify.error('The selected provider could not be found.')
        return false
      }
      if (session && session.role !== 'customer') {
        notify.error('Only customer accounts can send service requests.')
        return false
      }
      const targets = session
        ? targetVendor.verified ? [targetVendor] : []
        : vendors.filter((v) => v.category === targetVendor.category && v.verified)
      if (targets.length === 0) {
        notify.error('There are no verified providers available for this service.')
        return false
      }
      const guestName = (r.customer || session?.name || '').trim()
      if (!session && (!guestName || !r.customerEmail?.trim() || !r.customerPhone?.trim() || !r.customerLocation?.trim())) {
        notify.error('Guest requests require a name, email, phone number and location.')
        return false
      }
      const guestRequestId = r.guestRequestId ?? crypto.randomUUID()
      const created = targets.map((vendor) => ({
        ...r,
        id: crypto.randomUUID(),
        vendorId: vendor.id,
        customerId: session?.id ?? null,
        status: 'pending' as const,
        createdAt: date,
        customer: guestName,
        customerEmail: r.customerEmail,
        customerPhone: r.customerPhone,
        customerLocation: r.customerLocation,
        guestRequestId,
      }))

      const rows = created.map((item) => ({
          id: item.id,
          event_id: item.eventId || null,
          vendor_id: item.vendorId,
          customer_id: session?.id ?? null,
          customer_name: guestName,
          customer_email: session ? null : item.customerEmail?.trim() ?? null,
          customer_phone: session ? null : item.customerPhone?.trim() ?? null,
          customer_location: session ? null : item.customerLocation?.trim() ?? null,
          guest_request_id: session ? null : item.guestRequestId ?? guestRequestId,
          package_name: item.packageName,
          kind: item.kind,
          status: 'pending' as const,
          note: item.note,
          event_date: item.eventDate || null,
      }))
      try {
        const { error } = await supabase.from('bookings').insert(rows)
        if (fail('Could not send request', error)) return false
      } catch (error) {
        notify.error(`Could not save request: ${error instanceof Error ? error.message : String(error)}`)
        return false
      }

      setBookings((current) => [...created.filter((item) => !current.some((booking) => booking.id === item.id)), ...current])
      return true
    },
    setBookingStatus: (id, status) => {
      const before = bookings.find((x) => x.id === id)?.status
      setBookings((b) => b.map((x) => (x.id === id ? { ...x, status } : x)))
      if (session) {
        void supabase.from('bookings').update({ status }).eq('id', id).then(({ error }) => {
          if (fail('Could not update request', error) && before) setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: before } : x)))
        })
      }
    },
    billingPriceUgx,
    subscriptionPayments,
    setBillingPrice: async (priceUgx) => {
      if (!Number.isSafeInteger(priceUgx) || priceUgx <= 0) {
        notify.error('Enter a monthly price greater than zero UGX.')
        return false
      }
      const { error } = await supabase.from('platform_billing_settings')
        .update({ monthly_price_ugx: priceUgx, updated_by: session?.id, updated_at: new Date().toISOString() })
        .eq('singleton', true)
      if (fail('Could not save subscription price', error)) return false
      setBillingPriceUgx(priceUgx)
      log('Updated monthly provider subscription price', `UGX ${priceUgx.toLocaleString('en-UG')}`)
      return true
    },
    requestSubscriptionPayment: async (paymentReference) => {
      if (!myVendorId) {
        notify.error('Your provider profile could not be found.')
        return false
      }
      const { error } = await supabase.from('provider_subscription_payments').insert({
        vendor_id: myVendorId, payment_reference: paymentReference.trim(),
      })
      if (fail('Could not submit subscription payment', error)) return false
      await loadBillingPayments('provider', myVendorId)
      return true
    },
    setSubscriptionPaymentStatus: async (id, status) => {
      const payment = subscriptionPayments.find((p) => p.id === id)
      const { error } = await supabase.from('provider_subscription_payments').update({ status }).eq('id', id)
      if (fail('Could not update subscription payment', error)) return false
      if (session?.role) await loadBillingPayments(session.role, myVendorId ?? undefined)
      if (payment) {
        const business = vendors.find((vendor) => vendor.id === payment.vendorId)?.name ?? payment.vendorId
        log(status === 'paid' ? 'Confirmed provider subscription payment' : 'Rejected provider subscription payment', business)
      }
      return true
    },

    threads,
    sendMessage: (threadId, from, text) => {
      if (!session) return
      const msg = { id: crypto.randomUUID(), from, text, time: new Date().toISOString() }
      setThreads((t) => t.map((x) => (x.id === threadId ? { ...x, messages: [...x.messages, msg] } : x)))
      void supabase.from('messages').insert({ id: msg.id, thread_id: threadId, sender_id: session.id, sender: from, body: text }).then(({ error }) => {
        if (fail('Message not sent', error)) setThreads((t) => t.map((x) => (x.id === threadId ? { ...x, messages: x.messages.filter((m) => m.id !== msg.id) } : x)))
      })
    },
    openThread: async (vendorId) => {
      if (!session) return null
      const found = threads.find((t) => t.vendorId === vendorId && t.customerId === session.id)
      if (found) return found.id
      const { error } = await supabase.from('threads')
        .upsert({ vendor_id: vendorId, customer_id: session.id }, { onConflict: 'vendor_id,customer_id', ignoreDuplicates: true })
      if (fail('Could not start conversation', error)) return null
      const { data } = await supabase.from('threads').select('*, messages(*)').eq('vendor_id', vendorId).eq('customer_id', session.id).single()
      if (!data) return null
      const t = toThread(data, session.role)
      setThreads((ts) => (ts.some((x) => x.id === t.id) ? ts : [...ts, t]))
      return t.id
    },
    markRead: (threadId) => {
      const t = threads.find((x) => x.id === threadId)
      if (!t?.unread) return
      setThreads((ts) => ts.map((x) => (x.id === threadId ? { ...x, unread: 0 } : x)))
      const col = session?.role === 'provider' ? 'vendor_unread' : 'customer_unread'
      void supabase.from('threads').update({ [col]: 0 }).eq('id', threadId).then(({ error }) => fail('Could not mark as read', error))
    },
    notifications,
    markNotificationRead: (id) => {
      const item = notifications.find((n) => n.id === id)
      if (!item || item.readAt) return
      const readAt = new Date().toISOString()
      setNotifications((items) => items.map((n) => n.id === id ? { ...n, readAt } : n))
      void supabase.from('notifications').update({ read_at: readAt }).eq('id', id).is('read_at', null).then(({ error }) => {
        if (fail('Could not mark notification as read', error)) {
          setNotifications((items) => items.map((n) => n.id === id ? { ...n, readAt: null } : n))
        }
      })
    },
    markAllNotificationsRead: () => {
      const unread = notifications.filter((n) => !n.readAt)
      if (!unread.length || !session) return
      const readAt = new Date().toISOString()
      const ids = unread.map((n) => n.id)
      setNotifications((items) => items.map((n) => ids.includes(n.id) ? { ...n, readAt } : n))
      void supabase.from('notifications').update({ read_at: readAt }).in('id', ids).is('read_at', null).then(({ error }) => {
        if (fail('Could not mark notifications as read', error)) {
          setNotifications((items) => items.map((n) => ids.includes(n.id) ? { ...n, readAt: null } : n))
        }
      })
    },

    allocations,
    setAllocation: (eventId, cat, amount) => {
      setAllocations((a) => ({ ...a, [eventId]: { ...a[eventId], [cat]: amount } }))
      const key = `${eventId}:${cat}`
      clearTimeout(allocTimers.current[key])
      allocTimers.current[key] = setTimeout(() => {
        void supabase.from('budget_allocations').upsert({ event_id: eventId, category: cat, amount }).then(({ error }) => fail('Could not save budget', error))
      }, 500)
    },

    portfolio,
    addPortfolio: (title, file) => {
      if (!myVendorId || !session) return
      void (async () => {
        let image_url: string
        if (file) {
          const path = `${session.id}/${crypto.randomUUID()}.${file.name.split('.').pop() || 'jpg'}`
          const { error } = await supabase.storage.from('portfolio').upload(path, file, { contentType: file.type })
          if (fail('Could not upload photo', error)) return
          image_url = supabase.storage.from('portfolio').getPublicUrl(path).data.publicUrl
        } else {
          const pics = categoryPhotos[me?.category ?? 'Catering']
          image_url = pics[portfolio.length % pics.length]
        }
        const { error } = await supabase.from('portfolio_items').insert({ vendor_id: myVendorId, title, image_url, hue: portfolio.length * 40 % 360, position: portfolio.length })
        if (!fail('Could not add photo', error)) void loadVendors()
      })()
    },
    movePortfolio: (id, dir) => {
      const i = portfolio.findIndex((x) => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= portfolio.length) return
      const next = [...portfolio]; [next[i], next[j]] = [next[j], next[i]]
      setVendors((vs) => vs.map((v) => (v.id === myVendorId ? { ...v, portfolio: next } : v)))
      void Promise.all([
        supabase.from('portfolio_items').update({ position: i }).eq('id', next[i].id),
        supabase.from('portfolio_items').update({ position: j }).eq('id', next[j].id),
      ]).then((rs) => fail('Could not reorder photos', rs.find((r) => r.error)?.error ?? null))
    },
    removePortfolio: (id) => {
      setVendors((vs) => vs.map((v) => (v.id === myVendorId ? { ...v, portfolio: (v.portfolio ?? []).filter((p) => p.id !== id) } : v)))
      void supabase.from('portfolio_items').delete().eq('id', id).then(({ error }) => fail('Could not remove photo', error))
    },

    blockedDates,
    toggleDate: (iso) => {
      if (!myVendorId) return
      const blocked = blockedDates.includes(iso)
      setBlockedDates((d) => (blocked ? d.filter((x) => x !== iso) : [...d, iso]))
      const q = blocked
        ? supabase.from('vendor_blocked_dates').delete().eq('vendor_id', myVendorId).eq('day', iso)
        : supabase.from('vendor_blocked_dates').insert({ vendor_id: myVendorId, day: iso })
      void q.then(({ error }) => fail('Could not update availability', error))
    },

    accounts,
    setAccountStatus: (id, status) => {
      setVendors((v) => v.map((x) => (x.id === id ? { ...x, status, verified: status === 'verified' } : x)))
      const acc = accounts.find((x) => x.id === id)
      void supabase.from('vendors').update({ verification_status: status }).eq('id', id).then(({ error }) => {
        if (fail('Could not update provider', error)) return void loadVendors()
        if (acc) log(({ verified: 'Approved provider', rejected: 'Rejected provider', suspended: 'Suspended provider', pending: 'Moved provider to pending' } as Record<string, string>)[status], acc.business)
      })
    },
    users,
    setUserStatus: (id, status) => {
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, status } : x)))
      const who = users.find((x) => x.id === id)
      void supabase.from('profiles').update({ status }).eq('id', id).then(({ error }) => {
        if (fail('Could not update user', error)) return
        if (who) log(status === 'suspended' ? `Suspended ${who.role}` : `Reactivated ${who.role}`, who.name)
      })
    },
    reports,
    updateReport: (id, status, decision) => {
      setReports((r) => r.map((x) => (x.id === id ? { ...x, status, decision: decision ?? x.decision } : x)))
      const rep = reports.find((x) => x.id === id)
      void supabase.from('reports').update({ status, ...(decision !== undefined ? { decision } : {}) }).eq('id', id).then(({ error }) => {
        if (fail('Could not update report', error)) return
        if (rep) log(status === 'resolved' ? 'Resolved report' : 'Started investigating report', rep.target)
      })
    },
    requestInfo: async (accountId, note) => {
      const acc = accounts.find((x) => x.id === accountId)
      if (!acc) {
        notify.error('Provider profile could not be found.')
        return false
      }
      const { error } = await supabase.rpc('request_provider_information', {
        p_vendor_id: accountId,
        p_note: note.trim(),
      })
      if (fail('Could not send information request', error)) return false
      log(`Requested more information (${note.trim()})`, acc.business)
      return true
    },
    activity,
    categories,
    addCategory: (name, description) => {
      const id = crypto.randomUUID()
      setCategories((c) => [...c, { id, name, description, active: true }])
      void supabase.from('categories').insert({ id, name, description }).then(({ error }) => {
        if (fail('Could not add category', error)) return setCategories((c) => c.filter((x) => x.id !== id))
        log('Added service category', name)
      })
    },
    updateCategory: (id, patch) => {
      setCategories((c) => c.map((x) => (x.id === id ? { ...x, ...patch } : x)))
      const cat = categories.find((x) => x.id === id)
      const row = { name: patch.name, description: patch.description, active: patch.active }
      void supabase.from('categories').update(row).eq('id', id).then(({ error }) => {
        if (fail('Could not update category', error)) return
        if (cat) log(patch.active === undefined ? 'Edited service category' : patch.active ? 'Activated service category' : 'Deactivated service category', patch.name ?? cat.name)
      })
    },
    addReport: (target, reason) => {
      if (!session) return
      const id = crypto.randomUUID()
      setReports((r) => [{ id, reporter: session.name, target, reason, date: new Date().toISOString().slice(0, 10), status: 'open' as const }, ...r])
      void supabase.from('reports').insert({ id, reporter_id: session.id, target, reason }).then(({ error }) => fail('Could not send report', error))
    },

    toast,
  }), [ready, session, vendors, myVendorId, me, events, bookings, threads, notifications, allocations, portfolio, blockedDates, accounts, users, reports, activity, categories, billingPriceUgx, subscriptionPayments, log, toast, fail, loadVendors, loadBillingPayments])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
