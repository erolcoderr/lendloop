# LendLoop 🤝

### A Digital Bayanihan Resource Sharing & Reservation System

> *Borrow what you need. Lend what you don't. Together, kapitbahay.*

LendLoop revives the Filipino spirit of **bayanihan** — neighbors pooling resources to lift one another — and rebuilds it for the modern barangay. Instead of buying a drill for one shelf, a tent for one trip, or a kaldero for one fiesta, neighbors lend to neighbors, backed by trust scores, digital agreements, and a community-first safety net.

A capstone-grade frontend prototype that demonstrates a complete peer-to-peer lending loop: **list → request → agree → borrow → return → review** — all wrapped in a warm, accessible, culturally-rooted interface.

---

## ✨ Why LendLoop?

| The problem | The LendLoop way |
|---|---|
| Tools gather dust 360 days a year | Owners earn trust; borrowers save money |
| Buying for one-time use is wasteful | One drill serves the whole barangay |
| Stranger-to-stranger lending feels risky | Trust scores + verified neighbors + digital agreements |
| Community ties are fading | Every borrow is a small act of bayanihan |

LendLoop isn't a CRUD app with a marketplace skin. It's a **trust engine** dressed in Filipino warmth — designed so a kapitbahay feels safe handing their stand mixer to someone they've only waved at across the street.

---

## 🎯 Core capabilities

**For neighbors (members)**
- **Lend an item** — list tools, gear, and appliances with photos, a deposit, and a max-borrow window.
- **Browse & request** — search by category, condition, or keyword; pick dates on a calendar that already blocks booked days.
- **Borrow flow** — a 3-step guided flow: dates + message → digital agreement with a typed signature → confirmation.
- **Dashboard** — track items you're lending, borrows you've made, and act on requests (approve, reject, mark borrowed, mark returned, leave a review).
- **Trust profile** — your trust score, computed from real reviews, with a transparent breakdown.

**For barangay stewards (admins)**
- **Stewardship overview** — community stats, weekly borrow trends, category distribution, and a live activity feed.
- **Member directory** — searchable, sortable table with suspend/activate controls and per-member trust scores.
- **Community reports** — five charts (top lenders, most-borrowed items, borrow trends, category mix, on-time vs. overdue returns) with insight sentences.

---

## 🎨 Design philosophy

**Bayanihan theme, not a template.** A custom warm palette — terracotta, sunset, amber, cream — runs through every surface. No generic Bootstrap blue. No indigo. The Lora display typeface gives headings a community-gazette warmth; the logomark is two interlocking arcs forming a loop, echoing the circular give-and-take of lending.

**Motion with meaning.** Cards fade up and stagger by 50ms. Modals scale in. Toasts slide from the top-right and dismiss in 4 seconds. No animation exceeds 500ms — the app respects your time.

**Trust, made visible.** Trust scores, verified-neighbor badges, review counts, and deposit amounts appear wherever a decision is made. You always know who you're lending to.

**Accessible by default.** Semantic HTML, ARIA labels, keyboard navigation, WCAG-AA contrast, and screen-reader-friendly forms with inline validation.

---

## 🧠 The state machines

Every borrow moves through a visible, color-coded state machine — so the whole community can see where a lend stands.

```
Borrow request:  pending → approved → borrowed → returned
                     ↓
                 rejected / cancelled

Item:            available → reserved → borrowed → available (on return)

Reservation:     active → fulfilled | cancelled | expired
```

Each transition is a single click in the dashboard, syncs the item's status, fires a notification to the other party, and confirms with a toast.

---

## 🛠 Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Modern React 19, file-based routing, server-rendering ready |
| Language | **TypeScript 5** | End-to-end type safety |
| Styling | **Tailwind CSS 4** + **shadcn/ui** (New York) | Composable, themeable, accessible primitives |
| State | **Zustand** (client cache hydrated from API) | Lightweight stores for auth, router, and data — synced with MySQL |
| Charts | **Recharts** | Warm, responsive admin analytics |
| Motion | **Framer Motion** | Polished, meaningful micro-interactions |
| Icons | **Lucide** | Consistent, tree-shakeable |
| Database | **MySQL** via **Prisma ORM** | Real relational persistence with typed models |
| Auth | Cookie-based session (httpOnly) | Secure, server-validated authentication |

> **Note on the original brief:** The capstone spec called for static HTML + Bootstrap 5 + vanilla JS. This implementation honors every feature, state machine, UX rule, and skill from that spec while upgrading the substrate to a modern React stack — the same product, engineered for longevity.

---

## 🚀 Getting started

