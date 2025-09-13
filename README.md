# School Request Management System - Technical Documentation

## Project Overview

This is a School Request Management System built with Next.js 15 and Supabase. The system allows teachers to create requests, which then go through an approval workflow involving department heads and directors.

## Architecture

### High-Level Architecture

```mermaid
graph TD
    subgraph "User (Browser)"
        A[User: Teacher / Department Head / Director]
    end

    subgraph "Next.js Application (Vercel / Self-hosted)"
        B(Next.js Frontend - App Router)
        C(Next.js Server Components)
        D(Supabase JS Client)
        E(Middleware for Auth)
    end

    subgraph "Supabase Platform (Cloud)"
        F[Supabase Auth (only Azure AD)]
        G[PostgreSQL Database]
        H[Row Level Security - RLS]
        I[Database Functions & Triggers]
        J[Supabase Storage]
    end

    A -- HTTPS --> B
    B -- "Queries" --> D
    B -- "Mutations" --> C
    C -- "Admin Client" --> G
    C -- "Functions" --> I
    D -- "Secure Communication" --> F
    D -- "Data Queries (via PostgREST)" --> G
    G -- "Policy Enforcement" --> H
    G -- "Trigger Activation" --> I
    C -- "File Upload" --> J
```

### Modular Design Approach

The system is designed around common entities (`requests`, `workflows`) to ensure extensibility:

*   **Core Engine:** The `requests` table and related `workflows` tables form the heart of the system. The `requests` table has a `request_type` column to differentiate request types and a `payload` column (JSONB type) to contain type-specific data.
*   **Plug-in Module (Example: "IT Support Request"):**
    1.  **DB Configuration:** Add a new value, e.g., `it_support`, to the `request_types` table.
    2.  **Workflow Definition:** Admin creates a new workflow in the admin interface and assigns it to the `it_support` type.
    3.  **Frontend Component:** Create a new form component, e.g., `ITSupportRequestForm.tsx`, to collect specific information (e.g., "Issue Description", "Device Code").
    4.  **Server Component:** Create a new Server Component to handle writing data from the form into the `payload` column of the `requests` table.
    5.  **Strategy Pattern:** A "dispatcher" on the frontend will render the correct form based on `request_type` (e.g., `SupplyRequestForm` or `ITSupportRequestForm`).

This approach ensures that adding new request types doesn't require changes to the core architecture, only the addition of new independent components.

## Database Schema

The system uses a PostgreSQL database hosted on Supabase with the following key tables:

### Core Tables

1. **requests** - Main requests table
   - `id` (uuid) - Primary key
   - `request_number` (string) - Unique request identifier
   - `title` (string) - Request title
   - `description` (string | null) - Request description
   - `request_type_id` (string) - Foreign key to request_types
   - `requester_id` (string) - Foreign key to profiles
   - `workflow_id` (uuid | null) - Foreign key to approval_workflows
   - `current_step_id` (uuid | null) - Foreign key to approval_steps
   - `status` (string | null) - Request status
   - `priority` (string | null) - Request priority
   - `payload` (Json | null) - Type-specific data
   - `requested_date` (string | null) - Date request was made
   - `due_date` (string | null) - Due date for request
   - `completed_at` (string | null) - When request was completed
   - `created_at` (string | null) - Record creation timestamp
   - `updated_at` (string | null) - Record update timestamp

2. **request_items** - Items within requests
   - `id` (uuid) - Primary key
   - `request_id` (uuid) - Foreign key to requests
   - `item_name` (string) - Name of the item
   - `description` (string | null) - Item description
   - `quantity` (number | null) - Quantity requested
   - `unit` (string | null) - Unit of measurement
   - `created_at` (string | null) - Record creation timestamp
   - `updated_at` (string | null) - Record update timestamp

3. **profiles** - User profiles
   - `id` (uuid) - Primary key
   - `employee_code` (string | null) - Employee identification code
   - `full_name` (string) - Full name of user
   - `email` (string) - Email address
   - `phone` (string | null) - Phone number
   - `role_id` (uuid | null) - Foreign key to roles
   - `is_active` (boolean | null) - Whether profile is active
   - `created_at` (string | null) - Record creation timestamp
   - `updated_at` (string | null) - Record update timestamp

4. **approval_workflows** - Approval workflows
   - `id` (uuid) - Primary key
   - `name` (string) - Workflow name
   - `description` (string | null) - Workflow description
   - `request_type_id` (uuid) - Foreign key to request_types
   - `role_id` (uuid | null) - Foreign key to roles (optional)
   - `is_active` (boolean | null) - Whether workflow is active
   - `created_at` (string | null) - Record creation timestamp
   - `updated_at` (string | null) - Record update timestamp

