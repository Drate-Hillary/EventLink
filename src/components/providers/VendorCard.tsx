import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin, Star } from 'lucide-react'
import type { Vendor } from '../../types'
import { money } from '../../utils/format'
import { VerifiedBadge } from '../ui'

export function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link to={`/vendors/${vendor.id}`} className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <img src={vendor.photos[0]} alt={`${vendor.name} work`} loading="lazy" draggable={false} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold">{vendor.category}</span>
        {vendor.verified && <span className="absolute right-3 top-3"><VerifiedBadge /></span>}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          <Star className="h-3.5 w-3.5 fill-white" aria-hidden /> {vendor.rating.toFixed(1)} <span className="font-normal text-white/70">({vendor.reviewCount})</span>
        </span>
        {!vendor.available && <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold">Limited dates</span>}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug">{vendor.name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-600"><MapPin className="h-4 w-4 shrink-0" aria-hidden /> {vendor.areas.slice(0, 2).join(' · ')}</p>
        <div className="mt-auto flex items-center justify-between border-t pt-4">
          <p className="text-sm text-slate-600">From <span className="text-base font-extrabold text-black">{money(vendor.priceFrom)}</span></p>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-white transition group-hover:scale-110" aria-hidden><ArrowUpRight className="h-4 w-4" /></span>
        </div>
      </div>
    </Link>
  )
}
