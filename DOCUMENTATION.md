# 📖 LendLoop — Project Documentation

### A Digital Bayanihan Resource Sharing and Reservation System

---

**Project Name:** LendLoop
**Tagline:** *Borrow what you need. Lend what you don't. Together, kapitbahay.*
**Project Type:** Full-Stack Web Application (Capstone Project)
**Technology Stack:** Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, MySQL, Zustand
**Theme:** Bayanihan — reviving the Filipino spirit of communal unity through digital resource sharing

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Introduction](#2-introduction)
3. [Objectives](#3-objectives)
4. [Scope and Limitations](#4-scope-and-limitations)
5. [Significance of the Project](#5-significance-of-the-project)
6. [Technology Stack](#6-technology-stack)
7. [System Architecture](#7-system-architecture)
8. [Database Design](#8-database-design)
9. [Features and Functional Requirements](#9-features-and-functional-requirements)
10. [User Flows and Use Cases](#10-user-flows-and-use-cases)
11. [API Documentation](#11-api-documentation)
12. [UI/UX Design Principles](#12-uiux-design-principles)
13. [Security Implementation](#13-security-implementation)
14. [Installation and Setup Guide](#14-installation-and-setup-guide)
15. [Testing and Quality Assurance](#15-testing-and-quality-assurance)
16. [Future Enhancements](#16-future-enhancements)
17. [Conclusion](#17-conclusion)

---

## 1. Executive Summary

LendLoop is a community-driven web platform that enables neighbors within a barangay to lend and borrow tools, equipment, and household items from one another. Inspired by the Filipino cultural value of **bayanihan** — the spirit of communal unity and cooperation — LendLoop transforms the traditional neighborhood practice of borrowing into a structured, trust-based digital experience.

The system connects item owners with borrowers through a guided borrow flow, complete with digital agreements, trust scores derived from real reviews, and a transparent request lifecycle. An administrative stewardship console allows barangay administrators to oversee community health, manage members, and review analytics.

**Key metrics:**
- **14 fully-functional views** (landing, auth, browse, item detail, borrow flow, member dashboard, admin console, reports)
- **16 RESTful API endpoints** with cookie-based authentication
- **5 MySQL database tables** modeled via Prisma ORM with 7 enums
- **48 shadcn/ui components** customized with a warm Bayanihan theme
- **Zero lint errors**, responsive across mobile (360px) to desktop (1440px+)

---

## 2. Introduction

### 2.1 Background

In Filipino culture, **bayanihan** traditionally refers to neighbors carrying a house together to a new location — a powerful symbol of community cooperation. Today, that spirit lives on in smaller acts: lending a neighbor a drill, a tent for a weekend trip, or a kaldero for a fiesta. However, modern life has eroded these community ties. People buy items they'll use once, then let them gather dust. Strangers living on the same street hesitate to ask each other for help.

### 2.2 The Problem

| Problem | Impact |
|---|---|
| Tools and equipment are purchased for one-time use | Wasteful spending, cluttered homes |
| Community members don't know what neighbors own | Borrowing never happens |
| Stranger-to-stranger lending feels risky | No trust framework exists |
| Community ties are weakening | The bayanihan spirit fades |
| No centralized platform for barangay-level sharing | Resources are underutilized |

### 2.3 The Solution

LendLoop rebuilds the bayanihan spirit for the digital age by providing:
- A **trusted marketplace** where verified neighbors share resources
- A **guided borrow flow** with digital agreements and signatures
- A **trust score system** that rewards good behavior through community reviews
- An **administrative console** for barangay stewardship and community health monitoring

---

## 3. Objectives

### 3.1 General Objective

To develop a web-based resource sharing and reservation system that revives the Filipino spirit of bayanihan by enabling trusted, community-driven lending among neighbors within a barangay.

### 3.2 Specific Objectives

1. **To create a member registration and authentication system** with secure password hashing (scrypt) and httpOnly cookie-based sessions.
2. **To design an item catalog** where members can list lendable items with photos, deposits, and availability calendars.
3. **To implement a guided borrow flow** with date selection, message composition, and a digital agreement with signature verification.
4. **To build a borrow request state machine** (pending → approved → borrowed → returned → reviewed) with automatic notifications at each transition.
5. **To develop a trust score system** computed from real community reviews, encouraging responsible lending and borrowing behavior.
6. **To create an administrative stewardship console** with community analytics, member management, and reporting dashboards.
7. **To design a warm, culturally-rooted user interface** reflecting Filipino bayanihan values, accessible across devices and compliant with WCAG AA standards.

---

## 4. Scope and Limitations

### 4.1 In Scope

- **User roles:** Member (borrower/lender) and Admin (barangay steward)
- **Item management:** Create, read, update, delete items with multi-image galleries
- **Borrow lifecycle:** Full state machine from request to return to review
- **Trust system:** Star ratings + computed trust scores with tiered badges
- **Notifications:** In-app notification center with read/unread states
- **Admin tools:** Member directory, suspend/activate, analytics dashboards with charts
- **Authentication:** Cookie-based sessions with password hashing
- **Database:** MySQL via Prisma ORM with seed data

### 4.2 Out of Scope / Limitations

- **No real-time messaging** between borrower and lender (notifications only)
- **No payment processing** — deposits are tracked but not actually charged
- **No file storage service** — item images use external URLs (picsum.photos for demo)
- **No email/SMS notifications** — alerts are in-app only
- **Single-barangay scope** — no multi-barangay or city-wide scaling
- **No mobile app** — responsive web only (PWA-ready but not packaged)
- **No production authentication provider** — uses a simple cookie session (NextAuth available but not wired)

---

## 5. Significance of the Project

### 5.1 To the Community
LendLoop strengthens barangay-level social fabric by making every shared drill, tent, or kaldero a small act of bayanihan. Neighbors who might only wave at each other gain a structured reason to interact, build trust, and help one another.

### 5.2 To the Environment
By enabling reuse over repurchase, LendLoop reduces consumption and waste. A single power drill shared among 20 households prevents 19 unnecessary purchases.

### 5.3 To the Economy
Members save money on items they need only temporarily. Low-income households gain access to equipment (tools, party supplies, kitchen appliances) they couldn't afford to buy.

### 5.4 To Capstone Education
The project demonstrates a modern full-stack architecture: Next.js App Router, TypeScript end-to-end, Prisma ORM with MySQL, state management with Zustand, accessible UI with shadcn/ui, and data visualization with Recharts — a production-ready foundation for real-world web development.

---

## 6. Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.1 | React 19 framework with file-based routing, API routes, SSR |
| **Language** | TypeScript | 5.x | End-to-end type safety |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS framework |
| **UI Components** | shadcn/ui (New York) | — | Accessible, composable component library (48 components) |
| **Icons** | Lucide React | 0.525 | Tree-shakeable SVG icons |
| **State Management** | Zustand | 5.x | Lightweight client-side stores (auth, router, data) |
| **Database** | MySQL | 8.x | Relational database (via XAMPP) |
| **ORM** | Prisma | 6.19 | Type-safe database client + schema migration |
| **Charts** | Recharts | 2.15 | Admin analytics dashboards |
| **Animation** | Framer Motion | 12.x | Micro-interactions and page transitions |
| **Forms** | React Hook Form + Zod | 7.x / 4.x | Form validation |
| **Toasts** | Sonner | 2.x | User feedback notifications |
| **Fonts** | Geist + Lora | — | Body sans + display serif (community-gazette feel) |
| **Runtime** | Bun | 1.x | Package manager + script runner |
| **Linter** | ESLint | 9.x | Code quality (Next.js + React hooks rules) |

### 6.1 Why This Stack?

- **Next.js 16** provides both frontend rendering and backend API routes in one framework — no separate Express server needed.
- **TypeScript** catches errors at compile time, making the codebase maintainable and self-documenting.
- **Prisma + MySQL** gives type-safe database access without writing raw SQL, with migrations and a visual schema editor.
- **Zustand** is simpler than Redux but more structured than Context — perfect for a medium-complexity SPA.
- **shadcn/ui** produces accessible, customizable components that aren't a black box (you own the source code).

---

## 7. System Architecture

### 7.1 High-Level Architecture

LendLoop follows a **5-layer architecture**, each layer communicating only with the one directly below it:

```
┌─────────────────────────────────────────────────────────┐
│  LAYER 1: PRESENTATION (React Views)                     │
│  14 view components rendering data from the stores        │
│  Captures user clicks → calls actions                     │
└────────────────────────┬────────────────────────────────┘
                         │  actions.*() calls
                         ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 2: STATE MANAGEMENT (Zustand Stores)              │
│  • useAuth   — current user, login/logout/hydrate         │
│  • useRouter — client-side view navigation                │
│  • useData   — client cache of all DB data                │
│  • actions   — async helpers that call the API + update   │
└────────────────────────┬────────────────────────────────┘
                         │  fetch("/api/...")
                         ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 3: API LAYER (Next.js Route Handlers)             │
│  16 RESTful endpoints under /api/*                        │
│  • Authentication checks (getCurrentUser)                 │
│  • Input validation                                        │
│  • Calls Prisma, returns JSON                              │
└────────────────────────┬────────────────────────────────┘
                         │  db.user.findMany() etc.
                         ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 4: DATA ACCESS (Prisma ORM)                       │
│  • Reads prisma/schema.prisma (blueprint)                 │
│  • Generates typed query methods                          │
│  • Translates JS calls → SQL                              │
└────────────────────────┬────────────────────────────────┘
                         │  SQL queries
                         ▼
┌─────────────────────────────────────────────────────────┐
│  LAYER 5: PERSISTENCE (MySQL Database)                   │
│  5 tables: User, Item, BorrowRequest, Review, Notification│
│  Stored on disk, accessed via port 3306                   │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Request Lifecycle Example

When a user clicks "Request to borrow":

1. **View** calls `actions.createRequest(payload)`
2. **Store** calls `apiPost("/api/requests", payload)`
3. **API client** sends `POST /api/requests` with the cookie
4. **API route** reads the cookie → identifies the user → validates the item → checks date conflicts
5. **Prisma** translates `db.borrowRequest.create()` into `INSERT INTO BorrowRequest ...`
6. **MySQL** executes the SQL, stores the row, returns the new row
7. **API route** also creates a Notification for the owner, returns the request as JSON
8. **Store** updates the local cache, React re-renders, toast appears

### 7.3 Folder Structure

```
LendLoop/
├── prisma/
│   ├── schema.prisma          # Database blueprint (5 models, 7 enums)
│   └── seed.ts                # Demo data loader script
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root HTML (fonts, toasters, AppHydrator)
│   │   ├── page.tsx           # Single route → renders <AppShell/>
│   │   ├── globals.css        # Bayanihan theme (colors, animations)
│   │   └── api/               # 16 API route handlers
│   │       ├── auth/{login,register,logout,me,demo}/route.ts
│   │       ├── hydrate/route.ts
│   │       ├── items/route.ts + [id]/route.ts
│   │       ├── requests/route.ts + [id]/route.ts
│   │       ├── reviews/route.ts
│   │       ├── notifications/route.ts + [id]/route.ts
│   │       └── users/route.ts + [id]/route.ts
│   ├── lib/                   # Shared logic (10 files)
│   │   ├── db.ts              # Prisma client (MySQL connection)
│   │   ├── password.ts        # scrypt password hashing
│   │   ├── session.ts         # Cookie-based auth helpers
│   │   ├── serialize.ts       # Prisma rows → JSON converter
│   │   ├── api-client.ts      # Browser fetch wrapper
│   │   ├── store.ts           # Zustand stores + actions
│   │   ├── types.ts           # TypeScript domain types
│   │   ├── helpers.ts         # Utilities (formatDate, trustScore, etc.)
│   │   ├── mock-data.ts       # Seed data (barangay of 9 users, 12 items)
│   │   └── utils.ts           # cn() className merger
│   ├── components/
│   │   ├── app/               # App chrome (AppShell, Navbar, Footer, AppHydrator)
│   │   ├── shared/            # 9 reusable UI pieces (ItemCard, StarRating, etc.)
│   │   ├── ui/                # 48 shadcn/ui primitives
│   │   └── views/             # 14 view components
│   │       ├── (root)         # Landing, Browse, ViewItem, BorrowFlow
│   │       ├── auth/          # Login, Register
│   │       ├── user/          # Dashboard, AddItem, EditItem, Notifications, Profile
│   │       └── admin/         # AdminDashboard, AdminUsers, AdminReports
│   └── hooks/                 # use-mobile, use-toast
├── public/                    # logo.svg, robots.txt
├── .env                       # DATABASE_URL (MySQL connection)
├── .env.example               # Template
├── package.json               # Dependencies + scripts
├── tsconfig.json              # TypeScript config
├── tailwind.config.ts         # Tailwind theme
└── README.md                  # Getting started guide
```

---

## 8. Database Design

### 8.1 Entity-Relationship Overview

LendLoop's database contains **5 tables** with the following relationships:

```
┌──────────┐    owns     ┌──────────┐
│   User   │────────────>│   Item   │
│          │  1     M    │          │
│          │             │          │
│          │<────────────│          │
│          │  borrower   └────┬─────┘
│          │  owner           │ has
│          │                  │ many
│          │             ┌────▼─────────┐
│          │  borrower   │ BorrowRequest│
│          │<────────────│              │
│          │  owner      │              │
│          │<────────────└──────┬───────┘
│          │                   │ has
│          │  author           │ many
│          │<──────────────────┤
│          │  subject          │
│          │<────────────┐     │
│          │             │     │
│          │             ▼     │
│          │         ┌─────────┐
│          │         │  Review │
│          │         └─────────┘
│          │
│          │  receives  ┌──────────────┐
│          │───────────>│ Notification │
└──────────┘   1    M   └──────────────┘
```

### 8.2 Table Definitions

#### 8.2.1 User Table

Stores all members and administrators.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK, auto-generated | Unique identifier |
| name | String | NOT NULL | Full name |
| email | String | UNIQUE, NOT NULL | Login email |
| password | String | NOT NULL | scrypt-hashed password (format: `salt:hash`) |
| avatar | String | NOT NULL | Profile image URL |
| barangay | String | NOT NULL | Community/neighborhood |
| city | String | NOT NULL | City |
| role | Enum (user, admin) | DEFAULT 'user' | Access level |
| status | Enum (active, suspended) | DEFAULT 'active' | Account status |
| verified | Boolean | DEFAULT false | Verified badge |
| joinedAt | DateTime | DEFAULT now() | Registration timestamp |
| bio | Text | NULLABLE | Optional biography |
| phone | String | NULLABLE | Optional phone number |

**Indexes:** `role`, `status` (for fast admin queries)

**Relations:**
- One-to-many with Item (a user owns many items)
- One-to-many with BorrowRequest (as borrower AND as owner — two named relations)
- One-to-many with Review (as author AND as subject — two named relations)
- One-to-many with Notification (a user receives many notifications)

#### 8.2.2 Item Table

Stores all lendable items.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| title | String | NOT NULL | Item name |
| description | Text | NOT NULL | Detailed description |
| category | Enum (8 categories) | NOT NULL | Tools, Outdoor, Electronics, Kitchen, Party, Sports, Books, Vehicles |
| condition | Enum (3 levels) | NOT NULL | LikeNew, Good, Fair |
| images | JSON | NOT NULL | Array of image URLs |
| primaryImageIndex | Int | DEFAULT 0 | Which image is the cover |
| maxBorrowDays | Int | NOT NULL | Maximum borrow duration |
| deposit | Int | NOT NULL | Refundable deposit in PHP |
| bookedDates | JSON | NOT NULL | Array of "yyyy-mm-dd" strings already booked |
| status | Enum (available, reserved, borrowed) | DEFAULT 'available' | Current availability |
| location | String | NOT NULL | Pickup location |
| createdAt | DateTime | DEFAULT now() | When listed |
| views | Int | DEFAULT 0 | View counter |
| ownerId | String | FK → User.id, ON DELETE CASCADE | The lender |

**Indexes:** `category`, `status`, `ownerId` (for filtering/sorting)

#### 8.2.3 BorrowRequest Table

Stores every borrow transaction and its lifecycle state.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| itemId | String | FK → Item.id, CASCADE | What's being borrowed |
| borrowerId | String | FK → User.id, CASCADE | Who's borrowing |
| ownerId | String | FK → User.id, CASCADE | Who owns the item |
| startDate | Date | NOT NULL | Borrow start |
| endDate | Date | NOT NULL | Borrow end |
| message | Text | NOT NULL | Borrower's message to owner |
| status | Enum (6 states) | DEFAULT 'pending' | Lifecycle state |
| agreementSigned | Boolean | DEFAULT false | Digital agreement accepted? |
| signatureName | String | DEFAULT "" | Typed signature (must match borrower name) |
| createdAt | DateTime | DEFAULT now() | When requested |
| borrowedAt | DateTime | NULLABLE | When physically handed over |
| returnedAt | DateTime | NULLABLE | When returned |

**Indexes:** `status`, `borrowerId`, `ownerId`, `itemId` (for dashboard queries)

#### 8.2.4 Review Table

Stores ratings and comments between users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| fromUserId | String | FK → User.id, CASCADE | Who wrote the review |
| toUserId | String | FK → User.id, CASCADE | Who's being reviewed |
| itemId | String | FK → Item.id, CASCADE | Which item (context) |
| requestId | String | FK → BorrowRequest.id, SET NULL | Optional linked request |
| rating | Int | NOT NULL (1-5) | Star rating |
| comment | Text | NOT NULL | Review text |
| createdAt | DateTime | DEFAULT now() | When written |

**Indexes:** `toUserId` (for trust score calculation), `itemId`, `fromUserId`

#### 8.2.5 Notification Table

Stores in-app alerts for each user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | String (CUID) | PK | Unique identifier |
| userId | String | FK → User.id, CASCADE | Recipient |
| type | Enum (8 types) | NOT NULL | request_received, request_approved, request_rejected, borrow_started, return_reminder, item_returned, review_received, system |
| title | String | NOT NULL | Alert headline |
| message | Text | NOT NULL | Alert body |
| read | Boolean | DEFAULT false | Read status |
| createdAt | DateTime | DEFAULT now() | When created |
| link | JSON | NULLABLE | Optional navigation target `{view, params}` |

**Indexes:** `userId, read` (composite index for "unread notifications for user X")

### 8.3 Enums

| Enum | Values | Used By |
|---|---|---|
| Role | user, admin | User.role |
| UserStatus | active, suspended | User.status |
| ItemCategory | Tools, Outdoor, Electronics, Kitchen, Party, Sports, Books, Vehicles | Item.category |
| ItemCondition | LikeNew, Good, Fair | Item.condition |
| ItemStatus | available, reserved, borrowed | Item.status |
| RequestStatus | pending, approved, borrowed, returned, rejected, cancelled | BorrowRequest.status |
| NotificationType | request_received, request_approved, request_rejected, borrow_started, return_reminder, item_returned, review_received, system | Notification.type |

### 8.4 Trust Score Formula

The trust score (0–100) is computed from a user's received reviews:

```
trustScore = (averageRating / 5) * 100 * 0.9 + min(reviewCount, 10) * 0.6
```

- **90% weight** on the average star rating (scaled to 100)
- **Volume boost**: up to 10 reviews × 0.6 points (rewards active participation)
- New members with no reviews start at **70** (not penalized for being new)

**Trust tiers:**
- 85–100: "Highly Trusted" (emerald)
- 70–84: "Trusted" (emerald)
- 55–69: "Building Trust" (amber)
- 0–54: "New Member" (amber)

---

## 9. Features and Functional Requirements

### 9.1 Public Features (No Login Required)

| Feature | Description |
|---|---|
| Landing page | Marketing hero, featured items, how-it-works, trust pillars, CTA |
| Browse items | Search, filter by category/condition, sort by newest/popular/deposit, paginated grid |
| View item detail | Image gallery, availability calendar, owner trust card, reviews, related items |
| Register | Real-time password strength meter, match validation, show/hide toggle |
| Login | Email/password, remember me, demo shortcuts, flash error messages |

### 9.2 Member Features (Authenticated)

| Feature | Description |
|---|---|
| Dashboard | Stats cards (items lending, active borrows, trust score), request queues, my items |
| Borrow flow | 3-step wizard: dates+message → agreement+signature → success confirmation |
| Add item | Multi-image upload with cover selection, category, condition, deposit, max days slider |
| Edit item | Update any field, delete with confirmation |
| Notifications | Bell dropdown + full page, mark as read, mark all read, unread badge count |
| Profile | Edit info, trust score breakdown, reviews received, account summary |
| Reviews | 5-star interactive rating (textarea unlocks after star selected) |

### 9.3 Admin Features

| Feature | Description |
|---|---|
| Admin dashboard | Stewardship stats, weekly borrows area chart, category donut, activity feed |
| Member directory | Searchable, sortable table with suspend/activate switches, trust badges, pagination |
| Community reports | 5 Recharts visualizations (top lenders, most-borrowed, trends, categories, returns vs overdue), KPI cards, export button |

### 9.4 Borrow Request State Machine

The core workflow is a **6-state machine** with guarded transitions:

```
                    ┌──────────────────────────────────────────┐
                    │                                          │
  (created) ──►  pending ──Approve──► approved ──Mark Borrowed──► borrowed
                  │    │                     │                       │
                  │    │                  (item:                    (item:
                  │    │                   reserved)               borrowed)
                  │    │                     │                       │
                  │    └──Reject──► rejected  │                  Mark Returned
                  │    (terminal)             │                       │
                  │                           │                  (item:
                  └──Cancel──► cancelled      │                   available)
                      (terminal)              │                       │
                                              │                       ▼
                                              │                   returned
                                              │                       │
                                              │                  Leave Review
                                              │                       │
                                              ▼                       ▼
                                          (notify              (notify borrower)
                                           borrower)                 │
                                                                    ▼
                                                                 reviewed
                                                                 (terminal)
```

**Transition guards:**
- `pending → approved/rejected`: Only the **owner** can transition
- `approved → borrowed`: Only the **owner**; sets `borrowedAt`, marks item as `borrowed`, adds booked dates
- `borrowed → returned`: Only the **owner**; sets `returnedAt`, marks item as `available`, removes booked dates
- `* → cancelled`: Only the **borrower**

**Side effects per transition:**
- A **Notification** is created for the other party
- The **Item status** is synced (reserved/borrowed/available)
- **Booked dates** are added/removed from the item

---

## 10. User Flows and Use Cases

### 10.1 Use Case: New Member Registration

**Actor:** Visitor
**Precondition:** None
**Main Flow:**
1. Visitor clicks "Get started" on the landing page
2. Fills in name, email, password, barangay, city
3. Password strength meter updates in real-time
4. Confirm password field validates match
5. On submit: password is hashed (scrypt), user row inserted, session cookie set
6. Redirected to member dashboard

**Alternative Flows:**
- Email already exists → error toast, form stays
- Password too weak → submit disabled until strength ≥ "Fair"

### 10.2 Use Case: Borrow an Item

**Actor:** Member (borrower)
**Precondition:** Logged in, item is available, member is not the owner
**Main Flow:**
1. Member browses items, clicks an available item
2. Views item detail (gallery, calendar, owner trust card)
3. Clicks "Request to borrow"
4. **Step 1:** Selects start/end dates (calendar disables past + booked dates), writes message (max 500 chars), sees live summary
5. Clicks "Continue to agreement"
6. **Step 2:** Reads borrower's pledge, checks "I agree", types signature (must match their name)
7. Clicks "Confirm & send request"
8. **Step 3:** Success screen with summary, toast confirmation
9. Owner receives a notification

**Postcondition:** BorrowRequest row created with status `pending`, item marked `reserved`

### 10.3 Use Case: Owner Approves and Completes a Borrow

**Actor:** Member (owner)
**Precondition:** Owner has a pending borrow request on their item
**Main Flow:**
1. Owner logs in, sees pending request on dashboard
2. Clicks "Approve" → request becomes `approved`, item becomes `reserved`, borrower notified
3. Meets borrower, hands over item, clicks "Mark as borrowed" → request becomes `borrowed`, item becomes `borrowed`, booked dates added, borrower notified
4. Borrower returns item, owner clicks "Mark as returned" → request becomes `returned`, item becomes `available`, booked dates removed, borrower notified
5. Owner clicks "Leave review" → opens review dialog
6. Selects 5 stars (textarea unlocks), writes comment, submits
7. Review stored, borrower's trust score recalculated, borrower notified

### 10.4 Use Case: Admin Suspends a Problematic Member

**Actor:** Admin
**Precondition:** Admin is logged in
**Main Flow:**
1. Admin navigates to "Users" page
2. Searches for the member by name/email
3. Toggles the "Suspend" switch → member's status becomes `suspended`
4. Suspended member can no longer log in (login route returns 403)

---

## 11. API Documentation

### 11.1 Authentication Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account, set cookie |
| POST | `/api/auth/login` | None | Verify password, set cookie |
| POST | `/api/auth/logout` | Session | Clear cookie |
| GET | `/api/auth/me` | None | Return current user or null |
| POST | `/api/auth/demo` | None | One-click demo login (evaluator shortcut) |

### 11.2 Data Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/hydrate` | Optional | Fetch all data in one call (users, items, requests, reviews, notifications + current user) |
| GET | `/api/items` | None | List items (filter by category, condition, q; sort by newest/popular/deposit) |
| POST | `/api/items` | Member | Create a new item |
| GET | `/api/items/:id` | None | Get single item (+ increment views) |
| PATCH | `/api/items/:id` | Owner | Update an item |
| DELETE | `/api/items/:id` | Owner | Delete an item |
| GET | `/api/requests` | Member | List requests (scope: mine/owned/all) |
| POST | `/api/requests` | Member | Create a borrow request (notifies owner) |
| PATCH | `/api/requests/:id` | Owner/Borrower | Advance state machine |
| GET | `/api/reviews` | None | List reviews (filter by itemId/toUserId/fromUserId) |
| POST | `/api/reviews` | Member | Submit a review (notifies reviewed party) |
| GET | `/api/notifications` | Member | List current user's notifications |
| PATCH | `/api/notifications` | Member | Mark all as read |
| PATCH | `/api/notifications/:id` | Member | Mark one as read |
| GET | `/api/users` | Admin | List all members (with filters) |
| PATCH | `/api/users/:id` | Self/Admin | Update profile / suspend / activate |

### 11.3 Response Format

All responses are JSON. Success responses return `{ data }` or `{ entity: data }`. Error responses return `{ error: "message" }` with an appropriate HTTP status code.

**Status codes used:**
- `200` — OK
- `201` — Created
- `204` — No content (DELETE)
- `400` — Bad request (missing/invalid fields)
- `401` — Unauthorized (not logged in)
- `403` — Forbidden (wrong role, not your resource)
- `404` — Not found
- `409` — Conflict (duplicate email, date conflict)
- `500` — Server error

---

## 12. UI/UX Design Principles

### 12.1 Design Philosophy

LendLoop's interface is built on **five design skills** applied consistently:

1. **Marketing Skill** — Every page has a clear value proposition. Copy is benefit-driven ("Lend to neighbors" not "Submit item form"). Empty states encourage action.

2. **Stop Slop Skill** — No Lorem ipsum, no TODOs, no boilerplate. Every string is purposeful marketing or UX copy with light Filipino warmth ("kapitbahay", "bayanihan", "salamat").

3. **UI/UX Skill** — Mobile-first responsive design, inline validation, Bootstrap-style toasts (via Sonner), skeleton screens for loading, trust signals visible (verified badges, trust scores, review counts).

4. **Remotion Skill** — Meaningful motion: 200–300ms transitions, staggered card entrances (50ms apart), toast slide-in, modal scale-in. No animation exceeds 500ms.

5. **Context Engineering Skill** — Consistent naming (camelCase JS, kebab-case CSS), reusable shared components, a single source of truth for status colors (`REQUEST_STATUS_META`).

### 12.2 Color System — The Bayanihan Theme

The palette is **warm and Filipino-inspired** (terracotta, sunset, amber, cream):

| Token | Color | Usage |
|---|---|---|
| `--primary` | Terracotta `oklch(0.58 0.17 38)` | Brand color, primary buttons |
| `--background` | Warm cream `oklch(0.985 0.012 70)` | Page background |
| `--accent` | Amber/gold `oklch(0.93 0.05 75)` | Highlights, hover states |
| `--chart-1` | Terracotta | Charts |
| `--chart-2` | Amber | Charts |
| `--chart-3` | Teal | Charts |
| `--chart-4` | Emerald | Charts |
| `--chart-5` | Sunset red | Charts |

**Status colors** (semantic, WCAG AA compliant):
- 🟢 Emerald — available, returned, fulfilled
- 🟡 Amber — pending, reserved
- 🔵 Teal — approved, active
- 🟠 Orange — borrowed
- 🔴 Rose — rejected, cancelled, overdue, suspended

### 12.3 Typography

- **Body:** Geist Sans (modern, readable)
- **Headings:** Lora (serif, "community-gazette" warmth)
- **Mono:** Geist Mono (code blocks)

### 12.4 Accessibility

- Semantic HTML (`<main>`, `<header>`, `<nav>`, `<section>`, `<article>`)
- ARIA labels on all interactive elements
- Keyboard navigation (tab order, focus rings, Enter/Space on cards)
- WCAG AA color contrast (warm palette meets standards)
- Screen reader text (`sr-only` class)
- Alt text on all images

### 12.5 Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | 360px+ | Single column, hamburger nav, stacked cards |
| Tablet | 768px+ | Two-column grids, collapsible nav |
| Desktop | 1024px+ | Three-column grids, full nav |
| Wide | 1440px+ | Four-column browse grid, max-width container |

### 12.6 Sticky Footer

The layout uses `min-h-screen flex flex-col` on the root wrapper with `mt-auto` on the footer. This ensures the footer sticks to the viewport bottom on short pages and is pushed down naturally on long pages — no overlap, no floating gap.

---

## 13. Security Implementation

### 13.1 Password Security

Passwords are hashed using **Node.js `crypto.scrypt`** (no external dependencies):

- **Hashing:** `scryptSync(password, salt, 64)` with a random 16-byte salt
- **Storage format:** `salt:hash` (both hex-encoded), stored in `User.password`
- **Verification:** `timingSafeEqual` prevents timing attacks
- **Never** stored as plaintext; **never** sent to the client (serializer strips it)

### 13.2 Session Management

- **Cookie-based:** httpOnly cookie named `ll_session` stores the user ID
- **httpOnly:** JavaScript cannot read the cookie (prevents XSS theft)
- **sameSite: lax:** Protects against CSRF
- **secure:** Only sent over HTTPS in production
- **maxAge:** 30 days
- **Server-side validation:** Every API route calls `getCurrentUser()` which reads the cookie and looks up the user in MySQL

### 13.3 Authorization Guards

| Route type | Guard |
|---|---|
| Public (browse, view item) | None |
| Member actions (create item, request) | `getCurrentUser()` must return a user |
| Owner actions (edit/delete item, approve request) | `currentUserId === item.ownerId` |
| Admin actions (list users, suspend) | `currentUser.role === "admin"` |

### 13.4 Input Validation

- All API routes validate required fields before writing to the database
- Email format validated client-side (`isEmail` helper)
- Password strength enforced (min 8 chars, meter visible)
- Date conflicts checked before creating a borrow request
- Rating must be 1–5; can't review yourself

---

## 14. Installation and Setup Guide

### 14.1 Prerequisites

- **Node.js 20+** or **Bun 1.1+** (runtime + package manager)
- **MySQL 8+** (via XAMPP recommended on Windows)
- A modern browser

### 14.2 Step-by-Step Setup

#### Step 1: Install XAMPP
1. Download from https://www.apachefriends.org
2. Run the installer (default options)
3. Open the XAMPP Control Panel
4. Click **Start** next to **MySQL**

#### Step 2: Create the Database
- Open **phpMyAdmin** at `http://localhost/phpmyadmin`
- Click **New** → name it `lendloop` → click **Create**

#### Step 3: Configure Connection
The `.env` file contains:
```
DATABASE_URL="mysql://root@localhost:3306/lendloop"
```
If you set a MySQL root password, update to:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/lendloop"
```

#### Step 4: Install Dependencies
```bash
bun install        # or: npm install
```

#### Step 5: Create Database Tables
```bash
bun run db:push
```
This reads `prisma/schema.prisma` and creates all 5 tables in MySQL.

#### Step 6: Load Demo Data
```bash
bun run db:seed
```
This inserts 9 users, 12 items, 6 requests, 6 reviews, and 8 notifications (with hashed passwords).

#### Step 7: Start the Development Server
```bash
bun run dev
```
Open `http://localhost:3000` in your browser.

### 14.3 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Member | maya@lendloop.ph | bayanihan |
| Admin | admin@lendloop.ph | admin123 |

Or use the **demo shortcut buttons** on the login page for one-click access.

### 14.4 Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server on port 3000 |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Create/update database tables |
| `bun run db:seed` | Load demo data (wipes existing) |
| `bun run db:generate` | Regenerate Prisma client (after schema changes) |
| `bun run build` | Production build |

### 14.5 Resetting the Database
To wipe and reload demo data:
```bash
bun run db:seed
```

---

## 15. Testing and Quality Assurance

### 15.1 Linting
- **ESLint** runs with Next.js + React hooks rules
- **Result:** 0 errors, 0 warnings across the entire project
- Run: `bun run lint`

### 15.2 Manual Testing Checklist

| Check | Status |
|---|---|
| All forms have client-side validation | ✅ |
| All interactive elements have hover/focus states | ✅ |
| No console errors in Chrome DevTools | ✅ |
| Authenticated vs unauthenticated UI states are distinct | ✅ |
| Date pickers disable "booked" dates from the database | ✅ |
| File upload previews correctly generate and remove images | ✅ |
| Responsive at 360px, 768px, 1024px, 1440px | ✅ |
| Tab navigation works logically through forms and menus | ✅ |
| Toast notifications confirm simulated success | ✅ |
| Borrow state machine transitions all work (pending → returned) | ✅ |
| Notifications fire on state transitions | ✅ |
| Trust score recalculates after reviews | ✅ |

### 15.3 Browser Verification

The application was verified end-to-end using Agent Browser:
- All 14 views render without errors
- The golden path (browse → borrow → approve → return → review) works
- Admin features (suspend, reports, charts) function correctly
- Mobile responsiveness confirmed at 390px viewport
- Sticky footer behavior confirmed on short and long pages
- No runtime/hydration errors in the console

---

## 16. Future Enhancements

### 16.1 Short Term
- **In-app chat** between borrower and lender before pickup
- **Email/SMS notifications** via a service like Resend or Twilio
- **Image upload to cloud storage** (Cloudinary/S3) instead of external URLs
- **Real payment processing** for deposits via Stripe or PayMongo

### 16.2 Medium Term
- **Multi-barangay scaling** with barangay-scoped discovery and a map view
- **Automated late-return detection** with trust score penalties
- **Item categories management** (admin-configurable)
- **Mobile PWA packaging** for offline-first field use
- **Search by location** with geolocation

### 16.3 Long Term
- **NextAuth.js integration** for OAuth (Google, Facebook) and JWT sessions
- **Real-time notifications** via WebSockets (Socket.io)
- **Bayanihan events** — community-wide sharing drives (e.g., " Fiesta Equipment Drive")
- **Rewards system** — badges for top lenders, most-helpful neighbors
- **Analytics API** for barangay captains to track community health trends

---

## 17. Conclusion

LendLoop demonstrates that modern web technology can revive traditional community values. By combining a warm, culturally-rooted interface with a robust MySQL-backed architecture, the system creates a trustworthy space where neighbors can share resources, build relationships, and practice bayanihan in their daily lives.

The project successfully achieves all its objectives: a secure authentication system, a guided borrow flow with digital agreements, a transparent request lifecycle with automatic notifications, a trust score system that rewards good behavior, and an administrative console for community stewardship. The codebase is clean (0 lint errors), well-documented, responsive, accessible, and ready for capstone evaluation.

More than a technical exercise, LendLoop is a small act of hope — that technology can bring neighbors closer together, that the spirit of bayanihan can thrive in the digital age, and that a shared drill can be the start of a stronger community.

> *Walang iwanan sa barangay.* No one gets left behind in the barangay.

---

**Project by:** LendLoop Capstone Team
**Documentation version:** 1.0
**Last updated:** July 2025
