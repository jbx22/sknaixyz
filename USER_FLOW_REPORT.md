# SKNAI User Flow Report

## Overview

SKNAI is a bilingual (English/Arabic) real estate platform serving **6 user types** across **two role systems** with **three subscription tiers** and **52 pages**. The platform supports global property discovery, AI-powered investment analysis, property tokenization, rental management, and compliance features.

---

## 1. User Types & Role Systems

### Three Role Systems

SKNAI has **three distinct role systems** that work together:

#### The 6 Login Types (what users see at `/login`)

At login, users choose from **6 demo accounts** organized in two groups:

**👤 User Accounts** (4 accounts with `role=user`, differentiated by `userType`):
| Account | Label | `userType` | Purpose |
|---------|-------|------------|---------|
| `demo.investor@sknai.test` | Investor / Buyer 💰 | `investor` | Browse investments, buy tokens, track portfolio |
| `demo.owner@sknai.test` | Property Owner 🏠 | `owner` | List properties, manage rentals, tokenization |
| `demo.broker@sknai.test` | Real Estate Office / Broker 🤝 | `office` | Brokerage, client listings, contracts |
| `demo.developer@sknai.test` | Developer 🏗️ | `developer` | Development projects, compliance, fractional ownership |

**🛡️ Admin Accounts** (2 accounts with elevated roles):
| Account | Label | Role | Purpose |
|---------|-------|------|---------|
| `demo.admin@sknai.test` | Admin 🛡️ | `admin` | Platform moderation, user mgmt, compliance |
| `demo.superadmin@sknai.test` | Super Admin 👑 | `superadmin` | Full platform control |

---

#### A. System-Level Roles (`UserRole` — stored in `users.role` column)

| DB Role | Business Persona | UI Icon | Description |
|---------|-----------------|---------|-------------|
| **`user`** | **Buyer / General User** | 👤 | General platform user — browse, search, generate AI reports, save favorites, chat |
| **`owner`** | **Property Owner / Real Estate Office** | 🏠 | Owns and manages properties — can list properties, manage rentals, request tokenization |
| **`broker`** | **Real Estate Broker / Office** | 🤝 | Licensed real estate brokerage — manages listings, coordinates sales/rentals for clients |
| **`developer`** | **Real Estate Developer** | 🏗️ | Property developer — manages development projects, compliance, tokenization |
| **`admin`** | **Platform Admin** | 🛡️ | Platform administration — user management, compliance, tokenization review |
| **`superadmin`** | **Super Admin** | 👑 | Full platform control — all admin features plus superadmin panel |

> **Current `User.tsx` interface limits `role` to only `"admin" | "user" | "superadmin"`.** The DB schema fully supports all 6 roles (`UserRole = "admin" | "broker" | "developer" | "owner" | "superadmin" | "user"`), but the frontend TypeScript type and ProtectedRoute guards haven't been updated to leverage `broker`, `developer`, and `owner` at the auth-guard level. These roles are currently used contextually via `PropertyMembers` and display names.

#### B. Property-Level Roles (`PropertyMemberRole` — stored in `property_members.role` column)

| Property Role | Description |
|--------------|-------------|
| **`broker`** | Assigned as the brokerage/marketing agent for a property |
| **`developer`** | Assigned as the developer for a property |
| **`investor`** | Holds an investment/share in a property |
| **`owner`** | Registered as the legal owner of a property |
| **`tenant`** | Renting/leasing a property unit |

### Access Guard Mapping

| Guard Component | Allowed Roles | Used For |
|----------------|---------------|----------|
| `UserRoute` | `user`, `admin`, `superadmin` | All authenticated pages (dashboard, add-property, invest, rent) |
| `AdminRoute` | `admin`, `superadmin` | Admin panels |
| `SuperAdminRoute` | `superadmin` | Superadmin-only page |

> **Note:** `broker`, `developer`, and `owner` are NOT currently included in `UserRoute` guards, so users with these DB roles may not have full frontend access until the `User.tsx` interface is updated.

### Subscription Tiers

