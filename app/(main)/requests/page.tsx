import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, XCircle, Plus } from "lucide-react"

export const metadata: Metadata = {
  title: 'Requests',
  description: 'Manage your requests',
}

// Mock data for demonstration
const requests = [
  {
    id: '1',
    title: 'Account Access Request',
    status: 'pending',
    date: '2025-01-09',
    description: 'Request for admin access to user management system'
  },
  {
    id: '2', 
    title: 'Data Export Request',
    status: 'approved',
    date: '2025-01-08',
    description: 'Export user data for Q4 reporting'
  },
  {
    id: '3',
    title: 'Feature Request',
    status: 'rejected',
    date: '2025-01-07',
    description: 'Add dark mode toggle to dashboard'
  },
  {
    id: '4',
    title: 'System Maintenance',
    status: 'pending',
    date: '2025-01-06',
    description: 'Schedule maintenance window for database upgrade'
  }
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />
    case 'approved':
      return <CheckCircle className="h-4 w-4" />
    case 'rejected':
      return <XCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'default'
    case 'approved':
      return 'default'
    case 'rejected':
      return 'destructive'
    default:
      return 'default'
  }
}

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
          <p className="text-muted-foreground">
            Manage and track all your requests
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter(r => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{request.title}</h3>
                    <Badge 
                      variant={getStatusColor(request.status) as 'default' | 'destructive'}
                      className="text-xs"
                    >
                      <span className="mr-1">{getStatusIcon(request.status)}</span>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {request.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {request.date}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  {request.status === 'pending' && (
                    <Button size="sm">
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
