'use client'

import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    const response = await signOut()
    if (response.success) {
      router.push('/auth/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>User profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">User ID</p>
                <p className="text-sm text-muted-foreground">{user.id}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">User</p>
              </div>
              <Button 
                variant="destructive" 
                className="w-full mt-4"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No user data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}