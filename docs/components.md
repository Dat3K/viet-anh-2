# School Request Management System - Components Document

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial components document creation | Architect |

## Components

The School Request Management System is organized into logical components that align with the monorepo structure and the functional requirements of the system.

### Next.js Frontend

**Responsibility:** Handles all user interface interactions, data presentation, and client-side logic.

**Key Interfaces:**
- User authentication and session management
- Request creation and management UI
- Approval workflow interfaces
- Administrative configuration interfaces
- Reporting and analytics dashboards

**Dependencies:** Supabase JS Client, TanStack Query, Zustand, shadcn/ui components

**Technology Stack:** Next.js 15 with App Router, TypeScript, Tailwind CSS, React Hook Form, Zod

### Next.js Server Components

**Responsibility:** Handles all data mutations, complex business logic, and direct database interactions with administrative privileges.

**Key Interfaces:**
- Request creation and update operations
- Approval workflow processing
- User and role management
- Audit logging
- Database trigger functions

**Dependencies:** Supabase Admin Client, PostgreSQL database

**Technology Stack:** Next.js 15 Server Components, TypeScript

### Supabase Services

**Responsibility:** Provides backend services including database, authentication, real-time updates, and storage.

**Key Interfaces:**
- PostgreSQL database with Row Level Security
- Authentication with Azure AD integration
- Real-time data subscriptions
- File storage for attachments

**Dependencies:** PostgreSQL, Azure AD

**Technology Stack:** Supabase Platform, PostgreSQL 15

### Database Layer

**Responsibility:** Persistent storage of all application data with security and integrity controls.

**Key Interfaces:**
- Data storage and retrieval
- Row Level Security policies
- Database triggers for workflow automation
- Audit logging

**Dependencies:** PostgreSQL

**Technology Stack:** PostgreSQL 15

### Component Diagrams