| Tier | AI Reports | Export/Share | Monthly Report Limit |
|------|-----------|-------------|---------------------|
| **Free** | ✅ Basic (single analysis section) | ❌ No PDF/WhatsApp/Email | Limited (tracks via `aiReportsUsed`) |
| **Basic** | ✅ Full | ✅ PDF + WhatsApp sharing | Higher limit |
| **Premium** | ✅ Full + email delivery | ✅ PDF + WhatsApp + Email | Highest limit |

### Demo Accounts — 6 User Types at Login

The login page presents **exactly 6 user accounts** organized in two sections:

**👤 User Accounts** (role=`user`, 4 business types):

| Email | Business Type | `userType` | Role | Description |
|-------|--------------|------------|------|-------------|
| `demo.investor@sknai.test` | **Investor / Buyer** 💰 | `investor` | `user` | Browse & invest in tokenized properties |
| `demo.owner@sknai.test` | **Property Owner** 🏠 | `owner` | `user` | List & manage owned properties |
| `demo.broker@sknai.test` | **Real Estate Office / Broker** 🤝 | `office` | `user` | Licensed brokerage, manage client listings |
| `demo.developer@sknai.test` | **Developer** 🏗️ | `developer` | `user` | Development projects & tokenization |

**🛡️ Admin Accounts** (role=`admin`/`superadmin`, 2 accounts):

| Email | Business Type | `userType` | Role | Description |
|-------|--------------|------------|------|-------------|
| `demo.admin@sknai.test` | **Admin** 🛡️ | `office` | `admin` | Platform administration |
| `demo.superadmin@sknai.test` | **Super Admin** 👑 | `office` | `superadmin` | Full platform control |

> **Password for all demo accounts:** `demo123`
> **Note:** The `userType` field (`investor` | `owner` | `office` | `developer`) is used for subscription/compliance workflows (
> `SubscriptionUserType` in `subscriptionCompliance.tsx`). It is separate from the auth `role` field. The `role` field determines route access; the `userType` determines business context (document requirements, compliance checks).

---

## 2. Complete Route Map by Role

### Public Pages (No Login Required)

| Route | Page | Key Features |
|-------|------|-------------|
| `/` | Home | Hero, featured properties, token investment CTA, how-it-works, featured locations |
| `/properties` | **Property Search** | Search by city/district/location/zip, filter by type/price/bedrooms, paginated grid |
| `/map` | Map View | Interactive map for geographic property discovery |
| `/login` | Login/Signup | OAuth (Google/Apple), password login, password register, demo account access |
| `/about` | About | Platform information |
| `/contact` | Contact | Contact form |
| `/terms` | Terms of Service | Legal terms |
| `/privacy` | Privacy Policy | Privacy policy |
| `/pricing` | Pricing Plans | Subscription tiers comparison |
| `/ai` | AI Features | Showcase of AI report capabilities |

### Authenticated User Pages (Any Logged-In Role)

| Route | Page | Key Features |
|-------|------|-------------|
| `/dashboard` | User Dashboard | Welcome, user stats, My Properties list, My Favorites, Tokenization Requests, Portfolio Overview, Investor Hub, Rent Dashboard Widget |
| `/add-property` | Add Property | Two-step: Step 1 = location picker (map), Step 2 = property details form (with compliance gate) |
| `/account-settings` | Account Settings | Profile settings |
| `/fractional-ownership` | Fractional Ownership | Info page |
| `/tokenization` | Tokenization | Property tokenization info |
| `/subscription` | Subscription | Plan management |
| `/subscription/apply` | Apply | Upgrade application |
| `/subscription/status` | Status | Current subscription status |
| `/invest` | Investment Marketplace | Browse tokenized property offerings, filter by open/closed, search by property/location |
| `/invest/offering` | Offering Detail | Single investment opportunity |
| `/invest/portfolio` | Portfolio | User's investment portfolio |
| `/invest/wallet` | Wallet | Investment wallet/balance |
| `/invest/kyc` | KYC Verification | Know-Your-Customer for investments |
| `/rent` | Rent | Rent management overview |
| `/rent/portal` | Rent Portal | Tenant-facing rent portal |
| `/rent/manage` | Rent Manage | Landlord rent management |
| `/secondary-market` | Secondary Market | Trade tokenized property shares |
| `/dashboards` | Dashboards | Additional user dashboards |

