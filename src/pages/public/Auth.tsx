import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Briefcase, Eye, EyeOff, ShieldCheck, User } from 'lucide-react'
import { Logo } from '../../components/layout/Layouts'
import { Field } from '../../components/ui'
import { useStore } from '../../features/store'
import type { Role } from '../../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectInput } from '@/components/ui'

const dest: Record<Role, string> = { customer: '/customer', provider: '/provider', admin: '/admin' }

function PasswordInput({ id, autoComplete, value, onChange }: { id: string; autoComplete: string; value: string; onChange: (e: { target: { value: string } }) => void }) {
  const [showPassword, setShowPassword] = useState(false)
  const Icon = showPassword ? EyeOff : Eye

  return (
    <div className="relative">
      <Input id={id} type={showPassword ? 'text' : 'password'} autoComplete={autoComplete} value={value} onChange={onChange} className="pr-11" />
      <button
        type="button"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
        onClick={() => setShowPassword((show) => !show)}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </button>
    </div>
  )
}

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mt-1 text-slate-600">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-navy-900 lg:block">
        <div className="absolute inset-0 grid place-items-center p-12 text-white">
          <div className="max-w-sm">
            <ShieldCheck className="h-10 w-10 text-teal-500" aria-hidden />
            <p className="mt-4 text-2xl font-extrabold leading-tight">Every provider with a badge has been checked by a real person.</p>
            <p className="mt-3 text-slate-300">We review business details and documents before a provider appears as verified.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { login, session, ready } = useStore()
  const navigate = useNavigate()
  const routeState = useLocation().state as {
    from?: string
    bookingFollowUp?: { name: string; email: string; guestRequestId: string }
  } | null
  const from = routeState?.from
  const bookingFollowUp = routeState?.bookingFollowUp
  const [email, setEmail] = useState(bookingFollowUp?.email ?? '')
  const [pw, setPw] = useState('')
  const [errors, setErrors] = useState<{ email?: string; pw?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (ready && session && !bookingFollowUp) navigate(dest[session.role], { replace: true })
  }, [ready, session, bookingFollowUp, navigate])

  const submit = async () => {
    const e: typeof errors = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address.'
    if (pw.length < 6) e.pw = 'Password must be at least 6 characters.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    const { error, role } = await login(email, pw, bookingFollowUp?.guestRequestId)
    setBusy(false)
    if (error || !role) return setErrors({ form: error ?? 'Could not log in.' })
    navigate(from && from.startsWith(dest[role]) ? from : dest[role])
  }

  return (
    <Shell title="Welcome back" subtitle="Log in to manage your events, bookings and messages.">
      <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); void submit() }}>
        <Field label="Email" error={errors.email} hint={bookingFollowUp ? 'Use the email address from your booking.' : undefined}>{(id) => <Input id={id} type="email" autoComplete="email" readOnly={!!bookingFollowUp} value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label="Password" error={errors.pw}>{(id) => <PasswordInput id={id} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />}</Field>
        {errors.form && <p role="alert" className="rounded-xl border border-black p-3 text-sm font-semibold">{errors.form}</p>}
        <Button className="w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</Button>
        <p className="text-center text-sm text-slate-600">New to EventLink? <Link to="/register" className="font-semibold text-teal-700 hover:underline">Create an account</Link></p>
      </form>
    </Shell>
  )
}

