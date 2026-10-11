# EventLink

An event planning and services marketplace. Customers plan events and request quotes or bookings from vetted vendors. Vendors manage their business profile, packages, availability and requests. Admins verify vendors and keep the marketplace safe.

This is a front-end prototype. All data is mock data held in memory, and there is no backend. Payments, escrow and delivery tracking are out of scope for this version.

## Tech stack

| Area | Choice |
|---|---|
| Framework | React 19, TypeScript (strict), Vite 8 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v3, `tailwindcss-animate`, CSS variables for theme tokens |
| Components | shadcn/ui style components (hand-written) on Radix UI primitives, `class-variance-authority`, `clsx`, `tailwind-merge` |
| Calendar | `react-day-picker` v9 with `date-fns` |
| Motion | Framer Motion (`MotionConfig reducedMotion="user"`) |
| Charts | Recharts |
| Icons and toasts | `lucide-react`, `sonner` |
| Fonts | Plus Jakarta Sans (UI) and Playfair Display (headings) |

## Getting started

```bash
npm install --legacy-peer-deps
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # type-check and build for production
npm run lint       # run ESLint
npm run preview    # serve the production build
```

Restart the dev server after editing `tailwind.config.js`, because Tailwind v3 config is not hot-reloaded.

### Demo login

Login is simulated. Use any valid email address and a password of 6 or more characters, then pick a role.

| Role | Signs in as | Lands on |
|---|---|---|
| Customer | Amara Okoye | `/customer` |
| Provider | Saffron & Salt Catering (vendor `v1`) | `/provider` |
| Admin | Platform Admin | `/admin` |

The session is stored in `localStorage` under `eventlink.session`. All other data resets on refresh.

## Roles and features

### Public
- **Landing page** (`/`): a scroll-driven page built with Framer Motion. It has a hero, a marquee, a word-by-word statement reveal, expanding service panels, a pinned zoom image, a sticky how-it-works section, a horizontal gallery, a draggable carousel of featured vendors, animated counters, and a closing call to action with parallax photos.
- **Marketplace** (`/vendors`): search and filter by service, location and price. Only verified vendors appear, and filters use the categories an admin has marked active.
- **Vendor profile** (`/vendors/:id`): packages, portfolio, reviews, and a request form.
- **Login and register** (`/login`, `/register`).

### Customer (`/customer`)
A single page, with a scroll-spy section nav:
- **My events**: create, edit and delete events with a calendar date picker. Each card shows a countdown and budget progress.
- **Quote and booking requests**: track every request by status.
- **Find providers**: search verified vendors and open a profile.
- **Messages**: a two-pane inbox with each provider.
- **Budget planner**: allocate a budget by service with sliders, a donut chart, and an over-budget warning.

### Provider (`/provider/*`)
- **Overview**: verification status banner, stats, requests needing a reply, upcoming events, and a profile completeness checklist.
- **Enquiries**: conversations grouped as New, Awaiting customer and All.
- **Booking requests**: details dialog, accept or decline, and a report action. Accept is blocked when the date is marked unavailable or already accepted for another customer.
- **Business profile, Portfolio** (with reorder), **Services and packages**.
- **Availability**: a calendar for marking unavailable dates.
- **Reviews** and **Performance** (views, enquiries, conversion, acceptance rate, most requested packages).

### Admin (`/admin/*`)
- **Overview**: account stats, verification queue, open reports, charts and recent activity.
- **Provider verification**: review submitted documents, then approve, reject, request more information, or suspend.
- **Vendors** and **Customers**: searchable, filterable tables with suspend and reinstate. On phones, each row becomes a card.
- **Service categories**: add, edit and deactivate.
- **Requests**: a read-only list of all requests.
- **Analytics**: registrations, verification outcomes, request trend and most requested categories, each with a one-line insight.
- **Suspicious activity**: reports move through Open, Investigating and Resolved with a recorded decision.
- **Activity log**: every admin action is recorded with who did it and when.

## Project structure

```
src/
  App.tsx                    Routes, providers, scroll manager
  main.tsx                   Entry point
  index.css                  Tailwind layers and theme variables
  types/index.ts             Shared types (Role, Vendor, Booking, Report, ...)
  data/
    mock.ts                  Vendors, events, bookings, accounts, reports, chart data
    images.ts                Photo map and per-category photos
  features/
    store.tsx                Context store: session, vendors, events, bookings,
                             threads, portfolio, availability, accounts, reports,
                             activity log, categories, toasts
  components/
    ui/                      shadcn-style components + app wrappers (index.tsx)
    layout/                  PublicLayout, CustomerLayout, DashboardLayout
    bookings/                Chat, RequestModal
    providers/               VendorCard
  pages/
    public/                  Landing, Marketplace, VendorProfile, Auth
    customer/                CustomerHome, Customer (events, requests, messages, budget)
    provider/                Provider (all vendor pages)
    admin/                   Admin (all admin pages)
  lib/utils.ts               cn() helper
  utils/format.ts            Date and money formatting
public/images/               Photos used across the app
mockups/                     Design mockups (see below)
```

## Design system

- **Palette**: black and white only. Text is black on a white background, with greys for borders and secondary text. Status badges are the only colored elements. Charts use black and cinnamon (`#C2602B`).
- **Type**: base size is 13.5px. Headings use Playfair Display and UI text uses Plus Jakarta Sans.
- **Components**: wrappers in `src/components/ui/index.tsx` (`StatusBadge`, `Modal`, `Tabs`, `SelectInput`, `Field`, `PageHeader`, `Stat`, `EmptyState`, `Art`) sit on top of the shadcn-style primitives in the same folder.
- **Responsive**: all pages are checked down to 360px. Dashboards use a slide-in menu on phones, admin tables stack into cards below tablet width, and grids default to one column.
- **Motion**: Framer Motion on the landing page, with reduced-motion respected through `MotionConfig`.

## Mockups

`mockups/` contains generated images of the screens:

- `high-fidelity/`: screenshots of the built app.
- `low-fidelity/`: greyscale wireframes of the same screens.

Both are grouped by `public`, `customer`, `provider` and `admin`.

## Known limitations

- There is no backend. Permissions, verification gating and data changes happen only in the browser, and real permission checks must be enforced server-side before launch.
- Data resets on refresh. Only the login session persists.
- Earlier months in admin charts and the weekly vendor view counts are sample data.
- "Request more information" is recorded in the activity log but does not notify the provider.
- A category added by an admin appears in the public filter, but no provider can be assigned to it yet.
- Dev and install quirk: dependencies are installed with `--legacy-peer-deps`.
