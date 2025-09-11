import Link from 'next/link'
import AuthForm from '@/components/features/auth/auth-form'

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams
  
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <AuthForm error={error} />
        
        <p className="px-8 text-center text-sm text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link
            href="/terms"
            className="underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          {' '}and{' '}
          <Link
            href="/privacy"
            className="underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
