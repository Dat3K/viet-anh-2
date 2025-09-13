# School Request Management System - Coding Standards Document

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial coding standards document creation | Architect |

## Coding Standards

These coding standards are mandatory for all AI agents and human developers working on the project.

### Core Standards

- **Languages & Runtimes:** TypeScript 5.3.3, Node.js 20.11.0
- **Style & Linting:** ESLint with Next.js and TypeScript plugins
- **Test Organization:** Tests colocated with implementation files

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | RequestForm |
| Functions | camelCase | handleSubmit |
| Variables | camelCase | requestData |
| Constants | UPPER_SNAKE_CASE | MAX_RETRY_ATTEMPTS |
| Interfaces | PascalCase with I prefix | IRequestData |
| Types | PascalCase | UserData |

### Critical Rules

- **Never use console.log in production code** - use logger instead
- **All API responses must use standardized response format** - { success: boolean, data?: T, error?: string }
- **Database queries must use repository pattern** - never direct ORM in business logic
- **Environment variables must be validated at startup** - use Zod for validation
- **All user inputs must be validated and sanitized** - use Zod schemas
- **Sensitive data must never be logged** - filter PII from logs
- **Error messages must not expose internal details** - user-friendly messages only