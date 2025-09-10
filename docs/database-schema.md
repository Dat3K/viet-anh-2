# Database Schema - Trường Việt Anh Request Management System

## Overview
Hệ thống quản lý yêu cầu linh hoạt cho trường Việt Anh với workflow phê duyệt đa cấp động.

## Core Tables

### 1. departments
Quản lý các phòng ban trong trường.

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    code VARCHAR UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. positions  
Quản lý các vị trí công việc với hierarchy levels.

```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    code VARCHAR UNIQUE,
    level INTEGER NOT NULL,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. profiles
Mở rộng auth.users với thông tin tổ chức và role system.

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    employee_code VARCHAR UNIQUE,
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    phone VARCHAR,
    position_id UUID REFERENCES positions(id),
    department_id UUID REFERENCES departments(id),
    manager_id UUID REFERENCES profiles(id),
    role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. request_types
Định nghĩa các loại yêu cầu.

```sql
CREATE TABLE request_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    display_name VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. approval_workflows
Định nghĩa workflow phê duyệt cho từng position/request_type.

```sql
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    request_type_id UUID NOT NULL REFERENCES request_types(id),
    position_id UUID REFERENCES positions(id),
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. approval_steps
Các bước phê duyệt trong workflow (unlimited steps).

```sql
CREATE TABLE approval_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
    step_order INTEGER NOT NULL,
    step_name VARCHAR NOT NULL,
    approver_position_id UUID REFERENCES positions(id),
    approver_employee_id UUID REFERENCES profiles(id),
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(workflow_id, step_order)
);
```

### 7. supply_requests
Bảng chính lưu trữ các yêu cầu (renamed từ requests).

```sql
CREATE TABLE supply_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR UNIQUE,
    title VARCHAR NOT NULL,
    description TEXT,
    request_type_id UUID NOT NULL REFERENCES request_types(id),
    requester_id UUID NOT NULL REFERENCES profiles(id),
    workflow_id UUID REFERENCES approval_workflows(id),
    current_step_id UUID REFERENCES approval_steps(id),
    status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'approved', 'rejected', 'cancelled')),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 8. supply_request_items
Chi tiết items trong yêu cầu (renamed từ request_items).

```sql
CREATE TABLE supply_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supply_request_id UUID NOT NULL REFERENCES supply_requests(id),
    item_name VARCHAR NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Indexes và Triggers

```sql
-- Indexes để tối ưu hiệu suất
CREATE INDEX idx_profiles_position ON profiles(position_id);
CREATE INDEX idx_profiles_department ON profiles(department_id);
CREATE INDEX idx_profiles_manager ON profiles(manager_id);
CREATE INDEX idx_approval_workflows_request_type ON approval_workflows(request_type_id);
CREATE INDEX idx_approval_workflows_position ON approval_workflows(position_id);
CREATE INDEX idx_approval_workflows_department ON approval_workflows(department_id);
CREATE INDEX idx_approval_steps_workflow ON approval_steps(workflow_id);
CREATE INDEX idx_approval_steps_order ON approval_steps(workflow_id, step_order);
CREATE INDEX idx_supply_requests_requester ON supply_requests(requester_id);
CREATE INDEX idx_supply_requests_status ON supply_requests(status);
CREATE INDEX idx_supply_requests_type ON supply_requests(request_type_id);
CREATE INDEX idx_supply_requests_workflow ON supply_requests(workflow_id);
CREATE INDEX idx_supply_request_items_request ON supply_request_items(supply_request_id);
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- Function tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers cho các bảng
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON approval_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_steps_updated_at BEFORE UPDATE ON approval_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supply_requests_updated_at BEFORE UPDATE ON supply_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supply_request_items_updated_at BEFORE UPDATE ON supply_request_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Functions Nâng cao

