'use client'

import { useTransition } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { signInWithMicrosoftAction } from '@/app/(auth)/login/actions'

interface AuthFormProps {
  className?: string
  error?: string
}

export default function AuthForm({ className, error }: AuthFormProps) {
  const [isPending, startTransition] = useTransition()

  const handleMicrosoftSignIn = () => {
    startTransition(() => {
      signInWithMicrosoftAction()
    })
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          Welcome
        </CardTitle>
        <CardDescription className="text-center">
          Sign in with your Microsoft account to continue
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Auth Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">
              {error === 'auth_failed' 
                ? 'Authentication failed. Please try again.' 
                : 'An error occurred during authentication.'}
            </p>
          </div>
        )}
        
        <form action={handleMicrosoftSignIn}>
          <Button
            variant="default"
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23">
                <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
            )}
            {isPending ? 'Signing in...' : 'Continue with Microsoft'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
