import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { MotionValue } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  animate, motion, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform,
} from 'framer-motion'
import {
  ArrowUpRight, BadgeCheck, CalendarCheck, CheckCircle2, MapPin, MessageSquare, Search, ShieldCheck, Star, Wallet,
} from 'lucide-react'
import { Art, Stars, VerifiedBadge, categoryIcon } from '../../components/ui'
import { categoryPhotos, photo } from '../../data/images'
import { useStore } from '../../features/store'
import { CATEGORIES } from '../../types'
import { money } from '../../utils/format'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SelectInput } from '@/components/ui'

const ease = [0.22, 1, 0.36, 1] as const

/** Headline that reveals line by line from behind a mask. */
function Lines({ lines, className = '' }: { lines: string[]; className?: string }) {
  const reduce = useReducedMotion()
  return (
    <h1 className={className}>
      {lines.map((l, i) => (
        <span key={l} className="block overflow-hidden pb-[0.12em]">
          <motion.span className="block" initial={{ y: reduce ? 0 : '110%' }} animate={{ y: 0 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.9, ease }}>
            {i === 1 ? <em className="font-medium italic">{l}</em> : l}
          </motion.span>
        </span>
      ))}
    </h1>
  )
}

function Count({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const v = useMotionValue(0)
  const text = useTransform(v, (n) => Math.round(n).toLocaleString() + suffix)
  useEffect(() => { if (inView) { const c = animate(v, to, { duration: 1.6, ease }); return () => c.stop() } }, [inView, to, v])
  return <motion.span ref={ref}>{text}</motion.span>
}

function Hero() {
  const { vendors } = useStore()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [cat, setCat] = useState('')
  const [loc, setLoc] = useState('')
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y1 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90])
  const y3 = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60])
  const top = vendors.filter((v) => v.verified).sort((a, b) => b.rating - a.rating)

  const search = (e: FormEvent) => {
    e.preventDefault()
    const q = new URLSearchParams()
    if (cat) q.set('category', cat)
    if (loc) q.set('location', loc)
    navigate(`/vendors?${q}`)
  }

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="container-x grid grid-cols-1 items-center gap-10 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-16">
        <div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-soft bg-white px-3 py-1.5 text-sm font-semibold">
            <BadgeCheck className="h-4 w-4" aria-hidden /> Every badge is checked by a person
          </motion.p>
          <Lines className="font-serif text-[2.5rem] font-semibold leading-[1] sm:text-5xl xl:text-6xl" lines={['Every detail,', 'beautifully', 'planned.']} />
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7, ease }} className="mt-5 max-w-md text-base text-slate-600">
            Find caterers, photographers, DJs and tent suppliers you can trust. Compare packages, chat, and request bookings in one place.
          </motion.p>
          <motion.form onSubmit={search} role="search" aria-label="Search vendors" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.7, ease }}
            className="mt-8 flex max-w-xl flex-col gap-2 rounded-3xl border border-soft bg-white p-2 shadow-rounded-2xl border bg-card text-card-foreground shadow-card sm:flex-row sm:items-center sm:rounded-full">
            <label className="flex-1"><span className="sr-only">Service</span>
              <SelectInput value={cat} onChange={(e) => setCat(e.target.value)} className="w-full rounded-full bg-transparent px-4 py-3 text-sm font-semibold focus:outline-none">
                <option value="">Any service</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </SelectInput></label>
            <span className="hidden h-6 w-px bg-soft sm:block" />
            <label className="relative flex-1"><span className="sr-only">Location</span>
              <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Where is your event?" className="w-full rounded-full bg-transparent py-3 pl-10 pr-4 text-sm font-semibold placeholder:font-medium focus:outline-none" /></label>
            <Button className="rounded-full px-6 py-3 h-auto"><Search className="h-4 w-4" /> Search</Button>
          </motion.form>
        </div>

        {/* Arch collage with parallax and floating cards */}
        <div className="relative mx-auto h-[26rem] w-full max-w-lg sm:h-[34rem]" aria-hidden>
          <motion.div style={{ y: y1 }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 1, ease }} className="absolute left-0 top-6 h-[78%] w-[56%]">
            <Art src={photo.weddingBouquet} hue={2} icon={categoryIcon.Catering} className="h-full w-full rounded-t-[999px] rounded-b-3xl" />
          </motion.div>
          <motion.div style={{ y: y2 }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45, duration: 1, ease }} className="absolute right-0 top-0 h-[58%] w-[40%]">
            <Art src={photo.tableFlowers} hue={4} icon={categoryIcon.Photography} className="h-full w-full rounded-t-[999px] rounded-b-3xl" />
          </motion.div>
          <motion.div style={{ y: y3 }} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, duration: 1, ease }} className="absolute bottom-0 right-[4%] h-[34%] w-[48%]">
            <Art src={photo.djStage} hue={9} icon={categoryIcon['DJs & Music']} className="h-full w-full rounded-3xl" />
          </motion.div>

          <motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }} className="absolute -left-2 bottom-10 w-60 rounded-2xl border border-soft bg-white p-4 shadow-lift sm:-left-8">
            <p className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4" /> Booking accepted</p>
            <p className="mt-1 text-xs text-slate-500">{top[0]?.name} confirmed 12 Dec</p>
          </motion.div>
          <motion.div animate={reduce ? undefined : { y: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute right-0 top-[52%] w-48 rounded-2xl bg-navy-900 p-4 text-white shadow-lift sm:-right-4">
            <p className="flex items-center justify-between text-xs text-slate-300">Budget used <Wallet className="h-4 w-4" /></p>
            <p className="mt-1 text-2xl font-extrabold">75%</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/20"><motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }} animate={{ width: '75%' }} transition={{ delay: 1.2, duration: 1.2, ease }} /></div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Marquee() {
  const reduce = useReducedMotion()
  const items = [...CATEGORIES, ...CATEGORIES, ...CATEGORIES, ...CATEGORIES]
  return (
    <div className="overflow-hidden border-y border-navy-900 bg-navy-900 py-4 text-white" aria-hidden>
      <motion.div className="flex w-max gap-10 whitespace-nowrap font-serif text-xl italic" animate={reduce ? undefined : { x: ['0%', '-50%'] }} transition={{ duration: 36, repeat: Infinity, ease: 'linear' }}>
        {[...items, ...items].map((c, i) => <span key={i} className="flex items-center gap-10">{c} <Star className="h-4 w-4 fill-white" /></span>)}
      </motion.div>
    </div>
  )
}

function Services() {
  const { vendors } = useStore()
  const [active, setActive] = useState(0)
  return (
    <section id="categories" className="container-x scroll-mt-20 py-20 lg:py-28">
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="max-w-xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">Everything your day needs</h2>
        <p className="max-w-xs text-slate-600">Hover or tap a service to see the providers who offer it.</p>
      </div>
      <div className="flex flex-col gap-3 lg:h-[30rem] lg:flex-row">
        {CATEGORIES.map((c, i) => {
          const Icon = categoryIcon[c]
          const list = vendors.filter((v) => v.category === c)
          const on = active === i
          return (
            <motion.button key={c} layout onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} aria-pressed={on}
              animate={{ flexGrow: on ? 3.2 : 1 }} transition={{ type: 'spring', damping: 30, stiffness: 240 }}
              className="relative flex min-h-28 basis-0 overflow-hidden rounded-3xl bg-black p-6 text-left text-white lg:min-h-0">
              <img src={categoryPhotos[c][0]} alt="" loading="lazy" draggable={false} className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${on ? 'scale-100 grayscale-0' : 'scale-110 grayscale'}`} />
              <span className={`absolute inset-0 transition-colors duration-500 ${on ? 'bg-gradient-to-t from-black/85 via-black/30 to-black/10' : 'bg-black/55'}`} />
              <Icon className="absolute right-6 top-6 h-7 w-7 text-white" aria-hidden />
              <div className="relative mt-auto w-full">
                <p className="font-serif text-xl font-semibold lg:text-2xl">{c}</p>
                <motion.div initial={false} animate={{ height: on ? 'auto' : 0, opacity: on ? 1 : 0 }} className="overflow-hidden">
                  <p className="mt-2 text-sm text-slate-300">{list.length} {list.length === 1 ? 'provider' : 'providers'} · from {money(Math.min(...list.map((v) => v.priceFrom)))}</p>
                  <Link to={`/vendors?category=${encodeURIComponent(c)}`} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">Browse {c.toLowerCase()} <ArrowUpRight className="h-4 w-4" /></Link>
                </motion.div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}

const steps = [
  { icon: CalendarCheck, title: 'Describe your event', text: 'Add the date, place, guest count and budget once. Every request reuses it, so you never retype a detail.' },
  { icon: Search, title: 'Compare trusted vendors', text: 'Filter by price, rating, availability and verified status. Open real portfolios and package lists side by side.' },
  { icon: MessageSquare, title: 'Chat, then request', text: 'Ask questions, get a quote and send a booking request. Every provider replies from the same inbox.' },
  { icon: Wallet, title: 'Stay inside budget', text: 'Split your total across services. The planner warns you the moment a category pushes you over.' },
]

function How() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return (
    <section id="how" className="scroll-mt-20 bg-white py-20 lg:py-28">
      <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">From first idea to confirmed booking</h2>
          <p className="mt-5 max-w-sm text-slate-600">Four steps, one workspace. Payment is agreed directly with your provider.</p>
          <Link to="/register" className={cn(buttonVariants({ variant: 'default' }), "mt-8 rounded-full px-6")}>Start planning <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        <div ref={ref} className="relative pl-8 sm:pl-12">
          <div className="absolute bottom-0 left-3 top-0 w-px bg-soft sm:left-5"><motion.div className="w-full origin-top bg-navy-900" style={{ scaleY: line, height: '100%' }} /></div>
          <ol className="space-y-6">
            {steps.map((s) => (
              <motion.li key={s.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-15% 0px' }} transition={{ duration: 0.7, ease }}
                className="relative rounded-3xl border border-soft bg-ivory p-7">
                <span className="absolute -left-[2.35rem] top-8 grid h-6 w-6 place-items-center rounded-full border-4 border-white bg-navy-900 sm:-left-[3.35rem]" aria-hidden />
                <s.icon className="h-7 w-7" aria-hidden />
                <h3 className="mt-4 font-serif text-2xl font-semibold">{s.title}</h3>
                <p className="mt-2 max-w-md text-slate-600">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function Featured() {
  const { vendors } = useStore()
  const list = vendors.filter((v) => v.verified).sort((a, b) => b.rating - a.rating)
  const wrap = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [limit, setLimit] = useState(0)
  const measure = () => wrap.current && track.current && setLimit(Math.min(0, wrap.current.clientWidth - track.current.scrollWidth))

  return (
    <section className="overflow-hidden py-20 lg:py-28">
      <div className="container-x mb-8 flex items-end justify-between gap-4">
        <h2 className="max-w-xl font-serif text-3xl font-semibold leading-tight sm:text-4xl">Top-rated, verified</h2>
        <Link to="/vendors" className={cn(buttonVariants({ variant: 'outline' }), "rounded-full")}>All vendors <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div ref={wrap} className="container-x">
        <motion.div ref={track} drag="x" dragConstraints={{ left: limit, right: 0 }} onViewportEnter={measure} className="flex w-max cursor-grab gap-5 active:cursor-grabbing">
          {list.map((v) => {
            const Icon = categoryIcon[v.category]
            return (
              <motion.div key={v.id} whileHover={{ y: -6 }} className="w-72 shrink-0 sm:w-80">
                <Link to={`/vendors/${v.id}`} draggable={false} className="block">
                  <Art src={v.photos[0]} label={v.name} hue={v.hue} icon={Icon} className="aspect-[3/4] w-full rounded-t-[999px] rounded-b-3xl" />
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <div><p className="font-serif text-xl font-semibold">{v.name}</p><p className="text-sm text-slate-500">{v.category} · {v.location}</p></div>
                    <VerifiedBadge />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm"><Stars value={v.rating} count={v.reviewCount} /><span>From <strong>{money(v.priceFrom)}</strong></span></div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
      <p className="container-x mt-6 text-sm text-slate-500">Drag to explore.</p>
    </section>
  )
}

function Trust() {
  const { accounts, vendors } = useStore()
  return (
    <section className="bg-navy-900 py-20 text-white lg:py-28">
      <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div>
          <ShieldCheck className="h-10 w-10" aria-hidden />
          <h2 className="mt-6 font-serif text-3xl font-semibold leading-tight sm:text-4xl">A badge you can rely on</h2>
          <p className="mt-5 max-w-md text-slate-300">New providers stay pending until our team reviews their business details. Only approved providers show the verified badge. Suspicious profiles can be reported by anyone, and we act on every report.</p>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          {[
            { n: accounts.filter((a) => a.status === 'verified').length, l: 'Providers verified' },
            { n: vendors.length, l: 'Providers listed' },
            { n: 4, l: 'Service categories' },
            { n: 100, l: 'Reports reviewed', s: '%' },
          ].map((s) => (
            <div key={s.l} className="rounded-3xl border border-white/15 bg-white/5 p-6">
              <dt className="text-sm text-slate-300">{s.l}</dt>
              <dd className="mt-2 font-serif text-4xl font-semibold"><Count to={s.n} suffix={s.s} /></dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/** Scroll behaviour 1: words light up one by one as the statement scrolls through the viewport. */
function Word({ children, range, progress }: { children: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.15, 1])
  return <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">{children}</motion.span>
}

function Statement() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = 'Planning an event should feel like choosing, not chasing. Compare real portfolios, ask questions in one inbox, and book people who have been checked.'.split(' ')
  return (
    <section className="container-x py-20 lg:py-32">
      <p ref={ref} className="mx-auto max-w-4xl font-serif text-3xl font-semibold leading-snug sm:text-5xl sm:leading-[1.15]">
        {words.map((w, i) => <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>)}
      </p>
    </section>
  )
}

/** Scroll behaviour 2: a framed photo grows to full-bleed while pinned, then the caption fades in. */
function ZoomReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const scale = useTransform(scrollYProgress, [0, 0.7], [reduce ? 1 : 0.5, 1])
  const radius = useTransform(scrollYProgress, [0, 0.7], [reduce ? 0 : 48, 0])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.25, 1])
  const textOpacity = useTransform(scrollYProgress, [0.55, 0.8], [0, 1])
  const textY = useTransform(scrollYProgress, [0.55, 0.8], [30, 0])
  return (
    <div ref={ref} className="relative h-[220vh]">
      <div className="sticky top-0 grid h-screen place-items-center overflow-hidden bg-white">
        <motion.div style={{ scale, borderRadius: radius }} className="relative h-full w-full overflow-hidden bg-black">
          <motion.img src={photo.bannerHall} alt="A banquet hall set with long tables, blue bunting and yellow flowers" style={{ scale: imgScale }} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <motion.div style={{ opacity: textOpacity, y: textY }} className="absolute inset-0 grid place-items-center px-6 text-center text-white">
            <div>
              <h2 className="mx-auto max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">From a garden for twenty to a hall for two hundred.</h2>
              <Link to="/vendors" className={cn(buttonVariants({ variant: 'secondary' }), 'mt-8 h-auto rounded-full bg-white px-7 py-3 text-black hover:bg-white/90')}>Find a venue partner <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

/** Scroll behaviour 3: vertical scroll drives a pinned horizontal gallery. */
const reel = [
  { src: photo.buffet, title: 'Catering', cat: 'Catering', text: 'Buffets, plated dinners and street food.' },
  { src: photo.weddingBouquet, title: 'Photography', cat: 'Photography', text: 'The moments between the poses.' },
  { src: photo.djStage, title: 'DJs and music', cat: 'DJs & Music', text: 'Sound, lights and a full dance floor.' },
  { src: photo.gazebo, title: 'Tents and seating', cat: 'Tents & Seating', text: 'Shelter and chairs, set up and collected.' },
  { src: photo.archFlorals, title: 'Decor', cat: 'Decor', text: 'Florals, arches and table styling.' },
]

function Reel() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['2%', '-62%'])
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  return (
    <div ref={ref} className="relative h-[340vh] bg-black text-white">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="container-x mb-8 flex items-end justify-between gap-6">
          <h2 className="max-w-md font-serif text-3xl font-semibold leading-tight sm:text-4xl">Five kinds of help, one place to find them</h2>
          <div className="hidden h-1 w-40 rounded-full bg-white/20 sm:block"><motion.div className="h-full rounded-full bg-white" style={{ width: bar }} /></div>
        </div>
        <motion.div style={{ x }} className="flex w-max gap-5 pl-4 sm:pl-8">
          {reel.map((r, i) => (
            <Link key={r.title} to={`/vendors?category=${encodeURIComponent(r.cat)}`}
              className={cn('group relative block shrink-0 overflow-hidden rounded-[2rem]', i % 2 ? 'mt-10 h-[52vh] w-[68vw] sm:w-[34vw]' : 'h-[58vh] w-[74vw] sm:w-[38vw]')}>
              <img src={r.src} alt={r.title} loading="lazy" draggable={false} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-serif text-2xl font-semibold">{r.title}</p>
                <p className="mt-1 text-sm text-white/80">{r.text}</p>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

/** CTA: photo columns drift in different directions around the call to action. */
const colA = [photo.balloons, photo.dishes, photo.rusticTable]
const colB = [photo.tableFlowers, photo.festival, photo.portraitDress]
const colC = [photo.grill, photo.clubConfetti, photo.archFlorals]
const colD = [photo.portraitDress, photo.festival, photo.tableFlowers]

function Column({ images, y, className = '' }: { images: string[]; y: MotionValue<number>; className?: string }) {
  return (
    <motion.div style={{ y }} className={cn('flex flex-col gap-4', className)} aria-hidden>
      {images.map((src, i) => (
        <img key={src} src={src} alt="" loading="lazy" draggable={false}
          className={cn('w-full object-cover', i % 2 ? 'aspect-[4/3] rounded-3xl' : 'aspect-[3/4] rounded-t-[999px] rounded-b-3xl')} />
      ))}
    </motion.div>
  )
}

function Cta() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const r = reduce ? 0 : 1
  const up = useTransform(scrollYProgress, [0, 1], [120 * r, -160 * r])
  const down = useTransform(scrollYProgress, [0, 1], [-160 * r, 120 * r])
  const mid = useTransform(scrollYProgress, [0, 1], [60 * r, -60 * r])
  return (
    <section ref={ref} className="overflow-hidden py-16 lg:py-24">
      <div className="container-x">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_1.35fr_1fr] md:gap-8">
          <div className="hidden grid-cols-2 gap-4 md:grid">
            <Column images={colA} y={up} />
            <Column images={colB} y={down} className="mt-16" />
          </div>
          <div className="text-center md:py-24">
            <h2 className="mx-auto max-w-xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">Run an event business? Get booked by people planning near you.</h2>
            <p className="mx-auto mt-4 max-w-md text-slate-600">Create a profile, show your best work and answer enquiries from one inbox. Get a verified badge after our team reviews your documents.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register" className={cn(buttonVariants({ variant: 'default' }), 'h-auto rounded-full px-7 py-3')}>Join as a provider</Link>
              <Link to="/vendors" className={cn(buttonVariants({ variant: 'outline' }), 'h-auto rounded-full px-7 py-3')}>Browse vendors</Link>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-4 md:grid">
            <Column images={colC} y={mid} className="mt-8" />
            <Column images={colD} y={up} className="mt-28" />
          </div>
          <div className="grid grid-cols-3 gap-3 md:hidden" aria-hidden>
            {[photo.balloons, photo.tableFlowers, photo.grill].map((src) => <img key={src} src={src} alt="" loading="lazy" className="aspect-[3/4] w-full rounded-t-[999px] rounded-b-2xl object-cover" />)}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (<><Hero /><Marquee /><Statement /><Services /><ZoomReveal /><How /><Reel /><Featured /><Trust /><Cta /></>)
}
