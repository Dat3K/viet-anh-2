# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests

### Database Operations
- `supabase link` - Connect to Supabase project
- `supabase db push` - Push local schema changes to Supabase
- `supabase functions deploy` - Deploy Edge Functions
- `supabase gen types typescript --local > types/database.types.ts` - Generate TypeScript types

## Architecture Overview

This is a School Request Management System built with Next.js 15 and Supabase, using the App Router architecture. The system manages school supply requests through approval workflows involving teachers, department heads, and directors.

### Key Architecture Patterns

**Modular Design**: The system uses a pluggable architecture where `requests` table has a `request_type` column and `payload` JSONB column for type-specific data. New request types can be added without core architecture changes.

**State Management**:
- Zustand for global UI state (sidebar, theme, user info)
- TanStack Query for all server state management

**Authentication Flow**: Azure AD integration with Supabase Auth. The system uses PKCE flow for enhanced security.

**Data Flow**: Uses Next.js Server Components for write operations instead of traditional API routes, providing better security and performance.

### Project Structure

```
app/                    # Next.js App Router
├── auth/               # Authentication pages
├── supply-requests/    # Main application pages
│   ├── [id]/          # Request detail pages
│   ├── create/        # Request creation
│   ├── approve/       # Approval interface
│   └── history/       # Request history
├── dashboard/         # Dashboard
└── profile/           # User profile

components/
├── ui/               # shadcn/ui components
├── layout/           # Layout components (AppLayout, AppSidebar, Header)
├── providers/        # Context providers (Auth, Query, Theme)
├── loading/          # Loading components
└── features/         # Feature-specific components

lib/
├── supabase/         # Supabase clients (browser, server, middleware)
├── services/         # Data service classes
├── schemas/          # Zod validation schemas
├── stores/           # Zustand stores
└── utils.ts          # Utility functions

hooks/                # Custom React hooks
types/                # TypeScript definitions
```

### Authentication System

**Azure AD Integration**: Uses Azure AD as the sole authentication provider through Supabase Auth. Configuration in `lib/supabase/client.ts` uses PKCE flow.

**Auth State Management**:
- `AuthProvider` manages auth state and updates React Query cache
- `useAuth` hook provides authentication status and operations
- Auth changes trigger automatic query invalidation and cache clearing

**Middleware**: Protected routes redirect unauthenticated users to login page.

### Data Layer Architecture

**Service Pattern**: All data operations go through service classes in `lib/services/`:
- `BaseService` - Common CRUD operations
- `ProfileService` - User profile management
- `RequestService` - Request operations
- `ApprovalService` - Approval workflow logic
- `SupplyRequestService` - Supply request specific operations

**Real-time Updates**: Uses `RealtimeManager` for subscription-based updates when data changes.

**Database Schema**: Uses Supabase PostgreSQL with:
- Row Level Security (RLS) policies
- Audit logging triggers
- Workflow automation
- JSONB payload for flexible request types

### UI Component Architecture

**Layout System**:
- `AppLayout` wraps authenticated pages with sidebar and header
- Responsive design with mobile-first approach
- `AppSidebar` provides navigation for different user roles

**Component Library**: Uses shadcn/ui components with:
- Custom styling through CSS variables
- Theme support (light/dark mode)
- Consistent design system

**Loading States**:
- Skeleton components for better UX
- Loading components in `components/loading/`
- Promise-based loading with `React.Suspense`

### Form Handling and Validation

**React Hook Form + Zod**:
- Dynamic forms for supply requests
- Server-side validation in Server Components
- Type-safe form definitions with Zod schemas

**Dynamic Forms**:
- `useFieldArray` for dynamic item lists
- Real-time validation feedback
- Error handling at field level

### State Management Patterns

**TanStack Query**:
- All server state managed through queries and mutations
- Automatic caching and refetching
- Optimistic updates for mutations
- Stale-while-revalidate strategy

**Zustand Stores**:
- `auth-store` - User authentication state
- `profile-store` - User profile data
- `theme-store` - Theme preferences
- `layout-store` - UI layout state

### Request Workflow System

**Approval Workflow**:
- Multi-step approval process (Teacher → Department Head → Director)
- Status-driven state machine
- Email notifications for status changes
- Audit trail for all actions

**Request Types**:
- Supply requests (currently implemented)
- Extensible architecture for IT support, maintenance, etc.
- Strategy pattern implementation for different request types

### Role-Based Access Control (RBAC) Implementation

### 🔐 **Supabase Database Functions cho Role-Based Security**

