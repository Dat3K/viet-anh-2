# School Request Management System - Data Models Document

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial data models document creation | Architect |

## Data Models

The data models for the School Request Management System are designed to support the core functionality of request management with flexible approval workflows. The models are normalized to reduce redundancy while maintaining flexibility for different request types.

### requests

**Purpose:** Main entity representing a request made by a user that goes through an approval workflow.

**Key Attributes:**
- `id`: uuid - Primary key for the request
- `request_number`: string - Unique identifier for the request
- `title`: string - Title of the request
- `description`: string | null - Optional detailed description of the request
- `request_type_id`: string - Foreign key to request_types table to categorize requests
- `requester_id`: string - Foreign key to profiles table identifying who made the request
- `workflow_id`: uuid | null - Foreign key to approval_workflows table for the approval process
- `current_step_id`: uuid | null - Foreign key to approval_steps table indicating current approval step
- `status`: string | null - Current status of the request (pending, approved, rejected, completed, cancelled)
- `priority`: string | null - Priority level (low, medium, high, urgent)
- `payload`: Json | null - Flexible JSON field to store type-specific data
- `requested_date`: string | null - Date when the request was made
- `due_date`: string | null - Optional due date for the request
- `completed_at`: string | null - Timestamp when the request was completed
- `created_at`: string | null - Record creation timestamp
- `updated_at`: string | null - Record update timestamp

**Relationships:**
- Belongs to one profile (requester)
- Belongs to one request_type
- Belongs to one approval_workflow (optional)
- Belongs to one approval_step (current step, optional)
- Has many request_items
- Has many request_approvals

### request_items

**Purpose:** Represents individual items within a request, allowing requests to contain multiple items.

**Key Attributes:**
- `id`: uuid - Primary key for the request item
- `request_id`: uuid - Foreign key to requests table
- `item_name`: string - Name of the item
- `description`: string | null - Optional description of the item
- `quantity`: number | null - Quantity requested
- `unit`: string | null - Unit of measurement
- `created_at`: string | null - Record creation timestamp
- `updated_at`: string | null - Record update timestamp

**Relationships:**
- Belongs to one request

### profiles

**Purpose:** Stores user profile information including their role and department assignments.

**Key Attributes:**
- `id`: uuid - Primary key, also the user's ID from authentication
- `employee_code`: string | null - Unique employee identifier
- `full_name`: string - Full name of the user
- `email`: string - Email address
- `phone`: string | null - Phone number
- `role_id`: uuid | null - Foreign key to roles table
- `is_active`: boolean | null - Whether the profile is active
- `created_at`: string | null - Record creation timestamp
- `updated_at`: string | null - Record update timestamp

**Relationships:**
- Belongs to one role (optional)
- Has many requests (as requester)
- Has many request_approvals (as approver)

### approval_workflows

**Purpose:** Defines approval workflows that can be associated with request types.

**Key Attributes:**
- `id`: uuid - Primary key for the workflow
- `name`: string - Name of the workflow
- `description`: string | null - Optional description
- `request_type_id`: uuid - Foreign key to request_types table
- `role_id`: uuid | null - Optional foreign key to roles table
- `is_active`: boolean | null - Whether the workflow is active
- `created_at`: string | null - Record creation timestamp
- `updated_at`: string | null - Record update timestamp

**Relationships:**
- Belongs to one request_type
- Belongs to one role (optional)
- Has many approval_steps

### approval_steps

**Purpose:** Defines individual steps within an approval workflow.

**Key Attributes:**
- `id`: uuid - Primary key for the step
- `workflow_id`: uuid - Foreign key to approval_workflows table
- `step_order`: number - Order of the step in the workflow
- `step_name`: string - Descriptive name for the step
- `approver_role_id`: uuid | null - Optional foreign key to roles table for role-based approval
- `approver_employee_id`: uuid | null - Optional foreign key to profiles table for specific user approval
- `is_required`: boolean | null - Whether the step is required
- `created_at`: string | null - Record creation timestamp

**Relationships:**
- Belongs to one approval_workflow
- Belongs to one role (approver role, optional)
- Belongs to one profile (specific approver, optional)
- Has many request_approvals

### request_approvals

**Purpose:** Tracks the approval status of requests at each step of their workflow.

**Key Attributes:**
- `id`: uuid - Primary key for the approval record
- `request_id`: uuid - Foreign key to requests table
- `step_id`: uuid - Foreign key to approval_steps table
- `approver_id`: uuid - Foreign key to profiles table (who approved/rejected)
- `status`: string - Approval status (pending, approved, rejected)
- `comments`: string | null - Optional comments from the approver
- `approved_at`: string | null - Timestamp when the approval occurred
- `created_at`: string | null - Record creation timestamp

**Relationships:**
- Belongs to one request
- Belongs to one approval_step
- Belongs to one profile (approver)

### audit_logs

**Purpose:** Maintains a complete audit trail of all request activities for compliance and troubleshooting.

**Key Attributes:**
- `id`: uuid - Primary key for the audit log entry
- `table_name`: string - Name of the table affected
- `record_id`: string - ID of the affected record
- `action`: string - Action performed (INSERT, UPDATE, DELETE)
- `old_values`: Json | null - Previous values before the change
- `new_values`: Json | null - New values after the change
- `changed_by`: uuid | null - Foreign key to profiles table (who made the change)
- `changed_at`: string | null - Timestamp when the change occurred

**Relationships:**
- Belongs to one profile (changer, optional)

### departments

**Purpose:** Organizes users into departments for role-based access control.

**Key Attributes:**
- `id`: uuid - Primary key for the department
- `name`: string - Name of the department
- `code`: string | null - Optional department code
- `description`: string | null - Optional description
- `is_active`: boolean | null - Whether the department is active
- `created_at`: string | null - Record creation timestamp
- `updated_at`: string | null - Record update timestamp

**Relationships:**
- Has many roles

### roles

**Purpose:** Defines user roles with optional department associations and hierarchical relationships.

**Key Attributes:**
- `id`: uuid - Primary key for the role
- `name`: string - Name of the role
- `department_id`: uuid | null - Optional foreign key to departments table
- `is_active`: boolean | null - Whether the role is active
- `created_at`: string | null - Record creation timestamp
- `updated_at`: string | null - Record update timestamp
- `parent_role`: uuid | null - Optional foreign key to roles table for hierarchical relationships

**Relationships:**
- Belongs to one department (optional)
- Belongs to one role (parent role, optional)
- Has many profiles
- Has many approval_workflows (optional)
- Has many approval_steps (as approver role, optional)

### request_types

**Purpose:** Categorizes different types of requests supported by the system.

**Key Attributes:**
- `id`: uuid - Primary key for the request type
- `name`: string - Internal name for the request type
- `display_name`: string - User-friendly display name
- `description`: string | null - Optional description
- `is_active`: boolean | null - Whether the request type is active
- `created_at`: string | null - Record creation timestamp

**Relationships:**
- Has many requests
- Has many approval_workflows