```sql
-- Function khởi tạo workflow tự động
CREATE OR REPLACE FUNCTION initialize_request_workflow()
RETURNS TRIGGER AS $$
DECLARE
    workflow_id UUID;
    first_step_id UUID;
    requester_position_id UUID;
    requester_department_id UUID;
BEGIN
    SELECT position_id, department_id INTO requester_position_id, requester_department_id
    FROM profiles WHERE id = NEW.requester_id;
    
    SELECT aw.id INTO workflow_id
    FROM approval_workflows aw
    WHERE aw.request_type_id = NEW.request_type_id 
    AND aw.is_active = true
    AND (
        aw.position_id = requester_position_id OR 
        (aw.position_id IS NULL AND aw.department_id = requester_department_id)
    )
    ORDER BY (CASE WHEN aw.position_id IS NOT NULL THEN 1 ELSE 2 END)
    LIMIT 1;
    
    SELECT id INTO first_step_id
    FROM approval_steps
    WHERE workflow_id = workflow_id
    ORDER BY step_order ASC
    LIMIT 1;
    
    NEW.workflow_id := workflow_id;
    NEW.current_step_id := first_step_id;
    
    IF NEW.submitted_at IS NOT NULL THEN
        NEW.status := 'pending';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_request_workflow_init
BEFORE INSERT OR UPDATE ON supply_requests
FOR EACH ROW EXECUTE FUNCTION initialize_request_workflow();

-- Function ghi audit log
CREATE OR REPLACE FUNCTION log_request_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (request_id, user_id, action, entity_type, entity_id, new_values, change_summary)
        VALUES (NEW.id, NEW.requester_id, 'CREATE', 'request', NEW.id, to_jsonb(NEW), 'Request created');
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (request_id, user_id, action, entity_type, entity_id, old_values, new_values, change_summary)
        VALUES (NEW.id, NEW.requester_id, 'UPDATE', 'request', NEW.id, to_jsonb(OLD), to_jsonb(NEW), 'Request updated');
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_request_changes_trigger
AFTER INSERT OR UPDATE ON supply_requests
FOR EACH ROW EXECUTE FUNCTION log_request_changes();
```

## RLS Policies

```sql
-- Bật RLS cho các bảng
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies cho profiles
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Policies cho supply_requests
CREATE POLICY "Requesters can view their own requests"
ON supply_requests FOR SELECT
USING (auth.uid() = requester_id);

CREATE POLICY "Approvers can view requests at their step"
ON supply_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM approval_steps ast
        JOIN profiles p ON (
            (ast.approver_position_id IS NOT NULL AND p.position_id = ast.approver_position_id) OR
            (ast.approver_employee_id IS NOT NULL AND p.id = ast.approver_employee_id)
        )
        WHERE p.id = auth.uid()
        AND ast.id = supply_requests.current_step_id
    )
);

CREATE POLICY "Managers can view subordinate requests"
ON supply_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles p_manager
        JOIN profiles p_requester ON p_requester.manager_id = p_manager.id
        WHERE p_manager.id = auth.uid()
        AND p_requester.id = supply_requests.requester_id
    )
);

CREATE POLICY "Approvers can update requests at their step"
ON supply_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM approval_steps ast
        JOIN profiles p ON (
            (ast.approver_position_id IS NOT NULL AND p.position_id = ast.approver_position_id) OR
            (ast.approver_employee_id IS NOT NULL AND p.id = ast.approver_employee_id)
        )
        WHERE p.id = auth.uid()
        AND ast.id = supply_requests.current_step_id
        AND ast.can_edit = true
    )
);

-- Policies cho supply_request_items
CREATE POLICY "Users can view items of accessible requests"
ON supply_request_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM supply_requests r
        WHERE r.id = supply_request_items.supply_request_id
    )
);

-- Policies cho audit_logs
CREATE POLICY "Users can view audit logs of accessible requests"
ON audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM supply_requests r
        WHERE r.id = audit_logs.request_id
    )
);
```

## Dữ liệu Mẫu