### Admin Pages (`admin` + `superadmin` roles)

| Route | Page | Key Features |
|-------|------|-------------|
| `/admin/dashboard` | Admin Dashboard | Platform stats, recent activity feed |
| `/admin/users` | User Management | CRUD users, roles, subscription tiers |
| `/admin/properties` | Property Management | All properties overview |
| `/admin/activity` | Activity Logs | Full activity audit trail |
| `/admin/compliance` | Compliance | Ejar mirror, FAL license checks, compliance checklist |
| `/admin/compliance/dashboard` | Compliance Dashboard | Compliance metrics dashboard |
| `/admin/pricing` | Pricing Management | Configure subscription pricing |
| `/admin/subscriptions` | Subscription Management | All user subscriptions |
| `/admin/subscription-approvals` | Subscription Approvals | Pending upgrade approvals |
| `/admin/tokenization` | Tokenization | Manage tokenization requests |
| `/admin/tokenization-kyc` | Tokenization KYC | Review investor KYC documents |
| `/admin/tokenization-income` | Tokenization Income | Track tokenization income distribution |
| `/admin/fractional-ownership` | Fractional Ownership Mgmt | Admin fractional ownership |
| `/admin/secondary-market` | Secondary Market Mgmt | Admin secondary market |
| `/admin/rent` | Rent Management | Full rent operations |
| `/admin/rent/contracts` | Rent Contracts | Contract management |
| `/admin/rent/invoices` | Rent Invoices | Invoice management |
| `/admin/rent/payments` | Rent Payments | Payment tracking |
| `/admin/rent/tenants` | Rent Tenants | Tenant management |
| `/admin/rent/investors` | Rent Investors | Investor management |
| `/admin/rent/reports` | Rent Reports | Rent analytics reports |
| `/admin/rent/expenses` | Rent Expenses | Expense tracking |

### Superadmin Page

| Route | Page | Key Features |
|-------|------|-------------|
| `/superadmin` | Super Admin Panel | Platform-wide controls |

---

## 3. Business Persona User Flows

### Persona Map: What Each User Type Does

| Persona | Primary Pages | Core Actions |
|---------|--------------|--------------|
| # | Persona (Login) | Role | `userType` | Icon | Primary Pages | Core Actions |
|---|-----------------|------|------------|------|---------------|--------------|
| 1 | **Investor / Buyer** | `user` | `investor` | 💰 | `/invest`, `/invest/offering`, `/invest/portfolio`, `/invest/wallet`, `/invest/kyc`, `/properties`, `/map` | Browse & invest in tokenized properties, search listings, AI reports, track portfolio, KYC |
| 2 | **Property Owner** | `user` | `owner` | 🏠 | `/dashboard`, `/add-property`, `/rent/manage`, `/tokenization`, `/fractional-ownership` | List properties, manage rentals, request tokenization, income monitoring |
| 3 | **Real Estate Office / Broker** | `user` | `office` | 🤝 | `/dashboard`, `/rent/manage`, properties | Manage client listings, coordinate sales/leases, contracts, compliance (Ejar/FAL) |
| 4 | **Developer** | `user` | `developer` | 🏗️ | `/dashboard`, `/add-property`, `/tokenization`, `/fractional-ownership` | Development projects, tokenize assets, REGA/FAL compliance |
| 5 | **Admin** | `admin` | `office` | 🛡️ | `/admin/dashboard`, `/admin/users`, `/admin/compliance`, `/admin/tokenization`, `/admin/rent/*` | User management, compliance review, tokenization/KYC approval, rent oversight, pricing |
| 6 | **Super Admin** | `superadmin` | `office` | 👑 | `/superadmin` + all admin routes | Full platform control, global settings, override capabilities |

---

## 4. Detailed User Flows

### Flow A: Property Discovery & Search (All Users)

