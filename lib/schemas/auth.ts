import { z } from 'zod'

// Base email validation - reusable across different schemas
const email = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Please enter a valid email address' })
  .max(254, { message: 'Email is too long' }) // RFC 5321 limit
  .toLowerCase()
  .trim()

// Base password validation - configurable strength
const password = z
  .string()
  .min(1, { message: 'Password is required' })
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(128, { message: 'Password is too long' })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  })

// Relaxed password for development/testing
const simplePassword = z
  .string()
  .min(1, { message: 'Password is required' })
  .min(6, { message: 'Password must be at least 6 characters long' })
  .max(128, { message: 'Password is too long' })

// Name validation
const name = z
  .string()
  .min(1, { message: 'Name is required' })
  .min(2, { message: 'Name must be at least 2 characters long' })
  .max(50, { message: 'Name is too long' })
  .regex(/^[a-zA-Z\s'-]+$/, {
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  })
  .trim()

// Phone number validation (international format)
const phoneNumber = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please enter a valid phone number'
  })
  .optional()

// URL validation
const websiteUrl = z
  .string()
  .url({ message: 'Please enter a valid URL' })
  .optional()
  .or(z.literal(''))

/**
 * Authentication Schemas
 */

// Sign in schema
export const signInSchema = z.object({
  email,
  password: simplePassword, // Use simpler password for sign in
})

// Sign up schema  
export const signUpSchema = z.object({
  email,
  password: process.env.NODE_ENV === 'development' ? simplePassword : password,
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email,
})

// Password reset schema
export const passwordResetSchema = z.object({
  password: password,
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: password,
  confirmNewPassword: z.string().min(1, { message: 'Please confirm your new password' }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
})

// Email verification schema
export const emailVerificationSchema = z.object({
  token: z.string().min(1, { message: 'Verification token is required' }),
})

// Profile update schema
export const profileUpdateSchema = z.object({
  firstName: name.optional(),
  lastName: name.optional(),
  email: email.optional(),
  phone: phoneNumber,
  website: websiteUrl,
  bio: z
    .string()
    .max(500, { message: 'Bio is too long' })
    .optional(),
})

// Two-factor authentication setup schema
export const twoFactorSetupSchema = z.object({
  secret: z.string().min(1, { message: 'Secret is required' }),
  token: z
    .string()
    .regex(/^\d{6}$/, { message: 'Token must be 6 digits' }),
})

// Two-factor authentication verify schema
export const twoFactorVerifySchema = z.object({
  token: z
    .string()
    .regex(/^\d{6}$/, { message: 'Token must be 6 digits' }),
})

/**
 * Type exports for use in components
 */
export type SignInFormData = z.infer<typeof signInSchema>
export type SignUpFormData = z.infer<typeof signUpSchema>
export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetData = z.infer<typeof passwordResetSchema>
export type ChangePasswordData = z.infer<typeof changePasswordSchema>
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>
export type TwoFactorSetupData = z.infer<typeof twoFactorSetupSchema>
export type TwoFactorVerifyData = z.infer<typeof twoFactorVerifySchema>

/**
 * Schema validation utilities
 */

// Safe parse with error formatting
export function safeParseWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  // Use Zod's built-in flatten method to get properly formatted errors
  const formattedErrors = result.error.flatten()
  
  // Filter out undefined values and ensure we return string arrays
  const errors: Record<string, string[]> = {}
  Object.entries(formattedErrors.fieldErrors).forEach(([key, value]) => {
    if (value && Array.isArray(value)) {
      errors[key] = value
    }
  })
  
  return { success: false, errors }
}

// Common validation patterns for reuse
export const commonPatterns = {
  email,
  password,
  simplePassword,
  name,
  phoneNumber,
  websiteUrl,
} as const
