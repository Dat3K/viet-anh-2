# School Request Management System - Database Schema Document

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-13 | 1.0 | Initial database schema document creation | Architect |

## Database Schema

The database schema is implemented in PostgreSQL and designed to support all the functionality described in the PRD. The schema uses UUIDs as primary keys for scalability and security, and includes appropriate indexes for performance.

### PostgreSQL Schema Definition

```sql
-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    parent_role UUID REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    employee_code VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request types table
CREATE TABLE request_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval workflows table
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    request_type_id UUID NOT NULL REFERENCES request_types(id),
    role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approval steps table
CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(255) NOT NULL,
    approver_role_id UUID REFERENCES roles(id),
    approver_employee_id UUID REFERENCES profiles(id),
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requests table
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    request_type_id UUID NOT NULL REFERENCES request_types(id),
    requester_id UUID NOT NULL REFERENCES profiles(id),
    workflow_id UUID REFERENCES approval_workflows(id),
    current_step_id UUID REFERENCES approval_steps(id),
    status VARCHAR(50) CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    payload JSONB,
    requested_date DATE,
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request items table
CREATE TABLE request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity INTEGER,
    unit VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request approvals table
CREATE TABLE request_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES approval_steps(id),
    approver_id UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(50) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_requests_requester_id ON requests(requester_id);
CREATE INDEX idx_requests_request_type_id ON requests(request_type_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_workflow_id ON requests(workflow_id);
CREATE INDEX idx_requests_current_step_id ON requests(current_step_id);
CREATE INDEX idx_request_items_request_id ON request_items(request_id);
CREATE INDEX idx_request_approvals_request_id ON request_approvals(request_id);
CREATE INDEX idx_request_approvals_step_id ON request_approvals(step_id);
CREATE INDEX idx_request_approvals_approver_id ON request_approvals(approver_id);
CREATE INDEX idx_approval_steps_workflow_id ON approval_steps(workflow_id);
CREATE INDEX idx_approval_steps_approver_role_id ON approval_steps(approver_role_id);
CREATE INDEX idx_approval_steps_approver_employee_id ON approval_steps(approver_employee_id);
CREATE INDEX idx_approval_workflows_request_type_id ON approval_workflows(request_type_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_roles_department_id ON roles(department_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_changed_by ON audit_logs(changed_by);