```
START → / or /properties
  │
  ├─ Free-text search bar → enter city name (e.g., "Riyadh", "Jeddah")
  │     OR enter district name (e.g., "Al Olaya", "Corniche")
  │     OR enter zip code
  │     OR enter compound name
  │
  ├─ Advanced filters (collapsible panel):
  │     ├─ Property Type: Villa | Apartment | Commercial | Land | etc.
  │     ├─ Min Price (SAR)
  │     ├─ Max Price (SAR)
  │     └─ Min Bedrooms: 1+ | 2+ | 3+ | 4+ | 5+
  │
  └─ Results → Paginated grid of Property Cards
       │
       ├─ Each card shows: image, price, title, location, beds, baths, area
       ├─ Heart icon → Toggle favorite (requires login)
       ├─ "Generate Report" button → AI Report Dialog
       ├─ "Chat" button → Property chat panel
       └─ Click card → Navigate to property detail
```

**City/District Search Implementation:**
- The `search` input fires against the API parameter `search`
- API matches against: `title`, `description`, `locationName`, and `zipCode` via PostgreSQL `ILIKE`
- The `locationName` field stores combined city+district (e.g., "Al Olaya, Riyadh")
- **Note:** The `city` and `district` DB columns exist and are returned in responses, but the frontend search does NOT query them directly (relies on `locationName` instead). This works because `locationName` was populated by geocoding and contains the full address.

---

### Flow B: Property Detail View (All Users)

```
Click property card from list
  │
  └─ → Property detail page (served by `/properties/:id`)
       │
       ├─ Full property info: images, price, location, beds/baths, area
       ├─ Owner info (name, avatar, email contact)
       ├─ AI Report status indicator
       ├─ Favorite toggle
       ├─ Chat button → Property chat
       └─ AI Report button → opens AI Report Dialog
```

---

### Flow C: AI Property Report (All Users, Tier-Gated)

```
On any property card or detail → Click "Generate Report"
  │
  ├─ NOT LOGGED IN → Show "Login Required" UI with link to /login
  │
  └─ LOGGED IN:
       │
       ├─ FREE TIER:
       │     ├─ Property Summary (positive headline, property age, description)
       │     ├─ Market Prices (estimated rent range + sale range)
       │     ├─ Area Analysis (neighborhood text analysis)
       │     ├─ Safety Score
       │     ├─ Walkability Score
       │     ├─ Nearby Schools & Restaurants
       │     └─ Upgrade prompt at bottom
       │
       └─ PREMIUM TIER (or admin):
             ├─ All FREE content +
             ├─ Investment Analysis (ROI, rental yield, appreciation potential)
             ├─ Risk Assessment (Low/Medium/High)
             ├─ Investment Horizon recommendation
             ├─ Charts & visualizations
             ├─ Export to PDF
             ├─ Share via WhatsApp
             └─ Email report (Premium only)
       │
       └─ AI Report Limit:
             ├─ Monthly limit tracked via `aiReportsUsed` column
             ├─ Reset monthly automatically
             ├─ Exceeded → "Buy More Reports" dialog
             └─ Link to upgrade subscription
```

**Under the Hood:** Reports are generated by the real **DeepSeek V4 Flash** AI model. The API calls `callDeepSeek()` with structured prompts that include OSM (OpenStreetMap) data for the property's coordinates. Falls back to mock data if DeepSeek is unavailable.

---

### Flow D: Registration & Login

```
/login
  │
  ├─ Sign In tab:
  │    ├─ OAuth buttons (Google, Apple - via OAuthButtonGroup)
  │    ├─ Password + Email login form
  │    └─ Demo Account Access (quick-login buttons for 6 demo accounts, grouped as User Accounts + Admin Accounts)
  │
  ├─ Sign Up tab:
  │    └─ Password + Email + Display name registration form
  │
  └─ After login → redirect to `/` (Home)
      │
      └─ Session persisted via HttpOnly cookie (`sknai_session` for real accounts,
          `sknai_demo_user` for demo accounts)
```

---

### Flow E: Dashboard & User Management (Logged-in Users)

