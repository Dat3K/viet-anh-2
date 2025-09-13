# School Request Management System - Core Workflows Document

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial core workflows document creation | Architect |

## Core Workflows

The following sequence diagrams illustrate key system workflows that clarify the architecture decisions and complex interactions.

### User Authentication Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Next.js Frontend
    participant S as Supabase Auth
    participant A as Azure AD
    participant DB as Database

    U->>F: Navigate to login page
    F->>S: Initiate Azure AD login
    S->>A: Redirect to Azure AD
    A->>U: Show Azure AD login page
    U->>A: Enter credentials
    A->>S: Return authentication token
    S->>DB: Create/update user profile
    S->>F: Return user session
    F->>U: Redirect to dashboard
```

### Request Creation Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Next.js Frontend
    participant Q as TanStack Query
    participant SC as Server Component
    participant DB as Database

    U->>F: Fill request form
    F->>F: Validate form with Zod
    U->>F: Submit request
    F->>SC: Call createRequest Server Component
    SC->>DB: Insert request record
    SC->>DB: Insert request items
    SC->>DB: Set initial workflow and status
    DB->>SC: Return created request
    SC->>F: Return success response
    F->>Q: Invalidate request queries
    F->>U: Show success message
```

### Request Approval Workflow

```mermaid
sequenceDiagram
    participant U as Approver
    participant F as Next.js Frontend
    participant Q as TanStack Query
    participant SC as Server Component
    participant DB as Database

    U->>F: View pending requests
    F->>Q: Fetch requests requiring approval
    Q->>DB: Query requests with RLS
    DB->>Q: Return requests
    Q->>F: Update UI with requests
    U->>F: Select request to approve
    F->>SC: Call approveRequest Server Component
    SC->>DB: Update request status
    SC->>DB: Insert approval record
    SC->>DB: Update current step
    DB->>SC: Return updated request
    SC->>F: Return success response
    F->>Q: Invalidate request queries
    F->>U: Show success message