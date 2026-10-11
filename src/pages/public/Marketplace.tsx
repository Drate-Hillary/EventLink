import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { VendorCard } from '../../components/providers/VendorCard'
import { EmptyState } from '../../components/ui'
import { useStore } from '../../features/store'
import { money } from '../../utils/format'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SelectInput } from '@/components/ui'

export default function Marketplace() {
  const { vendors: allVendors, categories } = useStore()
  const vendors = useMemo(() => allVendors.filter((v) => v.verified), [allVendors])
  const [params, setParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const category = params.get('category') ?? ''
  const location = params.get('location') ?? ''
  const q = params.get('q') ?? ''
  const maxPrice = Number(params.get('max') ?? 0)
  const minRating = Number(params.get('rating') ?? 0)
  const verifiedOnly = params.get('verified') === '1'
  const availableOnly = params.get('available') === '1'
  const sort = params.get('sort') ?? 'rating'

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }

  const results = useMemo(() => {
    const list = vendors.filter((v) =>
      (!category || v.category === category) &&
      (!location || v.areas.some((a) => a.toLowerCase().includes(location.toLowerCase()))) &&
      (!q || v.name.toLowerCase().includes(q.toLowerCase())) &&
      (!maxPrice || v.priceFrom <= maxPrice) &&
      v.rating >= minRating &&
      (!verifiedOnly || v.verified) &&
      (!availableOnly || v.available))
    return list.sort((a, b) => sort === 'price' ? a.priceFrom - b.priceFrom : sort === 'reviews' ? b.reviewCount - a.reviewCount : b.rating - a.rating)
  }, [vendors, category, location, q, maxPrice, minRating, verifiedOnly, availableOnly, sort])

  const filters = (
    <div className="space-y-5">
      <div>
        <Label htmlFor="q" className="mb-1.5 block">Business name</Label>
        <Input id="q"  value={q} onChange={(e) => set('q', e.target.value)} placeholder="Search by name" />
      </div>
      <div>
        <Label htmlFor="cat" className="mb-1.5 block">Service</Label>
        <SelectInput id="cat"  value={category} onChange={(e) => set('category', e.target.value)}>
          <option value="">All services</option>
          {categories.filter((c) => c.active).map((c) => <option key={c.id}>{c.name}</option>)}
        </SelectInput>
      </div>
      <div>
        <Label htmlFor="loc" className="mb-1.5 block">Location</Label>
        <Input id="loc"  value={location} onChange={(e) => set('location', e.target.value)} placeholder="City" />
      </div>
      <div>
        <Label htmlFor="max" className="mb-1.5 block">Starting price up to <span className="text-teal-700">{maxPrice ? money(maxPrice) : 'any'}</span></Label>
        <Slider id="max" min={0} max={4000} step={250} value={[maxPrice]} onValueChange={([v]) => set('max', v === 0 ? '' : String(v))} className="mt-2" />
      </div>
      <div>
        <Label htmlFor="rating" className="mb-1.5 block">Minimum rating</Label>
        <SelectInput id="rating"  value={minRating} onChange={(e) => set('rating', e.target.value === '0' ? '' : e.target.value)}>
          <option value="0">Any rating</option><option value="4">4.0 and up</option><option value="4.5">4.5 and up</option><option value="4.8">4.8 and up</option>
        </SelectInput>
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <Checkbox checked={verifiedOnly} onCheckedChange={(c) => set('verified', c === true ? '1' : '')} /> Verified providers only
      </label>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <Checkbox checked={availableOnly} onCheckedChange={(c) => set('available', c === true ? '1' : '')} /> Has open dates
      </label>
      <Button variant="outline" className="w-full" onClick={() => setParams({}, { replace: true })}>Clear filters</Button>
    </div>
  )

  return (
    <div className="container-x py-8 lg:py-12">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Find event vendors</h1>
      <p className="mt-1 text-slate-600">{results.length} {results.length === 1 ? 'vendor matches' : 'vendors match'} your search.</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <Button variant="outline" className="w-full lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
          <div className={`${showFilters ? 'mt-3 block' : 'hidden'} rounded-2xl border bg-card text-card-foreground shadow-card p-5 lg:sticky lg:top-24 lg:mt-0 lg:block`}>{filters}</div>
        </aside>
        <section aria-label="Results">
          <div className="mb-4 flex items-center justify-end gap-2 text-sm">
            <label htmlFor="sort" className="font-semibold">Sort by</label>
            <SelectInput id="sort" className="!w-auto" value={sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="rating">Highest rated</option><option value="reviews">Most reviewed</option><option value="price">Lowest price</option>
            </SelectInput>
          </div>
          {results.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{results.map((v) => <VendorCard key={v.id} vendor={v} />)}</div>
          ) : (
            <EmptyState icon={SearchX} title="No vendors match these filters" text="Try a nearby city, a higher price limit or fewer filters." action={<Button onClick={() => setParams({}, { replace: true })}>Clear filters</Button>} />
          )}
        </section>
      </div>
    </div>
  )
}