```sql
-- Khởi tạo departments
INSERT INTO departments (name, code, description) VALUES
('BAN GIÁM HIỆU', 'BGH', 'Ban Giám hiệu nhà trường'),
('QUẢN LÝ/TP', 'QL_TP', 'Các trưởng phòng và quản lý cấp trung'),
('Bộ phận Tài Xế', 'TAI_XE', 'Bộ phận tài xế'),
('Bộ Phận Bảo Trì', 'BAO_TRI', 'Bộ phận bảo trì cơ sở vật chất'),
('Bộ phận Kế Toán', 'KE_TOAN', 'Bộ phận kế toán và tài chính'),
('Bộ phận Học Vụ', 'HOC_VU', 'Bộ phận học vụ'),
('Tổ Giám Thị', 'GIAM_THI', 'Tổ giám thị'),
('Bộ phận Marketing', 'MARKETING', 'Bộ phận marketing và truyền thông');

-- Khởi tạo positions
INSERT INTO positions (name, code, level, department_id) VALUES
('Chủ tịch HĐQT', 'CHU_TICH', 1, (SELECT id FROM departments WHERE code = 'BGH')),
('Giám đốc điều hành', 'GD_DIEU_HANH', 2, (SELECT id FROM departments WHERE code = 'BGH')),
('Giám đốc tài chính', 'GD_TAI_CHINH', 2, (SELECT id FROM departments WHERE code = 'BGH')),
('Phó Hiệu Trưởng', 'PHO_HT', 3, (SELECT id FROM departments WHERE code = 'BGH')),
('Hiệu Trưởng', 'HIEU_TRUONG', 3, (SELECT id FROM departments WHERE code = 'BGH')),
('Trưởng phòng Marketing', 'TP_MARKETING', 4, (SELECT id FROM departments WHERE code = 'QL_TP')),
('Trưởng phòng Nhân sự', 'TP_NS', 4, (SELECT id FROM departments WHERE code = 'QL_TP')),
('Nhân viên Marketing', 'NV_MARKETING', 5, (SELECT id FROM departments WHERE code = 'MARKETING')),
('Nhân viên học vụ', 'NV_HOC_VU', 5, (SELECT id FROM departments WHERE code = 'HOC_VU')),
('Nhân viên Hành chính', 'NV_HANH_CHINH', 5, (SELECT id FROM departments WHERE code = 'KE_TOAN'));

-- Khởi tạo request types
INSERT INTO request_types (name, display_name, description) VALUES
('leave_request', 'Đơn nghỉ phép', 'Yêu cầu nghỉ phép của nhân viên'),
('supply_request', 'Yêu cầu vật tư', 'Yêu cầu mua sắm vật tư, thiết bị'),
('expense_request', 'Yêu cầu chi phí', 'Yêu cầu thanh toán chi phí');

-- Workflow cho đơn nghỉ phép của Nhân viên học vụ (2 cấp)
INSERT INTO approval_workflows (name, description, request_type_id, position_id) 
VALUES (
    'Leave Approval - Academic Staff', 
    'Quy trình duyệt đơn nghỉ phép cho nhân viên học vụ',
    (SELECT id FROM request_types WHERE name = 'leave_request'),
    (SELECT id FROM positions WHERE name = 'Nhân viên học vụ')
);

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_position_id, can_edit) VALUES
((SELECT id FROM approval_workflows WHERE name = 'Leave Approval - Academic Staff'), 1, 'Duyệt cấp 1', (SELECT id FROM positions WHERE name = 'Phó Hiệu Trưởng'), false),
((SELECT id FROM approval_workflows WHERE name = 'Leave Approval - Academic Staff'), 2, 'Duyệt cấp 2', (SELECT id FROM positions WHERE name = 'Giám đốc điều hành'), false);

-- Workflow cho yêu cầu vật tư của Nhân viên học vụ (1 cấp)
INSERT INTO approval_workflows (name, description, request_type_id, position_id) 
VALUES (
    'Supply Request - Academic Staff', 
    'Quy trình duyệt yêu cầu vật tư cho nhân viên học vụ',
    (SELECT id FROM request_types WHERE name = 'supply_request'),
    (SELECT id FROM positions WHERE name = 'Nhân viên học vụ')
);

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_position_id, can_edit) VALUES
((SELECT id FROM approval_workflows WHERE name = 'Supply Request - Academic Staff'), 1, 'Duyệt yêu cầu vật tư', (SELECT id FROM positions WHERE name = 'Giám đốc điều hành'), true);

-- Workflow cho đơn nghỉ phép của Nhân viên Hành chính (1 cấp)
INSERT INTO approval_workflows (name, description, request_type_id, position_id) 
VALUES (
    'Leave Approval - Administrative Staff', 
    'Quy trình duyệt đơn nghỉ phép cho nhân viên hành chính',
    (SELECT id FROM request_types WHERE name = 'leave_request'),
    (SELECT id FROM positions WHERE name = 'Nhân viên Hành chính')
);

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_position_id, can_edit) VALUES
((SELECT id FROM approval_workflows WHERE name = 'Leave Approval - Administrative Staff'), 1, 'Duyệt đơn nghỉ phép', (SELECT id FROM positions WHERE name = 'Giám đốc tài chính'), false);
```

## Ví dụ Truy vấn

### Lấy workflow cho một nhân viên cụ thể

```sql
-- Lấy danh sách workflow có thể áp dụng cho nhân viên
SELECT 
    aw.name as workflow_name,
    rt.display_name as request_type,
    COUNT(ast.id) as total_steps
FROM approval_workflows aw
JOIN request_types rt ON aw.request_type_id = rt.id
LEFT JOIN approval_steps ast ON aw.id = ast.workflow_id
JOIN profiles p ON (aw.position_id = p.position_id OR aw.department_id = p.department_id)
WHERE p.id = 'user-uuid-here'
AND aw.is_active = true
GROUP BY aw.id, aw.name, rt.display_name
ORDER BY rt.display_name;
```

### Dashboard cho manager

