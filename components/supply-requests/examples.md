# Supply Request Detail Components - Usage Examples

This document demonstrates various ways to use the flexible `RequestDetail` component system.

## Components Overview

### 1. `useSupplyRequestDetail` Hook
**Location**: `hooks/use-supply-request-detail.tsx`

**Features**:
- Type-safe request fetching with caching
- Real-time updates integration  
- Optimistic updates for item editing
- Loading and error states
- Integration with approval workflow

### 2. `RequestDetail` Component
**Location**: `components/supply-requests/request-detail.tsx`

**Features**:
- Multiple display modes: `view` | `edit` | `approve` | `full`
- Layout variants: `page` | `modal` | `card` | `inline`
- Flexible permissions and actions
- Responsive design following shadcn/ui patterns
- Type-safe with no `any` types

### 3. `RequestDetailModal` Component  
**Location**: `components/supply-requests/request-detail-modal.tsx`

**Features**:
- Modal wrapper for RequestDetail
- Automatic modal management
- Callback integration

## Usage Examples

### Example 1: Standalone Detail Page
```tsx
// app/supply-requests/[id]/page.tsx
import { RequestDetail } from '@/components/supply-requests'

export default function SupplyRequestDetailPage() {
  const requestId = params.id as string
  
  return (
    <AppLayout>
      <RequestDetail
        requestId={requestId}
        mode="full" // Enable all features
        variant="page" // Full page layout
        showActions={true} // Show approve/reject buttons
        allowItemEditing={true} // Allow inline editing
        onApprovalProcessed={(action, result) => {
          console.log('Approval processed:', action, result)
        }}
      />
    </AppLayout>
  )
}
```

### Example 2: Modal View
```tsx
// Any component that needs to show request details in a modal
import { useState } from 'react'
import { RequestDetailModal } from '@/components/supply-requests'

function SomeComponent() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  
  return (
    <>
      <Button onClick={() => setSelectedRequestId('some-request-id')}>
        View Details
      </Button>
      
      <RequestDetailModal
        requestId={selectedRequestId!}
        isOpen={!!selectedRequestId}
        onOpenChange={(open) => !open && setSelectedRequestId(null)}
        mode="view" // Read-only mode
        title="Request Details"
      />
    </>
  )
}
```

### Example 3: Approval Interface
```tsx
// Approval page integration
import { RequestDetail } from '@/components/supply-requests'

function ApprovalPage() {
  return (
    <RequestDetail
      requestId={requestId}
      mode="approve" // Focus on approval functionality
      variant="card" // Card layout
      showActions={true} // Show approve/reject
      allowItemEditing={true} // Allow editing before approval
      onApprovalProcessed={(action, result) => {
        // Refresh approval list
        queryClient.invalidateQueries(['pending-approvals'])
        toast.success(`Request ${action}d successfully!`)
      }}
    />
  )
}
```

### Example 4: Embedded in List View
```tsx
// Inline view in a data table
import { RequestDetail } from '@/components/supply-requests'

function RequestsTable() {
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)
  
  return (
    <div>
      {requests.map(request => (
        <div key={request.id}>
          <div onClick={() => setExpandedRequestId(request.id)}>
            {/* Request summary row */}
          </div>
          
          {expandedRequestId === request.id && (
            <RequestDetail
              requestId={request.id}
              mode="view" // Read-only
              variant="inline" // Minimal layout
              showActions={false} // No actions in list view
              className="mt-4 border-l-2 border-muted pl-4"
            />
          )}
        </div>
      ))}
    </div>
  )
}
```

### Example 5: Custom Hook Usage
```tsx
// Advanced usage with custom hook
import { useSupplyRequestDetail } from '@/hooks/use-supply-request-detail'

function CustomRequestView({ requestId }: { requestId: string }) {
  const {
    request,
    isLoading,
    error,
    canEdit,
    canApprove,
    updateItem,
    processApproval,
    refetch
  } = useSupplyRequestDetail(requestId)
  
  if (isLoading) return <Skeleton />
  if (error) return <ErrorState onRetry={refetch} />
  if (!request) return <NotFound />
  
  return (
    <div>
      <h1>{request.title}</h1>
      <p>Status: {request.status}</p>
      
      {canEdit && (
        <Button onClick={() => updateItem({ 
          itemId: 'item-id', 
          updates: { quantity: 10 } 
        })}>
          Update Item
        </Button>
      )}
      
      {canApprove && (
        <Button onClick={() => processApproval({ 
          action: 'approve', 
          comments: 'Looks good!' 
        })}>
          Approve
        </Button>
      )}
    </div>
  )
}
```

## Component Props Reference

### RequestDetail Props
```tsx
interface RequestDetailProps {
  requestId: string
  mode?: 'view' | 'edit' | 'approve' | 'full' // Default: 'view'
  variant?: 'page' | 'modal' | 'card' | 'inline' // Default: 'card'
  showActions?: boolean // Default: false
  allowItemEditing?: boolean // Default: false
  className?: string
  headerContent?: React.ReactNode
  footerContent?: React.ReactNode
  onApprovalProcessed?: (action: 'approve' | 'reject', result: any) => void
}
```

### RequestDetailModal Props
```tsx
interface RequestDetailModalProps {
  requestId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'view' | 'edit' | 'approve' | 'full' // Default: 'view'
  showActions?: boolean // Default: false
  allowItemEditing?: boolean // Default: false
  title?: string
  onApprovalProcessed?: (action: 'approve' | 'reject', result: any) => void
}
```

## Integration Points

### With Existing Pages
- **History Page**: Already integrated with navigation to detail page
- **Approval Page**: Can embed RequestDetail for inline editing
- **Dashboard**: Can use modal version for quick view

### With TanStack Query
- Uses established query keys from `supplyRequestKeys`
- Integrates with existing cache invalidation patterns
- Optimistic updates for better UX

### With Real-time Updates
- Automatic integration with `useSupplyRequestRealtime`
- Updates are reflected immediately in the UI
- Health monitoring for connection status

## Best Practices

1. **Use appropriate mode for context**:
   - `view`: Read-only scenarios
   - `edit`: When user owns the request
   - `approve`: For approvers
   - `full`: Admin or comprehensive view

2. **Choose correct variant**:
   - `page`: Full-screen dedicated pages
   - `modal`: Quick views and dialogs
   - `card`: Section of a larger page
   - `inline`: Embedded in lists/tables

3. **Handle permissions properly**:
   - Component respects database-level permissions
   - Additional UI-level restrictions via props
   - Always validate on backend

4. **Optimize performance**:
   - Components use established caching patterns
   - Optimistic updates for better UX
   - Proper loading states

5. **Follow type safety**:
   - No `any` types used
   - Proper database field mapping
   - TypeScript errors are handled
