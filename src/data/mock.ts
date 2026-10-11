import { photo } from './images'
import type { Booking, EventItem, ProviderAccount, Report, Thread, UserAccount, Vendor } from '../types'

const rv = (id: string, author: string, rating: number, text: string, date: string, eventType: string) =>
  ({ id, author, rating, text, date, eventType })

const baseVendors: Omit<Vendor, 'photos'>[] = [
  {
    id: 'v1', name: 'Saffron & Salt Catering', category: 'Catering', location: 'Austin, TX',
    areas: ['Austin, TX', 'Round Rock, TX', 'San Marcos, TX'], rating: 4.9, reviewCount: 128,
    priceFrom: 1800, verified: true, available: true, hue: 18, phone: '+1 512 555 0142', email: 'hello@saffronsalt.example',
    about: 'Seasonal menus cooked from scratch for weddings, corporate dinners and family celebrations. Our team handles service, staffing and clean-up so you can enjoy your guests.',
    packages: [
      { id: 'p1', name: 'Garden Buffet', price: 1800, description: 'Relaxed buffet for up to 60 guests.', includes: ['3 mains, 4 sides', 'Service staff (4)', 'Table setup'] },
      { id: 'p2', name: 'Plated Dinner', price: 3400, description: 'Three-course plated service for up to 80 guests.', includes: ['Three courses', 'Service staff (8)', 'Tasting session'] },
      { id: 'p3', name: 'Grand Celebration', price: 6200, description: 'Full-service catering for up to 200 guests.', includes: ['Five-course menu', 'Bar service', 'Event coordinator'] },
    ],
    reviews: [
      rv('r1', 'Amara O.', 5, 'The food was the talk of the wedding. Every guest asked who catered.', '2026-08-14', 'Wedding'),
      rv('r2', 'Daniel K.', 5, 'On time, tidy and flexible when our guest count changed.', '2026-06-02', 'Birthday'),
      rv('r3', 'Priya S.', 4, 'Great menu. Dessert table ran a little late.', '2026-04-19', 'Corporate'),
    ],
  },
  {
    id: 'v2', name: 'Lumen Lane Photography', category: 'Photography', location: 'Austin, TX',
    areas: ['Austin, TX', 'Dallas, TX'], rating: 4.8, reviewCount: 94, priceFrom: 900, verified: true, available: true, hue: 215,
    phone: '+1 512 555 0177', email: 'book@lumenlane.example',
    about: 'Documentary-style photographers who capture the moments between the poses. Online galleries delivered within two weeks.',
    packages: [
      { id: 'p1', name: 'Essentials', price: 900, description: '4 hours of coverage.', includes: ['1 photographer', '300 edited photos', 'Online gallery'] },
      { id: 'p2', name: 'Full Day', price: 2100, description: '8 hours of coverage.', includes: ['2 photographers', '700 edited photos', 'Printed album'] },
    ],
    reviews: [rv('r1', 'Lena M.', 5, 'Natural, warm photos. We still look at them every week.', '2026-07-21', 'Wedding')],
  },
  {
    id: 'v3', name: 'Bassline Brothers DJs', category: 'DJs & Music', location: 'Round Rock, TX',
    areas: ['Round Rock, TX', 'Austin, TX'], rating: 4.6, reviewCount: 61, priceFrom: 650, verified: true, available: false, hue: 285,
    phone: '+1 512 555 0109', email: 'play@bassline.example',
    about: 'DJs, MCs and sound systems for dance floors of every size. We read the room and keep the playlist moving.',
    packages: [
      { id: 'p1', name: 'Party Set', price: 650, description: '4 hours with sound and lights.', includes: ['DJ + MC', 'Speakers', 'Dance lighting'] },
      { id: 'p2', name: 'All Night', price: 1300, description: '8 hours including ceremony audio.', includes: ['2 DJs', 'Ceremony audio', 'Uplighting'] },
    ],
    reviews: [
      rv('r1', 'Marcus T.', 5, 'The dance floor was full all night.', '2026-05-30', 'Wedding'),
      rv('r2', 'Sofia R.', 4, 'Great energy, slightly loud for the older guests.', '2026-03-12', 'Anniversary'),
    ],
  },
  {
    id: 'v4', name: 'Canopy & Co. Tents', category: 'Tents & Seating', location: 'San Marcos, TX',
    areas: ['San Marcos, TX', 'Austin, TX', 'Round Rock, TX'], rating: 4.7, reviewCount: 73, priceFrom: 750, verified: true, available: true, hue: 165,
    phone: '+1 512 555 0188', email: 'rent@canopyco.example',
    about: 'Clear-span tents, tables and chairs delivered, set up and collected. Weather-ready for outdoor events.',
    packages: [
      { id: 'p1', name: 'Garden Tent', price: 750, description: '20×30 ft tent with 40 chairs.', includes: ['Tent + sidewalls', '40 chairs, 5 tables', 'Delivery + setup'] },
      { id: 'p2', name: 'Marquee', price: 2400, description: '40×60 ft marquee with 120 chairs.', includes: ['Lighting', '120 chairs, 15 tables', 'Flooring'] },
    ],
    reviews: [rv('r1', 'Hannah B.', 5, 'The rain came and the tent held up beautifully.', '2026-09-03', 'Wedding')],
  },
  {
    id: 'v5', name: 'Wild Fern Florals', category: 'Decor', location: 'Dallas, TX',
    areas: ['Dallas, TX', 'Austin, TX'], rating: 4.5, reviewCount: 38, priceFrom: 500, verified: false, available: true, hue: 340,
    phone: '+1 214 555 0120', email: 'studio@wildfern.example',
    about: 'Florals, arches and table styling in natural, seasonal palettes.',
    packages: [{ id: 'p1', name: 'Table Styling', price: 500, description: 'Centrepieces for up to 12 tables.', includes: ['12 centrepieces', 'Candles', 'Setup + strike'] }],
    reviews: [rv('r1', 'Grace L.', 4, 'Lovely arrangements, a little pricey.', '2026-02-11', 'Wedding')],
  },
  {
    id: 'v6', name: 'Kettle & Cart Street Food', category: 'Catering', location: 'Dallas, TX',
    areas: ['Dallas, TX'], rating: 4.4, reviewCount: 52, priceFrom: 1200, verified: true, available: true, hue: 40,
    phone: '+1 214 555 0155', email: 'eat@kettlecart.example',
    about: 'Food trucks and carts for casual celebrations. Tacos, wood-fired pizza and desserts.',
    packages: [{ id: 'p1', name: 'Two-Cart Feast', price: 1200, description: 'Two carts, up to 80 guests.', includes: ['2 carts', 'Staff', 'Disposable serveware'] }],
    reviews: [rv('r1', 'Omar F.', 4, 'Guests loved the pizza.', '2026-06-27', 'Birthday')],
  },
  {
    id: 'v7', name: 'Golden Hour Studios', category: 'Photography', location: 'Dallas, TX',
    areas: ['Dallas, TX', 'Austin, TX'], rating: 4.9, reviewCount: 110, priceFrom: 1200, verified: true, available: false, hue: 45,
    phone: '+1 214 555 0190', email: 'hi@goldenhour.example',
    about: 'Cinematic photo and video for weddings and milestone events.',
    packages: [{ id: 'p1', name: 'Photo + Film', price: 3200, description: 'Photo and highlight film.', includes: ['2 shooters', '4K highlight film', 'Gallery'] }],
    reviews: [rv('r1', 'Nia P.', 5, 'The film made us cry. Worth every penny.', '2026-08-30', 'Wedding')],
  },
  {
    id: 'v8', name: 'Velvet Tent Events', category: 'Tents & Seating', location: 'Dallas, TX',
    areas: ['Dallas, TX'], rating: 4.2, reviewCount: 19, priceFrom: 600, verified: false, available: true, hue: 190,
    phone: '+1 214 555 0111', email: 'hello@velvettent.example',
    about: 'Affordable tents and chair rentals for backyard events.',
    packages: [{ id: 'p1', name: 'Backyard Set', price: 600, description: '10×20 tent, 30 chairs.', includes: ['Tent', '30 chairs', '3 tables'] }],
    reviews: [],
  },
]

