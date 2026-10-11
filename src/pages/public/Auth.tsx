import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Briefcase, ShieldCheck, User } from 'lucide-react'
import { Logo } from '../../components/layout/Layouts'
import { Field } from '../../components/ui'
import { CUSTOMER_NAME, useStore } from '../../features/store'
import { CATEGORIES, type Role } from '../../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectInput } from '@/components/ui'

const dest: Record<Role, string> = { customer: '/customer', provider: '/provider', admin: '/admin' }
const demoName: Record<Role, string> = { customer: CUSTOMER_NAME, provider: 'Maya Ibrahim', admin: 'Platform Admin' }

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
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

const roles: { role: Role; label: string; icon: typeof User }[] = [
  { role: 'customer', label: 'Customer', icon: User }, { role: 'provider', label: 'Provider', icon: Briefcase }, { role: 'admin', label: 'Admin', icon: ShieldCheck },
]

export function Login() {
  const { login } = useStore()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [role, setRole] = useState<Role>('customer')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [errors, setErrors] = useState<{ email?: string; pw?: string }>({})

  const submit = () => {
    const e: typeof errors = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email address.'
    if (pw.length < 6) e.pw = 'Password must be at least 6 characters.'
    setErrors(e)
    if (Object.keys(e).length) return
    login({ name: demoName[role], email, role })
    navigate(from && from.startsWith(dest[role]) ? from : dest[role])
  }

  return (
    <Shell title="Welcome back" subtitle="Log in to manage your events, bookings and messages.">
      <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
        <fieldset>
          <legend className="mb-1.5 block text-sm font-semibold">I’m logging in as</legend>
          <div className="grid grid-cols-3 gap-2">
            {roles.map(({ role: r, label, icon: Icon }) => (
              <label key={r} className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-sm font-semibold transition ${role === r ? 'border-teal-600 bg-teal-50' : 'border-soft bg-white hover:bg-ivory'}`}>
                <input type="radio" name="role" className="sr-only" checked={role === r} onChange={() => setRole(r)} />
                <Icon className="h-5 w-5" aria-hidden /> {label}
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Email" error={errors.email}>{(id) => <Input id={id} type="email" autoComplete="email"  value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label="Password" error={errors.pw}>{(id) => <Input id={id} type="password" autoComplete="current-password"  value={pw} onChange={(e) => setPw(e.target.value)} />}</Field>
        <Button className="w-full">Log in</Button>
        <p className="text-center text-sm text-slate-600">New to EventLink? <Link to="/register" className="font-semibold text-teal-700 hover:underline">Create an account</Link></p>
        <p className="rounded-xl bg-gold-100 p-3 text-xs text-navy-900">Demo mode: any valid email and a password of 6+ characters works. Pick a role to explore that portal.</p>
      </form>
    </Shell>
  )
}

export function Register() {
  const { login, toast } = useStore()
  const navigate = useNavigate()
  const [role, setRole] = useState<'customer' | 'provider'>('customer')
  const [f, setF] = useState({ name: '', business: '', category: CATEGORIES[0] as string, email: '', pw: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 2) e.name = 'Enter your full name.'
    if (role === 'provider' && f.business.trim().length < 2) e.business = 'Enter your business name.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.'
    if (f.pw.length < 6) e.pw = 'Password must be at least 6 characters.'
    setErrors(e)
    if (Object.keys(e).length) return
    login({ name: f.name.trim(), email: f.email, role })
    if (role === 'provider') toast('Account created. It stays pending until our team verifies it.')
    navigate(dest[role])
  }

  return (
    <Shell title="Create your account" subtitle="Join as a customer to plan events, or as a provider to get booked.">
      <form className="space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
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
        <Field label="Full name" error={errors.name}>{(id) => <Input id={id} autoComplete="name"  value={f.name} onChange={up('name')} />}</Field>
        {role === 'provider' && (
          <>
            <Field label="Business name" error={errors.business}>{(id) => <Input id={id}  value={f.business} onChange={up('business')} />}</Field>
            <Field label="Service category">{(id) => <SelectInput id={id}  value={f.category} onChange={up('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</SelectInput>}</Field>
          </>
        )}
        <Field label="Email" error={errors.email}>{(id) => <Input id={id} type="email" autoComplete="email"  value={f.email} onChange={up('email')} />}</Field>
        <Field label="Password" error={errors.pw} hint="At least 6 characters.">{(id) => <Input id={id} type="password" autoComplete="new-password"  value={f.pw} onChange={up('pw')} />}</Field>
        {role === 'provider' && <p className="rounded-xl bg-teal-50 p-3 text-sm text-teal-800">New provider accounts stay pending until our team reviews your business details. Verified providers get a badge.</p>}
        <Button className="w-full">Create account</Button>
        <p className="text-center text-sm text-slate-600">Already registered? <Link to="/login" className="font-semibold text-teal-700 hover:underline">Log in</Link></p>
      </form>
    </Shell>
  )
}
