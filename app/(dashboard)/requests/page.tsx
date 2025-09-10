import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Requests',
  description: 'Manage your requests',
}

export default function RequestsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Requests</h1>
      <div className="text-muted-foreground">
        <p>Request management functionality coming soon...</p>
      </div>
    </div>
  )
}