const vendorPhotos: Record<string, string[]> = {
  v1: [photo.buffet, photo.platedDinner, photo.dishes, photo.grill],
  v2: [photo.weddingBouquet, photo.archFlorals, photo.tableFlowers, photo.portraitDress],
  v3: [photo.djStage, photo.festival, photo.clubConfetti, photo.confetti],
  v4: [photo.gazebo, photo.bannerHall, photo.rusticTable, photo.archFlorals],
  v5: [photo.archFlorals, photo.tableFlowers, photo.rusticTable, photo.balloons],
  v6: [photo.grill, photo.dishes, photo.buffet, photo.platedDinner],
  v7: [photo.portraitDress, photo.weddingBouquet, photo.gazebo, photo.tableFlowers],
  v8: [photo.bannerHall, photo.gazebo, photo.rusticTable, photo.balloons],
}

export const vendors: Vendor[] = baseVendors.map((v) => ({ ...v, photos: vendorPhotos[v.id] }))

export const myEvents: EventItem[] = [
  { id: 'e1', name: 'Amara & Tobi’s Wedding', type: 'Wedding', date: '2026-12-12', location: 'Austin, TX', guests: 120, budget: 18000, categories: ['Catering', 'Photography', 'DJs & Music', 'Tents & Seating'] },
  { id: 'e2', name: 'Mum’s 60th Birthday', type: 'Birthday', date: '2027-02-20', location: 'Round Rock, TX', guests: 45, budget: 4000, categories: ['Catering', 'DJs & Music'] },
]

