# School Request Management System - Tech Stack Document

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial tech stack document creation | Architect |

## Cloud Infrastructure

- **Provider:** Supabase
- **Key Services:** PostgreSQL Database, Authentication (Azure AD), Row Level Security, Realtime, Storage
- **Deployment Regions:** Default regions provided by Supabase

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| **Language** | TypeScript | 5.3.3 | Primary development language | Strong typing, excellent tooling, team expertise |
| **Runtime** | Node.js | 20.11.0 | JavaScript runtime | LTS version, stable performance, wide ecosystem |
| **Framework** | Next.js | 15.0.0 | Frontend framework with App Router | Modern React framework with excellent performance and developer experience |
| **Database** | PostgreSQL | 15.x | Primary database | Robust, reliable, supported by Supabase with RLS capabilities |
| **Authentication** | Supabase Auth | Latest | Authentication service | Integrated with Azure AD, provides secure authentication |
| **State Management** | Zustand | 4.5.0 | Client-side state management | Lightweight, simple API, good performance |
| **Data Fetching** | TanStack Query | 5.0.0 | Server state management | Excellent caching, automatic refetching, error handling |
| **Form Handling** | React Hook Form | 7.48.0 | Form management | Performant, easy validation with Zod integration |
| **Validation** | Zod | 3.22.0 | Schema validation | Type-safe validation, excellent TypeScript integration |
| **UI Components** | shadcn/ui | Latest | UI component library | Well-designed, accessible components built on Radix UI |
| **Testing** | Jest | 29.7.0 | Unit testing | Mature testing framework with good TypeScript support |
| **Testing** | Playwright | 1.40.0 | End-to-end testing | Reliable cross-browser testing, good developer experience |
| **Styling** | Tailwind CSS | 3.3.0 | Utility-first CSS framework | Rapid UI development, consistent design system |
| **Deployment** | Vercel | Latest | Hosting platform | Optimal Next.js hosting with excellent performance |
| **Containerization** | Docker | 24.0.0 | Container platform | Consistent environments across development, testing, and production |
| **CI/CD** | GitHub Actions | Latest | CI/CD platform | Integrated with GitHub, good ecosystem of actions |