5. **approval_steps** - Steps in approval workflows
   - `id` (uuid) - Primary key
   - `workflow_id` (uuid) - Foreign key to approval_workflows
   - `step_order` (number) - Order of step in workflow
   - `step_name` (string) - Name of step
   - `approver_role_id` (uuid | null) - Foreign key to roles (optional)
   - `approver_employee_id` (uuid | null) - Foreign key to profiles (optional)
   - `is_required` (boolean | null) - Whether step is required
   - `created_at` (string | null) - Record creation timestamp

6. **request_approvals** - Approval records
   - `id` (uuid) - Primary key
   - `request_id` (uuid) - Foreign key to requests
   - `step_id` (uuid) - Foreign key to approval_steps
   - `approver_id` (uuid) - Foreign key to profiles
   - `status` (string) - Approval status
   - `comments` (string | null) - Approval comments
   - `approved_at` (string | null) - When approval occurred
   - `created_at` (string | null) - Record creation timestamp

7. **audit_logs** - Audit trail
   - `id` (uuid) - Primary key
   - `table_name` (string) - Name of table affected
   - `record_id` (string) - ID of affected record
   - `action` (string) - Action performed (INSERT, UPDATE, DELETE)
   - `old_values` (Json | null) - Previous values
   - `new_values` (Json | null) - New values
   - `changed_by` (uuid | null) - Foreign key to profiles
   - `changed_at` (string | null) - When change occurred

8. **departments** - School departments
   - `id` (uuid) - Primary key
   - `name` (string) - Department name
   - `code` (string | null) - Department code
   - `description` (string | null) - Department description
   - `is_active` (boolean | null) - Whether department is active
   - `created_at` (string | null) - Record creation timestamp
   - `updated_at` (string | null) - Record update timestamp

9. **roles** - User roles
   - `id` (uuid) - Primary key
   - `name` (string) - Role name
   - `department_id` (uuid | null) - Foreign key to departments (optional)
   - `is_active` (boolean | null) - Whether role is active
   - `created_at` (string | null) - Record creation timestamp
   - `updated_at` (string | null) - Record update timestamp
   - `parent_role` (uuid | null) - Foreign key to roles (optional)

10. **request_types** - Types of requests
    - `id` (uuid) - Primary key
    - `name` (string) - Type name (internal)
    - `display_name` (string) - Display name
    - `description` (string | null) - Type description
    - `is_active` (boolean | null) - Whether type is active
    - `created_at` (string | null) - Record creation timestamp

## API Layer and Data Flow

We use Next.js Server Components instead of traditional REST APIs to simplify the architecture.

### Key Server Components

Server Components handle all write/change operations (create, approve, reject requests). They run safely on the server and can directly call Supabase with admin privileges (with strict authorization checks in code) to execute complex business logic.

## Frontend Design with Next.js

### Project Structure

```
/
├── app/
│   ├── (auth)/             # Routes for login, signup
│   ├── (admin)/            # Routes for admin
│   ├── (main)/             # Main layout after login
│   │   ├── requests/
│   │   │   ├── actions.tsx  
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx      # Request detail page
│   │   ├── new/
│   │   │   └── page.tsx      # New request page
│   │   ├── page.tsx          # Requests list page
│   │   └── layout.tsx            # Main layout after login
│   └── page.tsx      # Home page
├── components/
│   ├── ui/                   # Components from shadcn/ui
│   ├── shared/               # Shared components (Navbar, Sidebar, StatusBadge)
│   └── features/             # Feature-specific components
│       └── requests/
│           ├── RequestForm.tsx
│           ├── RequestList.tsx
│           └── ApprovalHistory.tsx
├── lib/
│   ├── query-client.ts         # TanStack Query configuration
│   └── utils.ts              # Utility functions
├── hooks/
│   └── use-auth.ts           # Custom hook for user info and role
├── stores/
│   └── auth-store.ts         # Zustand store
├── types/
│   └── database.types.ts     # Supabase-generated types
│   └── index.ts              # TypeScript definitions
```

### State Management

*   **Zustand:** Used for global state not related to the server, such as:
    *   Logged-in user information (`user`, `profile`, `role`).
    *   UI state (sidebar open/closed).
*   **TanStack Query:** Manages ALL server state.
    *   `useQuery` to fetch request lists, request details, history.
    *   `useMutation` to call Server Components. Automatically handles `isLoading`, `isError` and refetching data after successful mutations.

### Form Handling (React Hook Form & Zod)

