import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Flag, Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import { RequestModal } from '../../components/bookings/RequestModal'
import { Art, Field, Modal, Stars, VerifiedBadge, categoryIcon } from '../../components/ui'
import { useStore } from '../../features/store'
import { dateLong, money } from '../../utils/format'
import { Button, buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function VendorProfile() {
  const { id } = useParams()
  const { vendors, session, openThread, portfolio, addReport, toast } = useStore()
  const navigate = useNavigate()
  const vendor = vendors.find((v) => v.id === id)
  const [req, setReq] = useState<{ open: boolean; pkg?: string }>({ open: false })
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState('')

  if (!vendor) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="text-2xl font-extrabold">We couldn’t find that vendor</h1>
        <Link to="/vendors" className={cn(buttonVariants({ variant: 'default' }), "mt-6")}>Back to vendors</Link>
      </div>
    )
  }

  const Icon = categoryIcon[vendor.category]
  const tiles = vendor.id === 'v1' ? portfolio : Array.from({ length: 6 }, (_, i) => ({ id: String(i), title: `${vendor.category} project ${i + 1}`, hue: (vendor.hue + i * 28) % 360, src: vendor.photos[(i + 1) % vendor.photos.length] }))

  const message = () => {
    if (session?.role !== 'customer') return navigate('/login')
    navigate(`/customer?thread=${openThread(vendor.id)}#messages`)
  }

  return (
    <div className="container-x py-6 lg:py-10">
      <Link to="/vendors" className={cn(buttonVariants({ variant: 'ghost' }), "-ml-3 mb-3")}><ArrowLeft className="h-4 w-4" /> All vendors</Link>

      <div className="grid gap-2 overflow-hidden rounded-3xl sm:grid-cols-4 sm:grid-rows-2">
        <Art src={vendor.photos[0]} hue={vendor.hue} icon={Icon} className="aspect-[16/9] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-72" label={`${vendor.name} cover`} />
        {tiles.slice(0, 4).map((t) => <Art key={t.id} src={t.src} hue={t.hue} className="hidden aspect-[4/3] sm:block" label={t.title} />)}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-teal-700">{vendor.category}</span>
              {vendor.verified && <VerifiedBadge />}
            </div>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{vendor.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <Stars value={vendor.rating} count={vendor.reviewCount} />
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" aria-hidden /> {vendor.areas.join(' · ')}</span>
            </div>
            <p className="mt-4 max-w-prose text-slate-700">{vendor.about}</p>
          </header>

          <section aria-labelledby="pk">
            <h2 id="pk" className="text-xl font-extrabold">Packages</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {vendor.packages.map((p) => (
                <article key={p.id} className="rounded-2xl border bg-card text-card-foreground shadow-card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold">{p.name}</h3>
                    <p className="text-lg font-extrabold">{money(p.price)}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {p.includes.map((i) => <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" aria-hidden /> {i}</li>)}
                  </ul>
                  <Button variant="outline" className="mt-5" onClick={() => setReq({ open: true, pkg: p.name })}>Choose {p.name}</Button>
                </article>
              ))}
            </div>
          </section>

          <section aria-labelledby="pf">
            <h2 id="pf" className="text-xl font-extrabold">Portfolio</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tiles.map((t) => (
                <figure key={t.id}>
                  <Art src={t.src} hue={t.hue} icon={Icon} className="aspect-[4/3] rounded-2xl" label={t.title} />
                  <figcaption className="mt-1.5 text-sm text-slate-600">{t.title}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          <section aria-labelledby="rv">
            <h2 id="rv" className="text-xl font-extrabold">Reviews</h2>
            {vendor.reviews.length === 0 ? (
              <p className="mt-3 text-slate-600">No reviews yet. Reviews appear after a completed booking.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {vendor.reviews.map((r) => (
                  <li key={r.id} className="rounded-2xl border bg-card text-card-foreground shadow-card p-5">
                    <div className="flex items-center justify-between"><p className="font-bold">{r.author}</p><Stars value={r.rating} /></div>
                    <p className="mt-2 text-slate-700">{r.text}</p>
                    <p className="mt-2 text-xs text-slate-500">{r.eventType} · {dateLong(r.date)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <p className="text-sm text-slate-600">Starting from</p>
            <p className="text-2xl font-extrabold">{money(vendor.priceFrom)}</p>
            <p className={`mt-2 text-sm font-semibold ${vendor.available ? 'text-black' : 'text-black'}`}>{vendor.available ? 'Has open dates' : 'Limited availability'}</p>
            <Button className="mt-5 w-full" onClick={() => setReq({ open: true })}>Request a quote or booking</Button>
            <Button variant="outline" className="mt-2 w-full" onClick={message}><MessageSquare className="h-4 w-4" /> Message provider</Button>
            <Separator className="my-5" />
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" aria-hidden /> {vendor.phone}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" aria-hidden /> {vendor.email}</li>
            </ul>
            {session && (
              <button className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-black" onClick={() => setReporting(true)}><Flag className="h-3.5 w-3.5" /> Report this profile</button>
            )}
          </Card>
        </aside>
      </div>

      <RequestModal key={req.pkg ?? 'none'} vendor={vendor} open={req.open} onClose={() => setReq({ open: false })} initialPackage={req.pkg} />

      <Modal open={reporting} onClose={() => setReporting(false)} title="Report this profile">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!reason.trim()) return; addReport(vendor.name, reason.trim()); setReporting(false); setReason(''); toast('Report sent to our team') }}>
          <Field label="What happened?" hint="Our team reviews every report. Include details such as requests to pay outside the platform.">
            {(fid) => <Textarea id={fid} rows={4} required  value={reason} onChange={(e) => setReason(e.target.value)} />}
          </Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setReporting(false)}>Cancel</Button><Button variant="destructive">Send report</Button></div>
        </form>
      </Modal>
    </div>
  )
}
