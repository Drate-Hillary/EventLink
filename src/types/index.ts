export type Role = 'customer' | 'provider' | 'admin'
export type BookingStatus = 'pending' | 'accepted' | 'declined'
export type AccountStatus = 'pending' | 'verified' | 'rejected' | 'suspended'

export const CATEGORIES = ['Catering', 'Photography', 'DJs & Music', 'Tents & Seating', 'Decor'] as const
export type Category = (typeof CATEGORIES)[number]

export interface Pkg { id: string; name: string; price: number; description: string; includes: string[] }
export interface Review { id: string; author: string; rating: number; text: string; date: string; eventType: string }
export interface Vendor {
  id: string; name: string; category: Category; location: string; areas: string[]
  rating: number; reviewCount: number; priceFrom: number; verified: boolean; available: boolean
  about: string; phone: string; email: string; hue: number
  packages: Pkg[]; reviews: Review[]; photos: string[]
}
export interface EventItem {
  id: string; name: string; type: string; date: string; location: string
  guests: number; budget: number; categories: Category[]
}
export interface Booking {
  id: string; eventId: string; vendorId: string; packageName: string; kind: 'quote' | 'booking'
  status: BookingStatus; note: string; createdAt: string; customer: string; eventDate?: string
}
export interface ChatMessage { id: string; from: 'customer' | 'provider'; text: string; time: string }
export interface Thread { id: string; vendorId: string; customer: string; messages: ChatMessage[]; unread: number }
export interface ProviderAccount {
  id: string; business: string; owner: string; category: Category; location: string
  status: AccountStatus; submitted: string; documents: string[]
}
export interface UserAccount { id: string; name: string; email: string; role: 'customer' | 'provider'; status: 'active' | 'suspended'; joined: string }
export type ReportStatus = 'open' | 'investigating' | 'resolved'
export interface Report { id: string; reporter: string; target: string; reason: string; date: string; status: ReportStatus; decision?: string }
export interface ActivityEntry { id: string; actor: string; action: string; target: string; time: string }
export interface CategoryItem { id: string; name: string; description: string; active: boolean }
export interface Session { name: string; email: string; role: Role }