```
/dashboard
  │
  ├─ Welcome message + user display name
  ├─ User Stats (property count, favorites, AI reports used)
  │
  ├─ My Properties section
  │    └─ Queried via `GET /_api/properties/list?userId=<id>`
  │
  ├─ My Favorites section
  │    └─ Uses `UserFavorites` component
  │
  ├─ Tokenization Requests
  │    └─ Status badges: pending, under_review, approved, rejected
  │
  ├─ Portfolio Overview (for investors)
  ├─ Investor Hub
  └─ Rent Dashboard Widget
```

---

### Flow F: Add Property (Property Owner)

```
/add-property → Protected route (must be logged in)
  │
  ├─ STEP 1: Location Picker
  │    ├─ Interactive map (click to select coordinates)
  │    ├─ Or manual address entry mode
  │    └─ Nominatim reverse geocoding → fills city, district, locationName
  │
  └─ STEP 2: Property Details Form
       ├─ Title, description, price
       ├─ Property type, bedrooms, bathrooms, area
       ├─ Images upload
       ├─ Compliance Gate (Ejar integration, FAL license checks)
       └─ Submit → creates via `POST /_api/properties/create`
```

---

### Flow G: Investment & Tokenization

```
/invest → Browse tokenized property offerings
  │
  ├─ Filter by status: Open | Closed | All
  ├─ Search by property name or location
  └─ Grid of TokenOfferingCards
       │
       └─ Click offering → /invest/offering → Detailed offering view
            ├─ Invest button → requires KYC completion first
            ├─ /invest/kyc → Submit identity documents
            └─ /invest/portfolio → View holdings
                 └─ /invest/wallet → Deposit/withdraw funds

/tokenization → Info about property tokenization
  └─ Property owners can request tokenization from property card
       └─ Admin reviews in /admin/tokenization
            ├─ KYC review in /admin/tokenization-kyc
            └─ Income distribution in /admin/tokenization-income
```

---

### Flow H: Rent Management

```
/rent → Rent management hub (for landlords)
  ├─ /rent/portal → Tenant-facing portal
  ├─ /rent/manage → Landlord management
  └─ /admin/rent → Full admin rent suite
       ├─ /admin/rent/contracts
       ├─ /admin/rent/invoices
       ├─ /admin/rent/payments
       ├─ /admin/rent/tenants
       ├─ /admin/rent/investors
       ├─ /admin/rent/reports
       └─ /admin/rent/expenses
```

---

### Flow H: Rent Management (Landlord / Owner / Broker)

```
/rent → Rent management hub
  ├─ /rent/portal → Tenant-facing portal (for tenants to view contracts, pay invoices)
  ├─ /rent/manage → Landlord/owner/broker management dashboard
  │    ├─ Lists properties where user is assigned as owner/broker/developer
  │    ├─ Shows unit count, active contracts, monthly income per property
  │    ├─ Role badge per property: Owner | Developer | Broker | Admin | Investor
  │    ├─ Quick links: Contracts | Invoices | Reports per property
  │    └─ Access check — if not assigned any role, shows "Browse Rentals" CTA
  └─ /admin/rent → Full admin rent suite
       ├─ /admin/rent/contracts → Contract management
       ├─ /admin/rent/invoices → Invoice management
       ├─ /admin/rent/payments → Payment tracking
       ├─ /admin/rent/tenants → Tenant management
       ├─ /admin/rent/investors → Investor management
       ├─ /admin/rent/reports → Rent analytics reports
       └─ /admin/rent/expenses → Expense tracking
```

**Role Badges in Rent Management:** Owner (🏠), Developer (🏗️), Broker (🤝), Admin (🛡️), Investor (💰) — each with distinct CSS styling.

---

### Flow I: Broker / Real Estate Office Flow

```
Dedicated for brokerage offices managing multiple client properties

START → /dashboard
  │
  ├─ My Properties → properties where broker is assigned via PropertyMembers
  ├─ /rent/manage → Manage rental contracts for client properties
  │    ├─ Contracts, invoices, payments per property
  │    └─ Role badge: "broker"
  ├─ /admin/rent/* → (if broker has admin-level access)
  │    ├─ Contract management
  │    ├─ Invoice & payment processing
  │    └─ Tenant management
  └─ Can also use standard user features:
       ├─ Generate AI reports on listings
       ├─ Property discovery/search
       └─ Chat with potential buyers/tenants
```