Example for dynamic request form:

```tsx
'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// ... import UI components from shadcn/ui

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  items: z.array(z.object({
    itemName: z.string().min(1, "Item name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unit: z.string().min(1, "Unit is required"),
    description: z.string().optional(),
  })).min(1, "At least one item is required"),
});

export function RequestForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      items: [{ itemName: '', quantity: 1, unit: '' }] 
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Call Server Component to create request
    // Handle result (show toast, redirect, ...)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Request title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name={`items.${index}.itemName`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`items.${index}.quantity`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="number" placeholder="Quantity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`items.${index}.unit`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Unit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="destructive" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}

        <Button type="button" onClick={() => append({ itemName: '', quantity: 1, unit: '' })}>
          Add Item
        </Button>
        <Button type="submit">Submit Request</Button>
      </form>
    </Form>
  );
}
```

## Authentication and Authorization

*   **Authentication:**
    *   Uses Supabase Auth UI or custom components for login/registration.
    *   Next.js Middleware protects routes in `(dashboard)`, redirecting unauthenticated users to the login page.
*   **Authorization (RBAC):**
    *   **Backend:** RLS is the primary defense, ensuring no data leakage.
    *   **Frontend:**
        1. After login, fetch user `profile` and `role`, storing in Zustand store.
        2.  Use this role to show/hide UI components. Example:
            ```tsx
            const { role } = useUserStore();
            // ...
            {role === 'Director' && <AdminMenu />}
            {isApproverForThisRequest && <ApproveButton />}
            ```

## Design Patterns Applied

*   **Strategy:** Used to handle different request types. There will be an `IRequestStrategy` interface with methods like `renderForm()`, `validatePayload()`, `processSubmission()`. Concrete classes like `SupplyRequestStrategy`, `ITSupportStrategy` will implement this interface.
*   **Factory:** `RequestStrategyFactory` will create instances of the appropriate strategy based on `request_type`.
*   **State:** The approval workflow is managed as a Finite State Machine. The request's `status` determines which actions can be performed (e.g., can only `approve` when in `PENDING_APPROVAL` status).
*   **Chain of Responsibility:** Also applicable to the approval workflow. Each approval step is a `handler` in the chain. When a handler processes (approves), it passes the request to the next handler.
*   **Observer:** TanStack Query and Zustand operate on the Observer pattern. Components "subscribe" to data changes and automatically re-render when updates occur.
*   **Role-Based Access Control (RBAC):** Detailed above.

## Testing Strategy

*   **Unit Testing (Jest):**
    *   Test utility functions in `lib/utils.ts`.
    *   Test Zod schemas.
    *   Test simple UI components with React Testing Library (e.g., `StatusBadge` displaying correct colors for each status).
*   **Integration Testing (Playwright):**
    *   Test Server Components, mocking Supabase calls to verify business logic.
    *   Test `RequestForm` component to ensure validation works correctly and calls `onSubmit` with accurate data.
*   **End-to-End Testing (Playwright):**
    *   **Scenario 1 (Happy Path):** Login as Teacher -> Successfully create request -> Logout -> Login as Department Head -> See request -> Approve request -> Logout -> Login as Director -> See request -> Final approval -> Request status changes to 'Approved'.
    *   **Scenario 2 (Authorization):** Login as Teacher B, attempt to access Teacher A's request detail URL -> Access denied.
    *   **Scenario 3 (Rejection):** Department Head rejects request -> Request status changes to 'Rejected'.

## Deployment and DevOps

*   **Containerization:**
    *   Create `Dockerfile` to build the Next.js application into an optimized image.
    *   `docker-compose.yml` to run the local development environment, simulating the Supabase environment.
*   **CI/CD Pipeline (GitHub Actions):**
    *   **Trigger:** `on: push` (to `main` branch) or `on: pull_request`.
    *   **Jobs:**
        1.  `lint-and-test`: Run ESLint, Prettier, and all tests (unit, integration).
        2.  `build`: Run `docker build` to create image and push to a container registry (Docker Hub, AWS ECR, GCP GCR).
        3.  `deploy`:
            *   **If using Vercel:** Connect GitHub repo with Vercel, deployment will be automatic.
            *   **If self-hosting (AWS ECS/GCP Cloud Run):** This job will update the service to pull the latest image and restart the container.
*   **Infrastructure as Code (IaC):**
    *   Use Terraform to manage Supabase project configurations (if Supabase provides a Terraform provider) or other cloud resources (VPC, cluster, database...). This ensures staging and production environments are consistent.

## Monitoring and Logging

