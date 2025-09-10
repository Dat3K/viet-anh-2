'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const authSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters long' }),
})

export type AuthFormState = {
  errors?: {
    email?: string[]
    password?: string[]
    general?: string[]
  }
  message?: string
}

export async function signInAction(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // Validate form data
  const validatedFields = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        errors: {
          general: [error.message]
        }
      }
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return {
      errors: {
        general: ['An unexpected error occurred. Please try again.']
      }
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUpAction(
  prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // Validate form data
  const validatedFields = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return {
        errors: {
          general: [error.message]
        }
      }
    }
  } catch (error) {
    console.error('Sign up error:', error)
    return {
      errors: {
        general: ['An unexpected error occurred. Please try again.']
      }
    }
  }

  return {
    message: 'Check your email to verify your account!'
  }
}

export async function signInWithGoogleAction() {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect('/error')
  }

  redirect(data.url)
}
