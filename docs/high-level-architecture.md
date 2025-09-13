# School Request Management System - High Level Architecture Document

## Introduction

This document outlines the overall project architecture for School Request Management System, including backend systems, shared services, and non-UI specific concerns. Its primary goal is to serve as the guiding architectural blueprint for AI-driven development, ensuring consistency and adherence to chosen patterns and technologies.

**Relationship to Frontend Architecture:**
If the project includes a significant user interface, a separate Frontend Architecture Document will detail the frontend-specific design and MUST be used in conjunction with this document. Core technology stack choices documented herein (see "Tech Stack") are definitive for the entire project, including any frontend components.

### Starter Template or Existing Project

N/A

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial high level architecture document creation | Architect |

## Technical Summary

The School Request Management System is built using a modern web architecture with Next.js 15 as the frontend framework and Supabase as the backend platform. The system implements a monolithic architecture hosted on Vercel with Supabase providing database, authentication, and real-time functionality. The architecture supports a flexible approval workflow system with role-based access control, enabling different types of requests to be processed through configurable workflows. Core architectural patterns include Server Components for data mutations, Row Level Security for data isolation, and a modular design approach for extensibility. This architecture directly supports the PRD goals of streamlining request processes, implementing flexible workflows, and ensuring data security.

## High Level Overview

The system follows a monolithic architecture style with a monorepo repository structure as specified in the PRD. The service architecture uses a single application deployed on Vercel that communicates with Supabase for all backend services. User interactions flow through the Next.js frontend, with Server Components handling data mutations and Supabase client handling queries. The system leverages Supabase's Row Level Security for data protection and database triggers for workflow automation. Key architectural decisions include using Next.js Server Components instead of traditional REST APIs for simplified data flow, and implementing a modular design approach that allows for easy addition of new request types without major architectural changes.

## High Level Project Diagram

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

## Architectural and Design Patterns

- **Server Components Pattern:** Using Next.js Server Components for data mutations - _Rationale:_ Simplifies architecture by eliminating need for separate REST API layer and provides better security through direct database access with authorization checks in code
- **Repository Pattern:** Abstract data access logic through Supabase client - _Rationale:_ Enables testing and provides a clean separation between business logic and data access
- **Strategy Pattern:** Using request type-based form rendering - _Rationale:_ Supports the modular design approach for different request types while maintaining a consistent core engine
- **Chain of Responsibility Pattern:** Approval workflow steps form a chain - _Rationale:_ Matches the PRD requirement for sequential approval processing with each step passing the request to the next approver
- **Observer Pattern:** TanStack Query and Zustand for state management - _Rationale:_ Provides automatic UI updates when data changes and efficient state management across components