Hệ thống sử dụng Supabase database functions để implement role-based access control với security cao nhất:

#### **Database Functions được tạo:**

1. **`can_user_approve()`** - Kiểm tra user có quyền approve chung
2. **`user_has_roles(allowed_roles[])`** - Kiểm tra user có role trong danh sách được phép
3. **`get_current_user_role()`** - Lấy thông tin role hiện tại của user
4. **`can_user_approve_request(request_id)`** - Kiểm tra quyền approve request cụ thể

#### **Custom Hooks:**

```tsx
// Hook để check approval permissions
import { useApprovalPermissions, useApprovalPageAccess } from '@/hooks/use-approval-permissions'

const { canApprove, currentUserRole, checkUserHasRoles } = useApprovalPermissions()
const { hasPageAccess, allowedRoles, isLoading } = useApprovalPageAccess()
```

#### **Protection Components:**

```tsx
// Full page protection
import { ApprovalGuard } from '@/components/auth/approval-guard'

<ApprovalGuard>
  <YourApprovalPage />
</ApprovalGuard>

// Conditional UI elements
import { ApprovalOnly } from '@/components/auth/approval-only'

<ApprovalOnly
  showLoading={true}
  fallback={<div>Chức năng dành cho quản lý</div>}
>
  <Button>Phê duyệt</Button>
</ApprovalOnly>
```

#### **Allowed Roles cho Approval:**
- ADMIN
- Hiệu Trưởng  
- Phó Hiệu Trưởng
- Trưởng phòng Marketing
- Trưởng phòng Nhân sự
- Giám đốc điều hành
- Giám đốc tài chính
- GĐ phòng bảo vệ và hỗ trợ trẻ em

### 🎯 **Implementation trong UI:**

1. **Sidebar Navigation** - Ẩn menu "Phê duyệt yêu cầu" nếu không có quyền
2. **Dashboard Cards** - Ẩn card "Phê duyệt yêu cầu" 
3. **Supply Requests Page** - Conditional rendering cho approval menu
4. **Approval Page** - Full page protection với beautiful error UI

### 🔧 **Security Features:**

- ✅ **Database-level security** - Functions có `SECURITY DEFINER`
- ✅ **Real-time permission validation** - Check permissions mỗi lần render
- ✅ **Graceful fallbacks** - Beautiful UI khi không có quyền
- ✅ **Loading states** - UX tốt trong lúc check permissions
- ✅ **Automatic redirect** - Redirect users khi access denied

### Development Guidelines

**Code Organization**:
- Follow the existing service pattern for new data operations
- Use Server Components for write operations
- Implement proper error handling with try/catch blocks
- Add loading states for all async operations

**Testing Strategy**:
- Unit tests for utility functions and components
- Integration tests for service classes
- E2E tests for critical user flows
- Mock Supabase operations in tests

**Security Considerations**:
- All data operations protected by RLS policies
- Server Components handle sensitive operations
- Input validation on both client and server
- Proper error handling without exposing sensitive information

### Common Development Tasks

**Adding New Request Type**:
1. Add new type to `request_types` table
2. Create Zod schema in `lib/schemas/`
3. Create service class extending `BaseService`
4. Add form component in `components/features/`
5. Update request dispatcher logic

**Creating New Page**:
1. Add page in appropriate route directory
2. Wrap in `AppLayout` for authenticated pages
3. Use appropriate hooks for data fetching
4. Implement loading and error states

**Database Changes**:
1. Create migration in Supabase dashboard
2. Update TypeScript types: `supabase gen types typescript --local > types/database.types.ts`
3. Update service classes if needed
4. Test with local development environment

### Environment Configuration

**Required Environment Variables**:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_SITE_URL` - Application URL for redirects

**Local Development**: Use `.env.local` for development environment variables.

### Supabase Integration

**Connected Project**: https://wbfbugqjkzczthqjvnwd.supabase.co

**Key Features**:
- Azure AD authentication
- Row Level Security policies
- Database triggers for audit logging
- Real-time subscriptions
- Storage integration for file uploads

### Performance Optimizations

**Next.js Features**:
- Turbopack for fast development builds
- Image optimization with `<Image>` component
- Code splitting by route
- Server Components for reduced client JavaScript

**Database Performance**:
- Proper indexing on frequently queried columns
- Query optimization with `EXPLAIN ANALYZE`
- Connection pooling in production

### Build and Deployment

**Build Process**: Uses Next.js 15 with Turbopack for optimized builds.

**Production Considerations**:
- Configure proper environment variables
- Set up monitoring for production issues
- Implement proper error logging
- Use production Supabase project