export function Register() {
  const { register, categories, toast } = useStore()
  const navigate = useNavigate()
  const bookingFollowUp = (useLocation().state as {
    bookingFollowUp?: { name: string; email: string; guestRequestId: string }
  } | null)?.bookingFollowUp
  const [role, setRole] = useState<'customer' | 'provider'>('customer')
  const [f, setF] = useState({
    name: bookingFollowUp?.name ?? '',
    business: '',
    category: '',
    email: bookingFollowUp?.email ?? '',
    pw: '',
  })
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const cats = categories.filter((c) => c.active).map((c) => c.name)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = async () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 2) e.name = 'Enter your full name.'
    if (role === 'provider' && f.business.trim().length < 2) e.business = 'Enter your business name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.'
    if (f.pw.length < 6) e.pw = 'Password must be at least 6 characters.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    const { error, needsConfirmation } = await register({
      name: f.name.trim(), email: f.email, password: f.pw, role,
      business: f.business.trim(), category: f.category || cats[0],
      guestRequestId: bookingFollowUp?.guestRequestId,
    })
    setBusy(false)
    if (error) return setErrors({ form: error })
    if (needsConfirmation) return setSentTo(f.email)
    if (role === 'provider') toast('Account created. It stays pending until our team verifies it.')
    navigate(dest[role])
  }

  if (sentTo) {
    return (
      <Shell title="Check your email" subtitle={`We sent a confirmation link to ${sentTo}.`}>
        <p className="text-sm text-slate-600">Open the link to confirm your email. We’ll take you to your account when confirmation is complete.</p>
        <Link to="/login" state={bookingFollowUp ? { bookingFollowUp } : undefined} className="mt-6 inline-block font-semibold text-teal-700 hover:underline">Go to log in</Link>
      </Shell>
    )
  }

  return (
    <Shell title="Create your account" subtitle="Join as a customer to plan events, or as a provider to get booked.">
      <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); void submit() }}>
        {bookingFollowUp ? (
          <p className="rounded-xl bg-teal-50 p-3 text-sm text-teal-800">
            Your booking request is saved. Create a customer account to follow its status and provider responses.
          </p>
        ) : (
          <fieldset>
            <legend className="mb-1.5 block text-sm font-semibold">I want to</legend>
            <div className="grid grid-cols-2 gap-2">
              {([['customer', 'Plan an event', User], ['provider', 'Offer services', Briefcase]] as const).map(([r, label, Icon]) => (
                <label key={r} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition ${role === r ? 'border-teal-600 bg-teal-50' : 'border-soft bg-white hover:bg-ivory'}`}>
                  <input type="radio" name="role" className="sr-only" checked={role === r} onChange={() => setRole(r)} />
                  <Icon className="h-5 w-5" aria-hidden /> {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Field label="Full name" error={errors.name}>{(id) => <Input id={id} autoComplete="name"  value={f.name} onChange={up('name')} />}</Field>
        {role === 'provider' && (
          <>
            <Field label="Business name" error={errors.business}>{(id) => <Input id={id}  value={f.business} onChange={up('business')} />}</Field>
            <Field label="Service category">{(id) => <SelectInput id={id}  value={f.category || cats[0]} onChange={up('category')}>{cats.map((c) => <option key={c}>{c}</option>)}</SelectInput>}</Field>
          </>
        )}
        <Field label="Email" error={errors.email} hint={bookingFollowUp ? 'Use the email address from your booking.' : undefined}>{(id) => <Input id={id} type="email" autoComplete="email" readOnly={!!bookingFollowUp} value={f.email} onChange={up('email')} />}</Field>
        <Field label="Password" error={errors.pw} hint="At least 6 characters.">{(id) => <PasswordInput id={id} autoComplete="new-password" value={f.pw} onChange={up('pw')} />}</Field>
        {role === 'provider' && <p className="rounded-xl bg-teal-50 p-3 text-sm text-teal-800">New provider accounts stay pending until our team reviews your business details. Verified providers get a badge.</p>}
        {errors.form && <p role="alert" className="rounded-xl border border-black p-3 text-sm font-semibold">{errors.form}</p>}
        <Button className="w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
        <p className="text-center text-sm text-slate-600">Already registered? <Link to="/login" state={bookingFollowUp ? { bookingFollowUp } : undefined} className="font-semibold text-teal-700 hover:underline">Log in</Link></p>
      </form>
    </Shell>
  )
}
