import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import type { Vendor } from '../../types'
import { dateLong, money } from '../../utils/format'
import { useStore } from '../../features/store'
import { Field, Modal } from '../ui'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { SelectInput } from '@/components/ui'
import { DatePicker } from '@/components/ui/date-picker'

export function RequestModal({ vendor, open, onClose, initialPackage }: { vendor: Vendor; open: boolean; onClose: () => void; initialPackage?: string }) {
  const { session, events, createRequest, toast } = useStore()
  const navigate = useNavigate()
  const myEvents = events
  const [kind, setKind] = useState<'quote' | 'booking'>('quote')
  const [eventId, setEventId] = useState(myEvents[0]?.id ?? '')
  const [eventDate, setEventDate] = useState('')
  const [pkg, setPkg] = useState(initialPackage ?? vendor.packages[0]?.name ?? '')
  const [note, setNote] = useState('')
  const [guest, setGuest] = useState({ name: '', email: '', phone: '', location: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const isCustomer = session?.role === 'customer'
  const guestMode = !session

  const submit = async () => {
    if (saving) return
    setError('')

    if (guestMode) {
      if (!guest.name.trim()) { setError('Enter the customer name.'); return }
      if (!/^\S+@\S+\.\S+$/.test(guest.email.trim())) { setError('Enter a valid email address.'); return }
      if (!guest.phone.trim()) { setError('Enter a phone number.'); return }
      if (!guest.location.trim()) { setError('Enter a location.'); return }
      if (kind === 'booking' && !eventDate) { setError('Choose an event date.'); return }
    } else if (!isCustomer) {
      setError('Only customer accounts can request services.')
      return
    } else if (!eventId) {
      setError('Choose the event this request is for.')
      return
    }

    setSaving(true)
    try {
      const requestId = guestMode ? crypto.randomUUID() : undefined
      const saved = await createRequest(guestMode ? {
        eventId: '',
        vendorId: vendor.id,
        packageName: pkg,
        kind,
        note: note.trim(),
        customer: guest.name.trim(),
        customerEmail: guest.email.trim(),
        customerPhone: guest.phone.trim(),
        customerLocation: guest.location.trim(),
        guestRequestId: requestId,
        eventDate: eventDate || undefined,
      } : {
        eventId,
        vendorId: vendor.id,
        packageName: pkg,
        kind,
        note: note.trim(),
        eventDate: myEvents.find((e) => e.id === eventId)?.date,
      })
      if (!saved) return

      toast(kind === 'quote' ? 'Quote request sent' : 'Booking request sent')
      onClose()
      if (guestMode) {
        const selectedPackage = vendor.packages.find((item) => item.name === pkg)
        const subject = encodeURIComponent(`EventLink ${kind} request receipt`)
        const body = encodeURIComponent([
          'EventLink service request receipt',
          `Reference: ${requestId}`,
          `Customer: ${guest.name.trim()}`,
          `Email: ${guest.email.trim()}`,
          `Phone: ${guest.phone.trim()}`,
          `Location: ${guest.location.trim()}`,
          `Provider listing: ${vendor.name}`,
          `Package: ${pkg || 'To be confirmed'}`,
          `Listed package price: ${selectedPackage ? money(selectedPackage.price) : 'To be confirmed'}`,
          ...(eventDate ? [`Event date: ${dateLong(eventDate)}`] : []),
          `Request type: ${kind}`,
          `Message: ${note.trim() || 'None'}`,
          '',
          'No payment was collected. This draft confirms your request only.',
        ].join('\n'))
        window.location.href = `mailto:${encodeURIComponent(guest.email.trim())}?subject=${subject}&body=${body}`
        return
      }
      navigate('/customer#requests')
    } catch (submitError) {
      setError(`Could not send request: ${submitError instanceof Error ? submitError.message : String(submitError)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Request from ${vendor.name}`}>
      {session && !isCustomer ? (
        <p className="text-sm text-slate-600">Only customer accounts can request services.</p>
      ) : guestMode ? (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit() }}>
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
          {kind === 'booking' && (
            <Field label="Event date" error={error} hint="Choose the date you need the provider.">
              {(id) => <DatePicker id={id} value={eventDate} onChange={(date) => { setEventDate(date); setError('') }} disablePast placeholder="Choose a date" />}
            </Field>
          )}
          <Field label="Customer name" error={error}>{(id) => <Input id={id} required maxLength={160} value={guest.name} onChange={(e: { target: { value: string } }) => { setGuest({ ...guest, name: e.target.value }); setError('') }} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={error}>{(id) => <Input id={id} type="email" required maxLength={320} value={guest.email} onChange={(e: { target: { value: string } }) => { setGuest({ ...guest, email: e.target.value }); setError('') }} />}</Field>
            <Field label="Phone" error={error}>{(id) => <Input id={id} type="tel" required maxLength={50} value={guest.phone} onChange={(e: { target: { value: string } }) => { setGuest({ ...guest, phone: e.target.value }); setError('') }} />}</Field>
          </div>
          <Field label="Location" error={error}>{(id) => <Input id={id} required maxLength={500} value={guest.location} onChange={(e: { target: { value: string } }) => { setGuest({ ...guest, location: e.target.value }); setError('') }} />}</Field>
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
          <p className="text-xs text-slate-500">After saving, we’ll open a request receipt draft addressed to your email in your default mail app. It is not sent automatically; verified providers in this service category will be notified.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : kind === 'quote' ? 'Send quote request' : 'Send booking request'}</Button>
          </div>
        </form>
      ) : myEvents.length === 0 ? (
        <div className="text-center">
          <p className="text-sm text-slate-600">Create an event first so the provider knows the date, place and guest count.</p>
          <Link to="/customer#events" className={cn(buttonVariants({ variant: 'default' }), "mt-5")}><CalendarPlus className="h-4 w-4" /> Create an event</Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit() }}>
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
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : kind === 'quote' ? 'Send quote request' : 'Send booking request'}</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