---

### Flow J: Real Estate Developer Flow

```
START → /dashboard
  │
  ├─ My Properties → development projects where assigned as developer
  ├─ /add-property → Register new development property
  │    ├─ Compliance Gate: FAL license, REGA checklist, brokerage contracts
  │    └─ Requires: FAL/REGA license #, ad license #, ownership deed
  ├─ /tokenization → Apply for property tokenization
  │    ├─ Asset valuation, token metrics, custody model
  │    ├─ REGA/FAL compliance checklist
  │    └─ Smart contract review confirmation
  ├─ /fractional-ownership → Apply for fractional ownership
  │    ├─ REGA-aware controls, income distribution model
  │    └─ Admin review board for approval
  ├─ /rent/manage → Manage rental units within development
  │    └─ Role badge: "developer"
  └─ Admin review → /admin/tokenization fits developer requests
```

---

### Flow K: Investor Flow

```
START → /dashboard
  │
  ├─ Portfolio Overview widget → Quick investment snapshot
  ├─ Investor Hub → Curated investment opportunities
  │
  ├─ /invest → Browse tokenized property offerings
  │    ├─ Filter: Open | Closed | All
  │    ├─ Search by property name or location
  │    └─ Grid of TokenOfferingCards (token details, ROI, min investment)
  │
  ├─ /invest/offering → Detailed offering view
  │    ├─ Property details, token economics, distribution schedule
  │    └─ Invest button → Check KYC status
  │         ├─ KYC not completed → /invest/kyc
  │         │    └─ Submit identity documents (RegaForm)
  │         └─ KYC approved → Complete purchase
  │
  ├─ /invest/portfolio → View all investments
  │    ├─ Holdings per tokenized asset
  │    ├─ Total value, returns, distributions
  │    └─ Links to /invest/wallet
  │
  ├─ /invest/wallet → Deposit/withdraw funds
  │    ├─ Wallet balance
  │    ├─ Transaction history
  │    └─ Income distributions
  │
  ├─ /secondary-market → Trade token shares
  │    └─ Buy/sell listed tokenized property shares
  │
  └─ /invest/portfolio → Track rental income distributions
       └─ Income allocated via RentalIncomeAllocations table
            └─ InvestorDistributions paid out per period
```

---

### Flow L: Tenant Flow

```
START → /rent/portal
  │
  ├─ Tab: Contracts → View active/pending rental contracts
  │    ├─ Contract start/end dates, monthly rent, deposit
  │    └─ Status badges: active, pending, expired, terminated
  │
  ├─ Tab: Invoices → View rent invoices
  │    ├─ Invoice status: paid, pending, overdue, cancelled
  │    ├─ Amount due, due dates
  │    └─ Pay online via integrated payment providers
  │
  ├─ Tab: Payments → View payment history
  │    ├─ Paid amounts, dates, payment methods
  │    └─ Download receipts from /admin/rent/receipts
  │
  └─ /rent → Rent overview page
       └─ Links to portal, management, and listings
```

---

### Flow M: Admin Operations

```
/admin/dashboard → Stats overview + recent activity
  │
  ├─ /admin/users → Create, edit, delete users (roles, tiers)
  ├─ /admin/properties → Manage all properties
  ├─ /admin/activity → Full audit trail
  ├─ /admin/compliance → Ejar mirror, FAL checks
  │    └─ /admin/compliance/dashboard → Compliance metrics
  ├─ /admin/pricing → Set subscription prices
  ├─ /admin/subscriptions → View all user subscriptions
  │    └─ /admin/subscription-approvals → Approve/reject upgrades
  ├─ /admin/tokenization → Review tokenization requests
  │    ├─ /admin/tokenization-kyc → Review investor KYC
  │    └─ /admin/tokenization-income → Income distribution
  ├─ /admin/fractional-ownership → Admin fractional ownership
  ├─ /admin/secondary-market → Admin secondary market
  └─ /admin/rent → Full rent management suite
```

---

### Flow N: Superadmin

```
/superadmin → Platform-wide controls
  │
  └─ Only accessible to users with role "superadmin"
       └─ Has access to ALL admin routes plus superadmin-specific page
```

