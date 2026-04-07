# WanderPool — Frontend

Next.js (App Router) dashboard for the WanderPool travel experience marketplace. Covers agency management, operator views, admin moderation, and public experience browsing. Communicates with the Go backend via a BFF proxy pattern — JWT is stored in an httpOnly cookie, never exposed to client-side JavaScript.

---

## Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20+ | Runtime |
| [npm](https://www.npmjs.com/) | 10+ | Package manager |
| WanderPool Backend | running on port 8080 | API server |

---

## Environment Setup

Copy the example file:

```bash
cp .env.example .env.local
```

`.env.local` is **never committed** — it is in `.gitignore`. `.env.example` is the template you check in.

```env
# URL of the Go backend API — no trailing slash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

The backend must be running before you start the frontend. All authenticated API calls are proxied through `/api/proxy/[...path]` which reads the JWT from the httpOnly cookie server-side.

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

The app starts on `http://localhost:3000`.

### Other commands

```bash
# Type-check and build for production
npm run build

# Serve the production build locally
npm start

# Run ESLint
npm run lint
```

---

## Commit & Push Workflow

This repo uses the `master` branch. Remote is `origin` → `https://github.com/SahilKandari/wanderpool-frontend`.

```bash
# Stage specific files (never stage .env.local)
git add app/\(agency\)/agency/bookings/page.tsx lib/api/bookings.ts

# Commit with a descriptive message
git commit -m "add guide assignment to agency bookings"

# Push
git push origin master
```

**Never run `git add .` or `git add -A`** — your `.env.local` contains credentials and must stay local.

If you accidentally stage `.env.local`, unstage before committing:
```bash
git reset HEAD .env.local
```

---

## Folder Structure

```
frontend/
├── app/
│   ├── (admin)/                         # Admin dashboard — all pages behind admin JWT
│   │   ├── layout.tsx                   # Admin shell: sidebar + topbar
│   │   └── admin/
│   │       ├── admins/page.tsx          # Admin user management (super_admin only)
│   │       ├── agencies/page.tsx        # Agency moderation (approve/reject/suspend)
│   │       ├── bookings/page.tsx        # All platform bookings with dispute resolution
│   │       ├── categories/
│   │       │   ├── page.tsx             # Category tree browser
│   │       │   └── [id]/fields/page.tsx # Category field management (drives dynamic forms)
│   │       ├── dashboard/page.tsx       # Platform overview stats
│   │       ├── experiences/page.tsx     # Experience moderation (approve/reject/pause)
│   │       ├── payouts/page.tsx         # Payout disbursement (mark-paid)
│   │       ├── schedule/page.tsx        # Platform-wide schedule view
│   │       └── settings/page.tsx        # Platform settings (commission rate etc.)
│   │
│   ├── (agency)/                        # Agency dashboard — all pages behind agency JWT
│   │   ├── layout.tsx                   # Agency shell: sidebar + topbar
│   │   └── agency/
│   │       ├── bookings/page.tsx        # Bookings: view details, assign guide, collect cash
│   │       ├── dashboard/page.tsx       # Agency overview stats
│   │       ├── experiences/
│   │       │   ├── page.tsx             # List all experiences
│   │       │   ├── new/page.tsx         # Create experience (redirects to slots after save)
│   │       │   └── [id]/
│   │       │       ├── edit/page.tsx    # Edit experience: Details / Pricing / Activity Info / Slots tabs
│   │       │       ├── images/page.tsx  # Image gallery: upload, reorder, set cover
│   │       │       └── slots/page.tsx   # Slot management: single + bulk recurring creation
│   │       ├── guides/page.tsx          # Guide management: invite, activate, remove
│   │       ├── payouts/page.tsx         # Monthly payout summaries
│   │       ├── schedule/page.tsx        # Week view calendar of all bookings
│   │       └── settings/page.tsx        # Agency profile, notification prefs, account
│   │
│   ├── (auth)/                          # Auth pages — no sidebar, centered layout
│   │   ├── layout.tsx                   # Centered card layout for auth pages
│   │   ├── login/page.tsx               # Unified login: agency / operator / admin role selector
│   │   ├── forgot-password/page.tsx     # 3-step OTP password reset (request → verify → reset)
│   │   ├── agency/
│   │   │   ├── login/page.tsx           # Agency-specific login
│   │   │   └── register/page.tsx        # Agency registration form
│   │   ├── admin/login/page.tsx         # Admin login
│   │   ├── customer/
│   │   │   ├── login/page.tsx           # Customer login
│   │   │   └── register/page.tsx        # Customer registration
│   │   └── operator/login/page.tsx      # Operator (guide) login
│   │
│   ├── (operator)/                      # Operator dashboard — behind operator JWT
│   │   ├── layout.tsx
│   │   └── operator/
│   │       ├── bookings/page.tsx        # Assigned bookings: start, complete, collect cash (with confirmations)
│   │       ├── dashboard/page.tsx       # Operator overview
│   │       └── schedule/page.tsx        # Operator week view calendar
│   │
│   ├── (public)/                        # Public-facing pages — no auth required
│   │   ├── layout.tsx                   # Public shell with nav
│   │   ├── page.tsx                     # Homepage
│   │   ├── bookings/
│   │   │   ├── [id]/page.tsx            # Booking detail page
│   │   │   └── confirmation/page.tsx    # Post-payment confirmation
│   │   ├── customer/dashboard/page.tsx  # Customer dashboard (bookings, history)
│   │   └── experiences/
│   │       ├── page.tsx                 # Experience listing with search/filter
│   │       ├── [slug]/page.tsx          # Experience detail: date picker, slot tiles, book button
│   │       └── [slug]/book/page.tsx     # Checkout: Razorpay payment, participant count
│   │
│   └── api/                             # Next.js Route Handlers (BFF layer)
│       ├── auth/
│       │   ├── login/route.ts           # POST: validates with Go backend, sets httpOnly JWT cookie
│       │   ├── logout/route.ts          # POST: clears JWT cookie
│       │   └── me/route.ts              # GET: decodes JWT from cookie, returns current user
│       └── proxy/
│           └── [...path]/route.ts       # Forwards all /api/proxy/* requests to Go backend with JWT header
│
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx                # Reusable login form component
│   ├── experiences/
│   │   ├── CategoryPicker.tsx           # Hierarchical category selector (tree navigation)
│   │   └── DynamicMetadataForm.tsx      # Dynamic form driven by category_fields API — handles all activity types
│   ├── layout/
│   │   ├── AdminSidebar.tsx             # Admin navigation sidebar
│   │   ├── AgencySidebar.tsx            # Agency navigation sidebar
│   │   └── Topbar.tsx                   # Top bar with user menu and logout
│   ├── shared/
│   │   ├── EmptyState.tsx               # Empty state illustration + message
│   │   ├── PageHeader.tsx               # Consistent page header with title and actions
│   │   └── StatusBadge.tsx              # Booking/experience status colored badge
│   └── ui/                              # shadcn/ui primitives (do not edit manually)
│       └── avatar.tsx, badge.tsx, button.tsx, card.tsx, dialog.tsx, ...
│
├── lib/
│   ├── api/                             # API client functions (called from pages/components)
│   │   ├── client.ts                    # apiFetch (auth, through proxy) + publicFetch (no auth, direct)
│   │   ├── admin.ts                     # Admin API calls (agencies, experiences, bookings, payouts, settings)
│   │   ├── auth.ts                      # requestOTP, verifyOTP, resetPassword (password reset flow)
│   │   ├── bookings.ts                  # initiateBooking, verifyPayment, assignGuide, collectCash, etc.
│   │   ├── categories.ts                # Category tree + field fetching
│   │   ├── experiences.ts               # Experience CRUD, images, public listing
│   │   ├── favourites.ts                # Customer favourites add/remove/list
│   │   ├── guides.ts                    # Agency guide listing (for assign dropdown)
│   │   ├── payouts.ts                   # Agency payout history
│   │   └── slots.ts                     # Slot creation, listing, deletion
│   │
│   ├── hooks/
│   │   └── useFavourite.ts              # TanStack Query mutation hook for toggling favourites
│   │
│   ├── providers/
│   │   ├── AuthProvider.tsx             # Reads /api/auth/me on mount; exposes useAuth() hook
│   │   └── QueryProvider.tsx            # TanStack Query client with devtools
│   │
│   ├── types/
│   │   ├── auth.ts                      # User, AuthContext types
│   │   ├── booking.ts                   # Booking, Payout types
│   │   └── experience.ts                # Experience, Slot, Category, CategoryField types
│   │
│   ├── utils/
│   │   ├── currency.ts                  # formatPaise(n) → "₹1,299" (paise to rupees display)
│   │   └── date.ts                      # Date formatting helpers (IST-aware)
│   │
│   ├── session.ts                       # Server-side JWT decode from cookie (used in route handlers)
│   └── utils.ts                         # cn() — className merging (clsx + tailwind-merge)
│
├── public/                              # Static assets served at /
│   └── *.svg
│
├── app/globals.css                      # Tailwind base + CSS variables for shadcn theme
├── app/layout.tsx                       # Root layout: QueryProvider + AuthProvider + Toaster
├── components.json                      # shadcn/ui configuration
├── eslint.config.mjs                    # ESLint config
├── postcss.config.mjs                   # PostCSS + Tailwind v4
├── tsconfig.json                        # TypeScript config with @/* path alias
├── package.json
└── package-lock.json
```

---

## What is Included / Excluded in Git

### Included
- All source code (`app/`, `components/`, `lib/`)
- `.env.example` — template with placeholder values only
- `package.json`, `package-lock.json`
- Config files: `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `components.json`
- `public/` static assets
- `CLAUDE.md`, `AGENTS.md`

### Excluded
- `.env.local` — contains backend URL and any sensitive config
- `.env.*` — any environment-specific files (except `.env.example`)
- `node_modules/` — install with `npm install`
- `.next/` — Next.js build output
- `tsconfig.tsbuildinfo` — TypeScript incremental build cache

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `next` 16.2.2 | App Router framework |
| `react` / `react-dom` 19.2.4 | UI rendering |
| `@tanstack/react-query` | Server state management, caching, mutations |
| `react-hook-form` + `zod` | Form state + schema validation |
| `@hookform/resolvers` | Connects zod to react-hook-form |
| `@radix-ui/*` | Accessible UI primitives (shadcn/ui uses these) |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `tailwindcss` v4 | Utility-first CSS |
| `framer-motion` | Page / component animations |
| `jose` | JWT decode on the server (Next.js route handlers) |
| `next-themes` | Dark/light mode support |
| `clsx` + `tailwind-merge` | Safe className merging (`cn()` utility) |

---

## Architecture Notes

### Auth flow
1. User submits login form → hits `/api/auth/login` (Next.js route handler, not Go directly)
2. Route handler calls Go backend, gets JWT back, then sets it as an **httpOnly cookie** (JavaScript cannot read this)
3. `AuthProvider` calls `/api/auth/me` on mount — decodes cookie server-side, returns user to React
4. `useAuth()` hook exposes `{ user, logout, refresh }` anywhere in the app

### API call patterns
- **Authenticated calls** → `apiFetch(path)` → goes through `/api/proxy/[...path]` → Next.js injects JWT header → forwarded to Go backend
- **Public calls** (experience listing, slot availability) → `publicFetch(path)` → goes directly to `NEXT_PUBLIC_BACKEND_URL`, no auth

### Data fetching
- TanStack Query (`useQuery`, `useMutation`) manages all server state
- Each `lib/api/*.ts` file exports query key factories for cache consistency
- Mutations invalidate related query keys on success — no manual page refresh needed
- Dialog state stores only the entity **ID**, then derives the live object from the query cache — so mutations reflect in open dialogs instantly

### Dynamic forms
`DynamicMetadataForm` reads `category_fields` from the API and renders the correct input per field type (`string`, `number`, `boolean`, `enum`, `string_array`, `object_array`). Fields are grouped by `group_name`. One component handles every activity type — no per-category code.

### Route groups
Next.js route groups (parenthesised folder names) share layouts without affecting the URL path:
- `(admin)` → `/admin/*` routes share the admin sidebar
- `(agency)` → `/agency/*` routes share the agency sidebar
- `(operator)` → `/operator/*` routes share the operator layout
- `(auth)` → login/register pages share a centered card layout
- `(public)` → public pages share a navbar layout

---

## Test Accounts

Start the backend and run `seeds/sample_data.sql` first. All accounts use password `Password123`.

| Role | Email | Dashboard |
|---|---|---|
| Admin | `admin@wanderpool.in` | `/admin/dashboard` |
| Agency | `agency@rishikeshrapids.com` | `/agency/dashboard` |
| Operator | `ravi@rishikeshrapids.com` | `/operator/dashboard` |
| Customer | `priya@example.com` | `/customer/dashboard` |