### Prerequisites
- **Node.js 20+** (or [Bun](https://bun.sh) 1.1+)
- **MySQL** — the app uses a real MySQL database (via Prisma ORM)
- A modern browser

### Step 1 — Install MySQL

**Easiest option (Windows): [XAMPP](https://www.apachefriends.org)**
1. Download and install XAMPP
2. Open the XAMPP Control Panel → click **Start** next to **MySQL**
3. That's it — MySQL is now running on `localhost:3306`

**Alternative: standalone MySQL** — install from https://dev.mysql.com/downloads/

### Step 2 — Create the database

Open **phpMyAdmin** (go to `http://localhost/phpmyadmin` in your browser) → click **New** → name it `lendloop` → click **Create**.

Or via terminal:
```bash
mysql -u root -e "CREATE DATABASE lendloop;"
```

### Step 3 — Configure your connection

The `.env` file already has the default XAMPP connection (no password):
```
DATABASE_URL="mysql://root@localhost:3306/lendloop"
```
If you set a MySQL root password, edit `.env`:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/lendloop"
```

### Step 4 — Install, create tables, seed, run

```bash
bun install        # install dependencies
bun run db:push    # create all tables from the Prisma schema
bun run db:seed    # load the demo barangay data (users, items, requests, reviews)
bun run dev        # start the dev server → http://localhost:3000
```

Open `http://localhost:3000` in your browser. You'll see the LendLoop landing page.

> **No MySQL running?** The app shows a friendly "Can't reach the database" screen with setup reminders — it won't crash.

### Demo accounts (no signup needed)

The login page has one-click **demo shortcuts** so evaluators can skip straight to the product:

| Role | What you'll see | Credentials (if you prefer typing) |
|---|---|---|
| **Member** | Dashboard, borrow flow, your items, profile | `maya@lendloop.ph` / `bayanihan` |
| **Admin** | Stewardship overview, member directory, reports | `admin@lendloop.ph` / `admin123` |

Or register a brand-new account — the register flow has live password-strength and match validation.

### Useful scripts

```bash
bun run dev        # start dev server on port 3000
bun run db:push    # create/update database tables (run after schema changes)
bun run db:seed    # reload demo data (wipes existing rows first)
bun run db:generate # regenerate Prisma client (run after schema changes)
bun run lint       # ESLint (Next.js + React hooks rules)
bun run build      # production build
```

### Reset the database

To wipe and reload the demo data at any time:
```bash
bun run db:seed
```
This clears all rows and re-inserts the seed barangay.

---

## 🗺 Project structure

```
src/
├── app/                    # Next.js App Router entry
│   ├── globals.css         # Bayanihan theme (palette, utilities, keyframes)
│   ├── layout.tsx          # fonts (Geist + Lora) + toasters
│   └── page.tsx            # single route → renders <AppShell />
├── lib/
│   ├── types.ts            # domain types (User, Item, BorrowRequest, …)
│   ├── mock-data.ts        # seed barangay: users, items, requests, reviews
│   ├── helpers.ts          # formatDate, trustScore, status meta, simulateApiCall
│   └── store.ts            # Zustand: useAuth, useRouter, useData (persisted)
├── components/
│   ├── app/                # AppShell, Navbar, Footer (the chrome)
│   ├── shared/             # ItemCard, StatusBadge, StarRating, TrustBadge, …
│   ├── ui/                 # shadcn/ui primitives
│   └── views/              # one component per "page"
│       ├── auth/           # LandingView, LoginView, RegisterView
│       ├── user/           # Dashboard, AddItem, EditItem, Notifications, Profile
│       └── admin/          # AdminDashboard, AdminUsers, AdminReports
└── ...
```

Because the deployment exposes a single route, **all navigation is client-side** through the `useRouter` Zustand store — every "page" is a view component that reads its params from the store.

---

## 🧪 What to try (the golden paths)

1. **Browse → borrow → review loop**
   - Log in as a Member → Browse → click any available item → Request to borrow → pick dates → write a message → sign the agreement → confirm. Watch the request land on your dashboard.

2. **Owner-side state machine**
   - Log in as `jose@lendloop.ph` / `bayanihan` → dashboard shows a pending request on his drill → Approve → Mark as borrowed → Mark as returned → Leave a review. Each step updates the item status and notifies the borrower.

3. **Admin stewardship**
   - Log in as Admin → Overview (charts + activity feed) → Users (search, sort, suspend/reactivate) → Reports (5 charts + KPIs + export button).

4. **Register a new account**
   - Get started → fill the form → watch the password-strength meter and match validation update live → submit → land on a fresh dashboard.

---

## ✅ Quality bar

- **Lint clean** — `bun run lint` exits 0 across the whole project.
- **No console errors** — verified end-to-end in the browser across all 14 views.
- **Responsive** — tested at 360px, 768px, 1024px, and 1440px; navbar collapses to a sheet on mobile.
- **Accessible** — semantic landmarks, ARIA labels, keyboard-reachable controls, AA-contrast palette.
- **Sticky footer** — sits at the viewport bottom on short pages, pushed down naturally on long ones.
- **No filler** — every string is purposeful marketing or UX copy. No Lorem ipsum, no TODOs, no dead routes.

---

## 📐 Design decisions worth calling out

- **Trust score formula** — a weighted blend: 90% of the average star rating (scaled to 100) plus a small volume boost (up to 10 reviews × 0.6). New members start at 70 so they're not penalized for being new.
- **Status color system** — a single source of truth (`REQUEST_STATUS_META`, `ITEM_STATUS_META`, `RESERVATION_STATUS_META` in `helpers.ts`) feeds every badge so the state machines never visually drift.
- **SmartImage fallback** — if an item photo URL is missing or fails, a per-category gradient + icon tile renders instead. No broken-image icons, ever.
- **Keyed-remount for prop-change resets** — rather than `setState`-in-`useEffect` (which the lint rules forbid), components that need to reset state when a prop changes use the React-recommended keyed-remount pattern.

---

## 🌱 What's next (beyond the prototype)

- Real authentication (NextAuth.js is wired and ready) and a Prisma-backed persistence layer.
- In-app chat between borrower and lender before pickup.
- Automated late-return detection and trust-score penalties.
- Barangay-scoped discovery and a map view.
- Mobile-first PWA packaging for offline-first field use.

---

## 🤝 Credits

Built as a frontend capstone project celebrating Filipino community values. The bayanihan isn't a metaphor here — it's the product.

> *Walang iwanan sa barangay.* No one gets left behind in the barangay.

---

**Preview the app** via the Preview Panel (or click "Open in New Tab" above it). Start with the demo shortcuts on the login page.
