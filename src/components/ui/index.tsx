import { Children, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import {
  BadgeCheck, Camera, CheckCircle2, Clock, Flower2, Music2, Star, Tent, UtensilsCrossed, XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { AccountStatus, BookingStatus, Category } from '../../types'
import { initials } from '../../utils/format'
import { cn } from '@/lib/utils'
import { Avatar as ShAvatar, AvatarFallback } from './avatar'
import { Badge } from './badge'
import { Card } from './card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Tabs as ShTabs, TabsList, TabsTrigger } from './tabs'

// eslint-disable-next-line react-refresh/only-export-components
export const categoryIcon: Record<Category, LucideIcon> = {
  Catering: UtensilsCrossed, Photography: Camera, 'DJs & Music': Music2, 'Tents & Seating': Tent, Decor: Flower2,
}

const statusStyle: Record<string, { cls: string; Icon: LucideIcon; label: string }> = {
  accepted: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', Icon: CheckCircle2, label: 'Accepted' },
  pending: { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', Icon: Clock, label: 'Pending' },
  declined: { cls: 'bg-red-50 text-red-700 ring-red-600/20', Icon: XCircle, label: 'Declined' },
  verified: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', Icon: BadgeCheck, label: 'Verified' },
  rejected: { cls: 'bg-red-50 text-red-700 ring-red-600/20', Icon: XCircle, label: 'Rejected' },
  suspended: { cls: 'bg-slate-100 text-slate-700 ring-slate-500/20', Icon: XCircle, label: 'Suspended' },
  active: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', Icon: CheckCircle2, label: 'Active' },
  open: { cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', Icon: Clock, label: 'Open' },
  resolved: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', Icon: CheckCircle2, label: 'Resolved' },
}

/** One badge for every status in the product, so colour always means the same thing. */
export function StatusBadge({ status }: { status: BookingStatus | AccountStatus | 'active' | 'open' | 'resolved' }) {
  const { cls, Icon, label } = statusStyle[status]
  return (
    <Badge variant="outline" className={`border-transparent ring-1 ring-inset ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
    </Badge>
  )
}

export const VerifiedBadge = () => <StatusBadge status="verified" />

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold" aria-label={`Rated ${value} out of 5`}>
      <Star className="h-4 w-4 fill-navy-900 text-navy-900" aria-hidden /> {value.toFixed(1)}
      {count !== undefined && <span className="font-normal text-slate-500">({count})</span>}
    </span>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }[size]
  return (
    <ShAvatar className={s} aria-hidden><AvatarFallback>{initials(name)}</AvatarFallback></ShAvatar>
  )
}

/** Gradient tile standing in for photography until real uploads exist. */
export function Art({ hue, icon: Icon, className = '', label, src }: { hue: number; icon?: LucideIcon; className?: string; label?: string; src?: string }) {
  return (
    <div
      role={label ? 'img' : undefined}
      aria-label={label}
      className={`relative grid place-items-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(0 0% ${14 + (hue % 6) * 4}%), hsl(0 0% ${46 + (hue % 7) * 6}%))` }}
    >
      {src ? (
        <img src={src} alt={label ?? ''} loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
          <div className="absolute -bottom-10 left-4 h-32 w-32 rounded-full bg-black/10" />
        </>
      )}
      {!src && Icon && <Icon className="relative h-1/3 w-1/3 max-h-14 max-w-14 text-white/90" strokeWidth={1.5} aria-hidden />}
    </div>
  )
}

export function PageHeader({ title, subtitle, action, section }: { title: string; subtitle?: string; action?: ReactNode; section?: boolean }) {
  const H = section ? 'h2' : 'h1'
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <H className={section ? 'font-serif text-xl font-semibold sm:text-2xl' : 'font-serif text-2xl font-semibold sm:text-3xl'}>{title}</H>
        {subtitle && <p className="mt-1 max-w-prose text-sm text-slate-600 sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Stat({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: string; icon: LucideIcon }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Icon className="h-5 w-5" aria-hidden /></span>
      </div>
      <p className="mt-3 text-2xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  )
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary"><Icon className="h-7 w-7" aria-hidden /></span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  )
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p role="alert" className="text-xs font-semibold text-black">{error}</p>}
    </div>
  )
}

/** shadcn Dialog; becomes a bottom sheet on phones. */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined} className={wide ? 'sm:max-w-2xl' : undefined}>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; id?: string }) {
  return (
    <ShTabs value={value} onValueChange={(v) => onChange(v as T)}>
      <TabsList>
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>{t.label}{t.count !== undefined && <span className="ml-1.5 opacity-70">{t.count}</span>}</TabsTrigger>
        ))}
      </TabsList>
    </ShTabs>
  )
}

const EMPTY = '__all__'

/**
 * shadcn Select with a native-select style API: pass <option> children and an
 * onChange that receives { target: { value } }.
 */
export function SelectInput({ value, onChange, children, className, id, ...rest }: {
  value: string | number; onChange: (e: { target: { value: string } }) => void; children: ReactNode
  className?: string; id?: string; 'aria-label'?: string
}) {
  const options = Children.toArray(children).filter(isValidElement) as ReactElement<{ value?: string | number; children?: ReactNode }>[]
  const v = String(value)
  return (
    <Select value={v === '' ? EMPTY : v} onValueChange={(nv) => onChange({ target: { value: nv === EMPTY ? '' : nv } })}>
      <SelectTrigger id={id} className={cn(className)} aria-label={rest['aria-label']}><SelectValue /></SelectTrigger>
      <SelectContent>
        {options.map((o, i) => {
          const val = String(o.props.value ?? o.props.children)
          return <SelectItem key={i} value={val === '' ? EMPTY : val}>{o.props.children}</SelectItem>
        })}
      </SelectContent>
    </Select>
  )
}