// Every request in the system. Customer sees those with customer === session name; provider (v1) sees vendorId === 'v1'.
export const allBookings: Booking[] = [
  { id: 'b1', eventId: 'e1', vendorId: 'v1', packageName: 'Plated Dinner', kind: 'booking', status: 'accepted', note: 'Vegetarian options for 15 guests.', createdAt: '2026-09-28', customer: 'Amara Okoye', eventDate: '2026-12-12' },
  { id: 'b2', eventId: 'e1', vendorId: 'v2', packageName: 'Full Day', kind: 'quote', status: 'pending', note: 'Do you travel to the venue near Lake Travis?', createdAt: '2026-10-05', customer: 'Amara Okoye', eventDate: '2026-12-12' },
  { id: 'b3', eventId: 'e1', vendorId: 'v3', packageName: 'All Night', kind: 'booking', status: 'declined', note: '', createdAt: '2026-10-01', customer: 'Amara Okoye', eventDate: '2026-12-12' },
  { id: 'b4', eventId: 'e2', vendorId: 'v1', packageName: 'Garden Buffet', kind: 'quote', status: 'pending', note: 'Is a birthday cake included?', createdAt: '2026-10-08', customer: 'Amara Okoye', eventDate: '2027-02-20' },
  { id: 'b5', eventId: 'x1', vendorId: 'v1', packageName: 'Grand Celebration', kind: 'booking', status: 'pending', note: 'Corporate gala, 180 guests, 14 Nov.', createdAt: '2026-10-09', customer: 'Northwind Ltd', eventDate: '2026-11-14' },
  { id: 'b6', eventId: 'x2', vendorId: 'v1', packageName: 'Garden Buffet', kind: 'quote', status: 'pending', note: 'Baby shower, 35 guests.', createdAt: '2026-10-10', customer: 'Jess Mwangi', eventDate: '2026-11-21' },
  { id: 'b7', eventId: 'x3', vendorId: 'v1', packageName: 'Plated Dinner', kind: 'booking', status: 'declined', note: 'Date clash with another event.', createdAt: '2026-09-15', customer: 'Tom Alvarez', eventDate: '2026-10-31' },
]

