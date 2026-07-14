# Smart Bus Management System

**Digitize Your Bus Operations — Routes, Tickets & Fleet in One Place**

Enterprise-grade bus management platform for route planning, online ticket booking, fleet tracking, payments, and analytics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion |
| Backend | Next.js Server Actions, Prisma ORM |
| Database | PostgreSQL (Neon recommended) |
| Auth | Better Auth (Email + Google OAuth) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| State | TanStack Query |
| Deployment | Vercel + Neon PostgreSQL |

## User Roles

| Role | Access |
|------|--------|
| **Super Admin** | Full system control — users, buses, routes, schedules, tickets, payments, reports, settings |
| **Manager** | Routes, schedules, buses, drivers, reports |
| **Driver** | Assigned trips, status updates, maintenance reports |
| **Passenger** | Search buses, book tickets, pay online, track buses, booking history |

## Core Modules

- **Authentication** — Registration, login, Google OAuth, role-based access
- **Dashboard** — KPI cards, revenue charts, booking trends
- **Bus Management** — CRUD with seat auto-generation
- **Route Management** — Source, destination, distance, duration
- **Schedule Management** — Departure/arrival, bus & driver assignment
- **Ticket Booking** — Interactive seat selection, instant confirmation
- **Payment Processing** — bKash, Nagad, Rocket, SSLCommerz ready
- **E-Ticket** — QR code generation, ticket numbers
- **Driver Management** — License tracking, assignments
- **Maintenance** — Service scheduling, expense tracking
- **GPS Tracking** — Live bus tracking (Google Maps API)
- **Reports & Analytics** — Revenue trends, route popularity, exports
- **Notifications** — Email, SMS, push (extensible)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) recommended)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and BETTER_AUTH_SECRET

# 3. Push database schema
npm run db:push

# 4. Seed sample data
npm run db:seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After seeding:

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | `admin@smartbus.com` | `Admin@12345` |
| **Platform Admin** | `manager@smartbus.com` | `Manager@12345` |
| **Passenger** | `passenger@smartbus.com` | `Passenger@12345` |
| **Driver** | `driver@smartbus.com` | `Driver@12345` |

You can also register a new passenger account from `/register`.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, register
│   ├── (dashboard)/        # Admin/Manager portal
│   ├── (driver)/           # Driver portal
│   └── (passenger)/        # Passenger portal
├── actions/                # Server Actions
├── services/               # Business logic
├── features/               # Feature modules (UI)
├── components/             # Shared UI components
├── lib/                    # Auth, DB, utilities
├── schemas/                # Zod validation
├── types/                  # TypeScript types
└── constants/              # App constants
prisma/
├── schema.prisma           # Database schema
└── seed.ts                 # Sample data
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Deploy

### Neon PostgreSQL

1. Create project at [neon.tech](https://neon.tech)
2. Copy connection string to `DATABASE_URL`
3. Run `npm run db:push && npm run db:seed` against production DB

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | 32+ char secret key |
| `BETTER_AUTH_URL` | Yes | App URL (e.g. https://yourapp.vercel.app) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL |
| `GOOGLE_CLIENT_ID` | No | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | GPS tracking |
| `CLOUDINARY_*` | No | Image uploads |

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Auth users with roles (Better Auth) |
| `sessions`, `accounts`, `verifications` | Auth sessions & OAuth |
| `passengers` | Passenger profiles & loyalty |
| `drivers` | Driver profiles & license info |
| `buses` | Fleet management |
| `routes` | Route definitions |
| `stops` | Bus stop locations |
| `route_stops` | Route ↔ stop junction |
| `schedules` | Trip schedules |
| `trips` | Daily trip instances |
| `seats` | Bus seat layout |
| `bookings` | Ticket bookings |
| `payments` | Payment transactions |
| `tickets` | E-tickets with QR data |
| `maintenances` | Vehicle maintenance records |
| `notifications` | User notifications |

### Extended Tables

| Table | Purpose |
|-------|---------|
| `refunds` | Payment refund management |
| `reports` | Saved/generated reports (PDF/Excel/CSV) |
| `trip_locations` | GPS tracking history |
| `fare_rules` | Dynamic fare calculation rules |
| `driver_performances` | Monthly driver metrics |
| `loyalty_transactions` | Passenger loyalty point history |
| `seat_holds` | Temporary seat reservations during checkout |
| `bus_documents` | Insurance, registration, fitness expiry |
| `driver_documents` | License & permit tracking |
| `permissions` | RBAC permission definitions |
| `role_permissions` | Role ↔ permission mapping |
| `audit_logs` | Security audit trail |
| `settings` | System configuration |

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to DB |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run promote-admin` | Promote user to admin |

## License

Private — All rights reserved.
# test