*   **Logging:**
    *   Use **Pino** for high performance.
    *   In Server Components, wrap logic in `try...catch` and log detailed errors, including `userId` and `requestId` for easy tracing.
    *   Integrate a centralized log collection service like **Sentry**, **Datadog** or **Logtail**. Send logs from backend and frontend errors to these services.
*   **Monitoring:**
    *   **Sentry:** Excellent for frontend and backend error monitoring, as well as performance monitoring.
    *   **Vercel Analytics:** If deployed on Vercel, leverage the built-in analytics tool.
    *   **Prometheus/Grafana (if self-hosting):** Install exporters to monitor container resources (CPU, memory) and application metrics (request count, API response time).
*   **Alerting:** Configure Sentry or Alertmanager (with Prometheus) to send alerts (via Slack, email) when there's a sudden increase in errors or when performance metrics exceed thresholds.

## Security Considerations

*   **RLS:** Fundamental, cannot be overlooked.
*   **Input Validation:** Use Zod on both client (React Hook Form) and server (Server Components) to ensure data is always valid.
*   **XSS (Cross-Site Scripting):** React/Next.js automatically escapes rendered content, reducing risk. Be careful when using `dangerouslySetInnerHTML`.
*   **CSRF (Cross-Site Request Forgery):** Next.js Server Components have built-in CSRF protection.
*   **Secret Management:** Use environment variables (`.env.local` for local, and deployment platform environment variables for production). Never hardcode API keys or JWT secrets in code.
*   **CORS:** Configure CORS strictly if API routes need to be called from a different domain.
*   **Rate Limiting:** Apply rate limiting to sensitive API routes or Server Components to prevent brute-force attacks.

## Performance Optimization

*   **Next.js Features:**
    *   **Code Splitting:** Automatic per page (route).
    *   **Lazy Loading:** Use `next/dynamic` to load heavy or unnecessary components initially.
    *   **Image Optimization:** Always use the `<Image>` component from `next/image`.
*   **Caching:**
    *   Leverage TanStack Query caching to reduce database calls.
    *   Use `revalidatePath` or `revalidateTag` from Next.js to intelligently refresh cache after data changes.
*   **Database:**
    *   Ensure necessary indexes are created for columns frequently used in `WHERE` and `JOIN` clauses.
    *   Use `EXPLAIN ANALYZE` to analyze complex queries.
*   **CDN:** Using platforms like Vercel or Cloudflare will automatically distribute static assets (JS, CSS) through a global CDN.

## Maintainability and Documentation

*   **Code Quality:**
    *   Set up ESLint and Prettier and integrate into CI pipeline to ensure consistent code style.
    *   Use TypeScript strictly.
    *   Break down components and functions to follow the Single Responsibility Principle.
*   **Documentation:**
    *   **Code Comments:** Use JSDoc for complex functions and components.
    *   **README.md:** Provide project installation guide, local running instructions, and description of necessary environment variables.
    *   **Architectural Decision Records (ADRs):** Create a `docs/adr` directory to record important architectural decisions and the reasoning behind them. Example: "Why choose Server Components over API Routes".
    *   **API Documentation:** Although we use Server Components, if any API routes are created, use Swagger/OpenAPI to automatically generate documentation.
    *   **Storybook:** Use Storybook to develop and document UI components independently.

## Current Implementation Status

The project currently includes:

1. Basic frontend pages for:
   - Dashboard
   - Requests management
   - Admin interface

2. Database schema with:
   - Requests and items
   - User profiles and roles
   - Departments
   - Approval workflows and steps
   - Request types
   - Audit logs

3. Core dependencies:
   - Next.js 15 with App Router
   - Supabase JavaScript client
   - TanStack Query for data fetching
   - React Hook Form with Zod for form validation
   - shadcn/ui components
   - Zustand for state management

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

The project follows a standard Next.js 15 App Router structure with:

- `app/` - Contains all pages and layouts
- `components/` - Reusable UI components
- `lib/` - Utility functions and configurations
- `types/` - TypeScript type definitions
- `hooks/` - Custom React hooks
- `stores/` - Zustand stores for state management

## Supabase Integration

The project is connected to a Supabase project with the URL: https://wbfbugqjkzczthqjvnwd.supabase.co

Key features implemented:
- Row Level Security (RLS) policies
- Database triggers for workflow automation
- Audit logging
- Request approval workflows
- User profiles and role-based access control

## Development Guidelines

1. All new features should include appropriate tests
2. Follow the existing code style and patterns
3. Use TypeScript for type safety
4. Write clear, descriptive commit messages
5. Update documentation when making significant changes