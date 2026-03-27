# Imobiliária Lemos — Sistema Completo

**Plataforma imobiliária full-stack** para a Imobiliária Lemos de Franca SP.
Combina um site público com busca por IA, um CRM interno e uma área de dashboard com 16+ módulos operacionais.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-2-3ECF8E?logo=supabase)
![React Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Styling | Tailwind CSS 3 + Radix UI |
| Data fetching / caching | TanStack React Query v5 |
| Backend / DB / Auth | Supabase (PostgreSQL + Edge Functions) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| Charts | Recharts |
| Build tool | Vite 5 |

---

## Prerequisites

- **Node.js 18+** — `node --version`
- **npm 9+** — `npm --version`
- **Supabase CLI** — `npm install -g supabase`
- A Supabase project (cloud) **or** Docker for local development

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/imobiliarialemos.git
cd imobiliarialemos
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials (see the [Environment Variables](#environment-variables) table below).

### 3. Start Supabase (local development)

```bash
# Start local Supabase stack (requires Docker)
supabase start

# The CLI will print your local SUPABASE_URL and ANON_KEY — paste them into .env
```

Alternatively, connect to your hosted Supabase project and paste the keys from
**Project Settings → API** into `.env`.

### 4. Apply database migrations

```bash
supabase db push
```

This runs all migration files inside `supabase/migrations/` against the target database.

### 5. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## Project Structure

```
src/
├── assets/              # Static assets (images, icons)
├── components/
│   ├── home/            # Homepage-specific components (HeroSearch, etc.)
│   ├── layout/          # DashboardLayout, Navbar, Sidebar
│   ├── property/        # PropertyCard, PropertyGallery, etc.
│   ├── ui/              # Radix-based design system primitives
│   └── SEO.tsx          # Headless SEO meta-tag manager
├── contexts/
│   └── AuthContext.tsx  # Auth state, RequireAuth, RequireGuest
├── hooks/
│   ├── useAuth.ts       # Auth helpers (useCurrentUser, useIsAdmin…)
│   ├── useClients.ts    # Client CRUD + match-finding
│   ├── useLeads.ts      # Lead CRUD + conversion to client
│   ├── useNegotiations.ts # Negotiation CRUD + Kanban stage mutations
│   ├── useProperties.ts # Property CRUD + AI search
│   └── useSearch.ts     # Debounced AI search state machine
├── lib/
│   └── supabase.ts      # Typed Supabase client
├── pages/
│   ├── Home.tsx
│   ├── Search.tsx
│   ├── PropertyDetail.tsx
│   ├── News.tsx
│   ├── Platform.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   └── dashboard/
│       ├── Dashboard.tsx     # Layout shell (Outlet)
│       ├── Overview.tsx
│       ├── Properties.tsx
│       ├── Clients.tsx
│       ├── Negotiations.tsx
│       ├── Leads.tsx
│       ├── Appointments.tsx
│       ├── Contracts.tsx
│       ├── Financing.tsx
│       ├── Commissions.tsx
│       ├── MassMessages.tsx
│       ├── Renewals.tsx
│       ├── Marketing.tsx
│       ├── CMS.tsx
│       ├── Reports.tsx
│       ├── Users.tsx
│       └── Settings.tsx
├── types/
│   ├── database.ts      # Raw DB types (enums + interfaces)
│   └── index.ts         # Re-exports + frontend-specific types
├── utils/
│   ├── formatters.ts    # Currency, area, phone, date, slug…
│   └── seo.ts           # SEOConfig builder functions
├── App.tsx              # Root router + providers
└── main.tsx             # React entry point
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (public) API key |
| `VITE_APP_NAME` | No | Display name (`Imobiliária Lemos`) |
| `VITE_APP_URL` | No | Canonical site URL (used for SEO) |
| `VITE_APP_PHONE` | No | Main contact phone number |
| `VITE_APP_WHATSAPP` | No | WhatsApp number with country code (`5516…`) |
| `VITE_GA_MEASUREMENT_ID` | No | Google Analytics 4 Measurement ID |

---

## Available Routes

### Public

| Route | Page |
|---|---|
| `/` | Homepage with AI hero search |
| `/imoveis` | Property search / listing |
| `/imovel/:slug` | Property detail |
| `/noticias` | News / blog |
| `/plataforma` | Platform landing page |
| `/login` | Login (redirects if authenticated) |

### Dashboard (requires authentication)

| Route | Module |
|---|---|
| `/dashboard` | Overview / KPIs |
| `/dashboard/imoveis` | Property management |
| `/dashboard/clientes` | CRM — clients |
| `/dashboard/negociacoes` | Negotiations Kanban |
| `/dashboard/leads` | Lead pipeline |
| `/dashboard/agenda` | Appointments / visits |
| `/dashboard/mensagens` | Mass messaging (WhatsApp/Email) |
| `/dashboard/renovacoes` | Contract renewals |
| `/dashboard/redes-sociais` | Social media / marketing |
| `/dashboard/financiamentos` | Financing simulations |
| `/dashboard/contratos` | Contracts |
| `/dashboard/comissoes` | Commissions |
| `/dashboard/relatorios` | Reports & analytics |
| `/dashboard/cms` | Site CMS (banners, testimonials) |
| `/dashboard/avaliacoes` | Property valuations |
| `/dashboard/usuarios` | User management (admin) |
| `/dashboard/configuracoes` | Settings |

---

## Deployment

### Vercel + Supabase (recommended)

1. Push your repository to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Add all `VITE_*` environment variables in **Vercel → Settings → Environment Variables**.
4. Set the **Output Directory** to `dist` (Vite default — Vercel detects this automatically).
5. Deploy. Vercel will auto-deploy on every push to `main`.

For the Supabase Edge Functions (`ai-search`, etc.):

```bash
# Deploy all edge functions to your Supabase project
supabase functions deploy
```

---

## Screenshots

> _Add screenshots here once the UI is finalised._

| Homepage | Dashboard |
|---|---|
| _(screenshot)_ | _(screenshot)_ |
