# School Request Management System - External APIs Document

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial external APIs document creation | Architect |

## External APIs

The School Request Management System integrates with external services primarily for authentication and potential future extensions.

### Supabase Auth API

- **Purpose:** Authentication service for user login and session management
- **Documentation:** https://supabase.com/docs/guides/auth
- **Base URL(s):** https://wbfbugqjkzczthqjvnwd.supabase.co/auth/v1
- **Authentication:** Azure AD integration
- **Rate Limits:** Standard Supabase limits

**Key Endpoints Used:**
- `POST /token` - User authentication
- `POST /logout` - User logout
- `GET /user` - Get current user information

**Integration Notes:** Authentication is handled through Supabase Auth with Azure AD as the identity provider. Session management is automatic with Supabase client libraries.

### Azure AD API

- **Purpose:** Identity provider for user authentication
- **Documentation:** https://learn.microsoft.com/en-us/azure/active-directory/
- **Base URL(s):** https://login.microsoftonline.com/{tenant-id}
- **Authentication:** OAuth 2.0
- **Rate Limits:** Azure AD service limits

**Key Endpoints Used:**
- `POST /oauth2/v2.0/token` - Token exchange
- `GET /openid/userinfo` - User profile information

**Integration Notes:** Azure AD is integrated with Supabase Auth as the primary identity provider. Users authenticate through Azure AD, and Supabase handles the session management.