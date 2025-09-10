'use client'

import { useState, useTransition } from 'react'
import { useFormState } from 'react-dom'
import { Eye, EyeOff, LogIn, UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signInAction, signUpAction, signInWithGoogleAction, type AuthFormState } from '@/app/(auth)/login/actions'

const initialState: AuthFormState = {
  errors: {},
  message: '',
}

interface AuthFormProps {
  className?: string
}

export default function AuthForm({ className }: AuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Form state for sign in
  const [signInState, signInFormAction] = useFormState(signInAction, initialState)
  
  // Form state for sign up
  const [signUpState, signUpFormAction] = useFormState(signUpAction, initialState)
  
  // Get current state based on mode
  const currentState = mode === 'signin' ? signInState : signUpState
  const currentAction = mode === 'signin' ? signInFormAction : signUpFormAction
  
  const isSignUp = mode === 'signup'

  const handleGoogleSignIn = () => {
    startTransition(() => {
      signInWithGoogleAction()
    })
  }

  const handleModeChange = () => {
    setMode(isSignUp ? 'signin' : 'signup')
    // Clear any existing form state when switching modes
    if (isSignUp) {
      signInState.errors = {}
      signInState.message = ''
    } else {
      signUpState.errors = {}
      signUpState.message = ''
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </CardTitle>
        <CardDescription className="text-center">
          {isSignUp 
            ? 'Enter your email and password to create your account'
            : 'Enter your email and password to sign in to your account'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Success Message */}
        {currentState.message && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">{currentState.message}</p>
          </div>
        )}
        
        {/* General Error */}
        {currentState.errors?.general && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{currentState.errors.general[0]}</p>
          </div>
        )}

        <form action={currentAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isPending}
              className={currentState.errors?.email ? 'border-red-500' : ''}
            />
            {currentState.errors?.email && (
              <p className="text-sm text-red-600">{currentState.errors.email[0]}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                disabled={isPending}
                className={currentState.errors?.password ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {showPassword ? 'Hide password' : 'Show password'}
                </span>
              </Button>
            </div>
            {currentState.errors?.password && (
              <p className="text-sm text-red-600">{currentState.errors.password[0]}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isSignUp ? (
              <UserPlus className="mr-2 h-4 w-4" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {isSignUp ? 'Create account' : 'Sign in'}
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <form action={handleGoogleSignIn}>
          <Button
            variant="outline"
            type="submit"
            className="w-full"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        {!isSignUp && (
          <div className="text-center text-sm">
            <Button variant="link" className="p-0 h-auto text-sm text-muted-foreground">
              Forgot your password?
            </Button>
          </div>
        )}
        
        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>
          {' '}
          <Button
            variant="link"
            className="p-0 h-auto font-normal text-sm"
            onClick={handleModeChange}
            disabled={isPending}
            type="button"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
