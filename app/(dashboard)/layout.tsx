import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold">Dashboard</h2>
          </div>
          <nav className="space-y-2 p-4">
            <a
              href="/admin"
              className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              Admin
            </a>
            <a
              href="/requests"
              className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md"
            >
              Requests
            </a>
          </nav>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