## 5. API Endpoints Summary

### Properties
| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/_api/properties/list` | List/search properties | Optional |
| GET | `/_api/properties/details` | Single property detail | Optional |
| POST | `/_api/properties/create` | Add new property | Required |
| POST | `/_api/properties/ai_report` | Generate AI report | Required |
| POST | `/_api/properties/chat` | Property chat | Optional |
| GET | `/_api/properties/chat` | Get chat messages | Optional |

### Auth
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/_api/auth/login_with_password` | Password login |
| POST | `/_api/auth/register_with_password` | Password registration |
| POST | `/_api/auth/logout` | Logout |
| GET | `/_api/auth/session` | Get current session |
| GET | `/_api/auth/oauth_authorize` | OAuth authorization |
| GET | `/_api/auth/oauth_callback` | OAuth callback |
| POST | `/_api/establish_session` | Establish session |

### Admin
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/_api/admin/stats` | Platform statistics |
| GET | `/_api/admin/activity_logs` | Activity audit log |
| GET | `/_api/admin/users/list` | List users |
| POST | `/_api/admin/users/create` | Create user |
| POST | `/_api/admin/users/update` | Update user |
| POST | `/_api/admin/users/delete` | Delete user |
| GET | `/_api/admin/properties/list` | Admin property list |
| GET | `/_api/admin/pricing` | Get pricing |
| POST | `/_api/admin/pricing` | Set pricing |
| GET | `/_api/admin/compliance/*` | Compliance operations |
| GET | `/_api/ledger/*` | Ledger operations |

---

## 6. Search by City / District — Detailed Implementation

The application supports searching properties by **city** and/or **city district** through a unified free-text search system:

### Frontend (User Facing)
- **Single text input** with placeholder: `"Search location, zip code, compound..."`
- User types any combination of: city name, district name, neighborhood, zip code
- No separate "City" or "District" dropdown — everything flows through the same search bar
- URL query parameter: `?search=Riyadh` or `?search=Al+Olaya` or `?search=Riyadh+Al+Olaya`

### API Layer
- `GET /_api/properties/list?search=<term>`
- PostgreSQL `ILIKE` matching against these columns:
  - `properties.title` — e.g., "Villa in Riyadh - Al Olaya"
  - `properties.description` — free-text description
  - `properties.locationName` — full location string (geocoded)
  - `properties.zipCode` — zip/postal code

### Database Columns
- `properties.city` — city name (populated from Nominatim geocoding)
- `properties.district` — district/neighborhood name
- `properties.locationName` — combined location string
- `properties.zipCode` — postal/zip code

### Notable Observation
The `city` and `district` columns exist in the DB and are returned by the API, but the search does **not** query them directly. Instead, `locationName` is the primary location search column. Since `locationName` contains the full geocoded address (e.g., "Al Olaya, Riyadh, Saudi Arabia"), searching by city or district name against `locationName` effectively achieves city/district search. To optimize, the search could be enhanced to also query `city` and `district` columns directly for more precise matching.

---

## 7. Key Technical Architecture

```
Frontend (React + Vite + React Router)
    ↕ HTTP (JSON/SuperJSON)
API Server (Hono + tsx, port 3333)
    ↕ Kysely (query builder)
PostgreSQL (Neon Serverless)
    ↗ DeepSeek V4 Flash AI (via native fetch)
    ↗ OpenStreetMap/Overpass API (real estate data)
    ↗ Nominatim (reverse geocoding)
    ↗ OAuth providers (Google, Apple)
```

### Data Flow for AI Reports
```
1. Property card → Click "Generate Report"
2. Frontend → POST /_api/properties/ai_report {propertyId, language, tier}
3. Server auth check → `getServerUserSession()`
4. Fetch property from DB
5. Collect OSM data: nearby schools, restaurants, amenities via Overpass API
6. Build prompts (bilingual, tier-specific)
7. Call DeepSeek V4 Flash API with structured JSON mode
8. Parse AI response → validate against Zod schema
9. Save report to DB, return to frontend
10. Frontend renders: stats, charts, analysis, amenities
```
