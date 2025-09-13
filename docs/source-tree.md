# School Request Management System - Source Tree Document

## Change Log
| Date | Version | Description | Author |
|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial source tree document creation | Architect |

## Source Tree

The project follows a monorepo structure with a clear separation of concerns between different parts of the application.

```
school-request-management/
├── app/                          # Next.js 15 App Router structure
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (main)/                   # Main application routes
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── requests/
│   │   ├── page.tsx          # Requests list
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Request detail
│   │   │   └── new/
│   │   │       └── page.tsx      # New request form
│   │   ├── admin/
│   │   ├── workflows/
│   │   │   │   └── page.tsx
│   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── reports/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui components
│   ├── shared/                   # Shared components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBadge.tsx
│   └── features/                 # Feature-specific components
│       ├── requests/
│       │   ├── RequestForm.tsx
│       │   ├── RequestList.tsx
│       │   └── ApprovalHistory.tsx
│       └── auth/
│           └── AuthForm.tsx
├── lib/                          # Utility functions and configurations
│   ├── query-client.ts           # TanStack Query configuration
│   ├── utils.ts                  # General utility functions
│   └── supabase/                 # Supabase client configuration
│       ├── client.ts
│       └── server.ts
├── hooks/                        # Custom React hooks
│   └── use-auth.ts
├── stores/                       # Zustand stores
│   └── auth-store.ts
├── services/                     # Business logic services
│   ├── request-service.ts
│   ├── approval-service.ts
│   └── auth-service.ts
├── types/                        # TypeScript type definitions
│   ├── database.types.ts         # Supabase-generated types
│   └── index.ts
├── tests/                        # Test files
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # End-to-end tests
├── public/                       # Static assets
└── docs/                         # Documentation
    ├── prd.md                    # Product Requirements Document
    ├── architecture.md           # Architecture Document
    └── adr/                      # Architectural Decision Records