export const threads: Thread[] = [
  { id: 't1', vendorId: 'v1', customer: 'Amara Okoye', unread: 1, messages: [
    { id: 'm1', from: 'customer', text: 'Hi! Can you cater for 120 guests on 12 December?', time: '2026-09-27T10:12' },
    { id: 'm2', from: 'provider', text: 'Yes, we have that date open. The Plated Dinner package suits that size.', time: '2026-09-27T11:02' },
    { id: 'm3', from: 'customer', text: 'Perfect. Can you accommodate 15 vegetarian guests?', time: '2026-09-28T09:40' },
    { id: 'm4', from: 'provider', text: 'Of course. I’ll add a vegetarian main to the tasting.', time: '2026-09-28T10:15' },
  ] },
  { id: 't2', vendorId: 'v2', customer: 'Amara Okoye', unread: 0, messages: [
    { id: 'm1', from: 'customer', text: 'Do you travel to venues near Lake Travis?', time: '2026-10-05T14:20' },
  ] },
  { id: 't3', vendorId: 'v1', customer: 'Northwind Ltd', unread: 2, messages: [
    { id: 'm1', from: 'customer', text: 'We need a three-course dinner for 180 on 14 Nov. Is that possible?', time: '2026-10-09T08:30' },
    { id: 'm2', from: 'customer', text: 'Budget is flexible.', time: '2026-10-09T08:31' },
  ] },
]

export const providerAccounts: ProviderAccount[] = [
  { id: 'a1', business: 'Harvest Table Catering', owner: 'Jonas Reed', category: 'Catering', location: 'Austin, TX', status: 'pending', submitted: '2026-10-09', documents: ['Business licence', 'Food handler certificate'] },
  { id: 'a2', business: 'Pulse Sound Co.', owner: 'Dee Marlowe', category: 'DJs & Music', location: 'Dallas, TX', status: 'pending', submitted: '2026-10-08', documents: ['Business licence', 'Insurance certificate'] },
  { id: 'a3', business: 'Peak Tent Rentals', owner: 'Rita Gomez', category: 'Tents & Seating', location: 'San Marcos, TX', status: 'pending', submitted: '2026-10-06', documents: ['Business licence'] },
  { id: 'a4', business: 'Saffron & Salt Catering', owner: 'Maya Ibrahim', category: 'Catering', location: 'Austin, TX', status: 'verified', submitted: '2026-03-02', documents: ['Business licence', 'Food handler certificate'] },
  { id: 'a5', business: 'Lumen Lane Photography', owner: 'Ben Hart', category: 'Photography', location: 'Austin, TX', status: 'verified', submitted: '2026-02-14', documents: ['Business licence'] },
  { id: 'a6', business: 'Quick Snaps', owner: 'Unknown', category: 'Photography', location: 'Austin, TX', status: 'rejected', submitted: '2026-09-20', documents: [] },
]

export const users: UserAccount[] = [
  { id: 'u1', name: 'Amara Okoye', email: 'amara@example.com', role: 'customer', status: 'active', joined: '2026-08-01' },
  { id: 'u2', name: 'Jess Mwangi', email: 'jess@example.com', role: 'customer', status: 'active', joined: '2026-09-12' },
  { id: 'u3', name: 'Tom Alvarez', email: 'tom@example.com', role: 'customer', status: 'suspended', joined: '2026-05-30' },
  { id: 'u4', name: 'Maya Ibrahim', email: 'maya@saffronsalt.example', role: 'provider', status: 'active', joined: '2026-03-02' },
  { id: 'u5', name: 'Ben Hart', email: 'ben@lumenlane.example', role: 'provider', status: 'active', joined: '2026-02-14' },
  { id: 'u6', name: 'Dee Marlowe', email: 'dee@pulse.example', role: 'provider', status: 'active', joined: '2026-10-08' },
]

