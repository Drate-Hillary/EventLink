import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import type { Vendor } from '../../types'
import { dateLong, money } from '../../utils/format'
import { useStore } from '../../features/store'
import { Field, Modal } from '../ui'
import { Button, buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { SelectInput } from '@/components/ui'

export function RequestModal({ vendor, open, onClose, initialPackage }: { vendor: Vendor; open: boolean; onClose: () => void; initialPackage?: string }) {
  const { session, events, createRequest, toast } = useStore()
  const navigate = useNavigate()
  const myEvents = events
  const [kind, setKind] = useState<'quote' | 'booking'>('quote')
  const [eventId, setEventId] = useState(myEvents[0]?.id ?? '')
  const [pkg, setPkg] = useState(initialPackage ?? vendor.packages[0]?.name ?? '')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const isCustomer = session?.role === 'customer'

  const submit = () => {
    if (!eventId) return setError('Choose the event this request is for.')
    createRequest({ eventId, vendorId: vendor.id, packageName: pkg, kind, note: note.trim() })
    toast(kind === 'quote' ? 'Quote request sent' : 'Booking request sent')
    onClose()
    navigate('/customer#requests')
  }

  return (
    <Modal open={open} onClose={onClose} title={`Request from ${vendor.name}`}>
      {!isCustomer ? (
        <div className="text-center">
          <p className="text-sm text-slate-600">Log in as a customer to request quotes and bookings.</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link to="/login" className={buttonVariants({ variant: 'outline' })}>Log in</Link>
            <Link to="/register" className={buttonVariants({ variant: 'default' })}>Create account</Link>
          </div>
        </div>
      ) : myEvents.length === 0 ? (
        <div className="text-center">
          <p className="text-sm text-slate-600">Create an event first so the provider knows the date, place and guest count.</p>
          <Link to="/customer#events" className={cn(buttonVariants({ variant: 'default' }), "mt-5")}><CalendarPlus className="h-4 w-4" /> Create an event</Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="mb-1.5 block text-sm font-semibold">Request type</legend>
            {(['quote', 'booking'] as const).map((k) => (
              <label key={k} className={`cursor-pointer rounded-xl border p-3 text-sm font-semibold transition ${kind === k ? 'border-teal-600 bg-teal-50' : 'border-soft hover:bg-ivory'}`}>
                <input type="radio" name="kind" className="sr-only" checked={kind === k} onChange={() => setKind(k)} />
                {k === 'quote' ? 'Ask for a quote' : 'Request a booking'}
                <span className="mt-0.5 block text-xs font-normal text-slate-500">{k === 'quote' ? 'Get a price first' : 'Hold the date'}</span>
              </label>
            ))}
          </fieldset>
          <Field label="Event" error={error}>
            {(id) => (
              <SelectInput id={id}  value={eventId} onChange={(e) => { setEventId(e.target.value); setError('') }}>
                {myEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.name} · {dateLong(ev.date)}</option>)}
              </SelectInput>
            )}
          </Field>
          <Field label="Package">
            {(id) => (
              <SelectInput id={id}  value={pkg} onChange={(e) => setPkg(e.target.value)}>
                {vendor.packages.map((p) => <option key={p.id} value={p.name}>{p.name} · {money(p.price)}</option>)}
              </SelectInput>
            )}
          </Field>
          <Field label="Message to provider" hint="Share anything that affects the price, like dietary needs or venue access.">
            {(id) => <Textarea id={id} rows={3}  value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
          <p className="text-xs text-slate-500">Payment is arranged directly with the provider. EventLink does not take payments yet.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit">{kind === 'quote' ? 'Send quote request' : 'Send booking request'}</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