```sql
-- Truy vấn dashboard cho manager
WITH manager_requests AS (
    -- Yêu cầu cần duyệt
    SELECT 
        r.*,
        'pending_approval' as view_type,
        ast.step_name,
        ast.can_edit,
        p_requester.full_name as requester_name,
        rt.display_name as request_type_name
    FROM supply_requests r
    JOIN approval_steps ast ON r.current_step_id = ast.id
    JOIN profiles p_manager ON (
        (ast.approver_position_id IS NOT NULL AND p_manager.position_id = ast.approver_position_id) OR
        (ast.approver_employee_id IS NOT NULL AND p_manager.id = ast.approver_employee_id)
    )
    JOIN profiles p_requester ON r.requester_id = p_requester.id
    JOIN request_types rt ON r.request_type_id = rt.id
    WHERE p_manager.id = auth.uid()
    AND r.status = 'pending'
    
    UNION ALL
    
    -- Yêu cầu của nhân viên dưới quyền
    SELECT 
        r.*,
        'subordinate_request' as view_type,
        COALESCE(ast.step_name, 'Completed') as step_name,
        false as can_edit,
        p_requester.full_name as requester_name,
        rt.display_name as request_type_name
    FROM supply_requests r
    JOIN profiles p_requester ON r.requester_id = p_requester.id
    JOIN profiles p_manager ON p_requester.manager_id = p_manager.id
    LEFT JOIN approval_steps ast ON r.current_step_id = ast.id
    JOIN request_types rt ON r.request_type_id = rt.id
    WHERE p_manager.id = auth.uid()
    AND r.created_at >= NOW() - INTERVAL '30 days'
)
SELECT * FROM manager_requests
ORDER BY 
    CASE WHEN view_type = 'pending_approval' THEN 1 ELSE 2 END,
    created_at DESC;
```

## Tính Linh hoạt

### Thêm loại yêu cầu mới

```sql
-- Ví dụ: Thêm yêu cầu thiết bị IT
INSERT INTO request_types (name, display_name, description) VALUES
('it_equipment_request', 'Yêu cầu thiết bị IT', 'Yêu cầu mua sắm thiết bị công nghệ thông tin');

-- Tạo workflow riêng với 3 cấp duyệt
INSERT INTO approval_workflows (name, description, request_type_id, position_id) 
VALUES (
    'IT Equipment Request - Marketing Staff', 
    'Quy trình duyệt yêu cầu thiết bị IT cho nhân viên marketing',
    (SELECT id FROM request_types WHERE name = 'it_equipment_request'),
    (SELECT id FROM positions WHERE name = 'Nhân viên Marketing')
);

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_position_id, can_edit) VALUES
((SELECT id FROM approval_workflows WHERE name = 'IT Equipment Request - Marketing Staff'), 1, 'Duyệt kỹ thuật', (SELECT id FROM positions WHERE name = 'Trưởng phòng IT'), true),
((SELECT id FROM approval_workflows WHERE name = 'IT Equipment Request - Marketing Staff'), 2, 'Duyệt ngân sách', (SELECT id FROM positions WHERE name = 'Giám đốc tài chính'), false),
((SELECT id FROM approval_workflows WHERE name = 'IT Equipment Request - Marketing Staff'), 3, 'Phê duyệt cuối', (SELECT id FROM positions WHERE name = 'Giám đốc điều hành'), false);
```

### Thay đổi quy trình duyệt

```sql
-- Thêm bước duyệt mới vào workflow hiện có
INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_position_id, can_edit) 
VALUES (
    (SELECT id FROM approval_workflows WHERE name = 'Supply Request - Academic Staff'),
    2, -- Chèn làm bước thứ 2
    'Duyệt kỹ thuật',
    (SELECT id FROM positions WHERE name = 'Trưởng phòng Kỹ thuật'),
    false
);

-- Cập nhật lại step_order cho các bước sau
UPDATE approval_steps 
SET step_order = step_order + 1
WHERE workflow_id = (SELECT id FROM approval_workflows WHERE name = 'Supply Request - Academic Staff')
AND step_order >= 2
AND id != (SELECT id FROM approval_steps WHERE step_name = 'Duyệt kỹ thuật' AND workflow_id = (SELECT id FROM approval_workflows WHERE name = 'Supply Request - Academic Staff'));
```

## Kết luận

Schema này cung cấp:

1. **Tính linh hoạt cao**: Cùng một chức vụ có thể có workflow khác nhau cho các loại yêu cầu khác nhau
2. **Không giới hạn số cấp duyệt**: Sử dụng `step_order` thay vì cột cứng
3. **Audit trail đầy đủ**: Theo dõi mọi thay đổi trong hệ thống
4. **Bảo mật chặt chẽ**: RLS policies đảm bảo phân quyền chính xác
5. **Dễ mở rộng**: Thêm loại yêu cầu mới không cần thay đổi cấu trúc cơ bản