export const reports: Report[] = [
  { id: 'rp1', reporter: 'Jess Mwangi', target: 'Velvet Tent Events', reason: 'Asked for a deposit by bank transfer before confirming the booking.', date: '2026-10-09', status: 'open' },
  { id: 'rp2', reporter: 'Saffron & Salt Catering', target: 'Tom Alvarez', reason: 'Repeated requests then cancelled with no notice.', date: '2026-10-04', status: 'investigating', decision: 'Contacted the customer for their side of the story.' },
  { id: 'rp3', reporter: 'Amara Okoye', target: 'Quick Snaps', reason: 'Profile photos copied from another photographer.', date: '2026-09-21', status: 'resolved', decision: 'Photos matched another account. Provider rejected.' },
]

export const monthlySignups = [
  { month: 'May', customers: 42, providers: 9 }, { month: 'Jun', customers: 58, providers: 12 },
  { month: 'Jul', customers: 71, providers: 15 }, { month: 'Aug', customers: 96, providers: 18 },
  { month: 'Sep', customers: 124, providers: 24 }, { month: 'Oct', customers: 88, providers: 17 },
]

export const activitySeed = [
  { id: 'l1', actor: 'Platform Admin', action: 'Approved provider', target: 'Saffron & Salt Catering', time: '2026-03-03T09:12' },
  { id: 'l2', actor: 'Platform Admin', action: 'Approved provider', target: 'Lumen Lane Photography', time: '2026-02-15T14:40' },
  { id: 'l3', actor: 'Platform Admin', action: 'Rejected provider', target: 'Quick Snaps', time: '2026-09-21T11:05' },
  { id: 'l4', actor: 'Platform Admin', action: 'Suspended customer', target: 'Tom Alvarez', time: '2026-10-05T16:20' },
  { id: 'l5', actor: 'Platform Admin', action: 'Resolved report', target: 'Quick Snaps', time: '2026-09-22T10:00' },
]

export const categorySeed = [
  { id: 'c1', name: 'Catering', description: 'Food, drink and service staff', active: true },
  { id: 'c2', name: 'Photography', description: 'Photo and video coverage', active: true },
  { id: 'c3', name: 'DJs & Music', description: 'DJs, bands and sound systems', active: true },
  { id: 'c4', name: 'Tents & Seating', description: 'Tents, tables and chairs', active: true },
  { id: 'c5', name: 'Decor', description: 'Florals, styling and lighting', active: true },
]

export const verificationOutcomes = [
  { month: 'May', approved: 7, rejected: 2 }, { month: 'Jun', approved: 10, rejected: 2 },
  { month: 'Jul', approved: 12, rejected: 3 }, { month: 'Aug', approved: 15, rejected: 3 },
  { month: 'Sep', approved: 21, rejected: 3 }, { month: 'Oct', approved: 11, rejected: 4 },
]

export const requestTrend = [
  { month: 'May', quotes: 31, bookings: 12 }, { month: 'Jun', quotes: 44, bookings: 19 },
  { month: 'Jul', quotes: 58, bookings: 27 }, { month: 'Aug', quotes: 83, bookings: 38 },
  { month: 'Sep', quotes: 112, bookings: 55 }, { month: 'Oct', quotes: 74, bookings: 33 },
]

export const providerViews = [
  { week: 'Wk 1', views: 142, enquiries: 9 }, { week: 'Wk 2', views: 188, enquiries: 13 },
  { week: 'Wk 3', views: 171, enquiries: 11 }, { week: 'Wk 4', views: 236, enquiries: 17 },
  { week: 'Wk 5', views: 264, enquiries: 19 }, { week: 'Wk 6', views: 298, enquiries: 22 },
]
