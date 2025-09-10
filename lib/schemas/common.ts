import { z } from 'zod'

/**
 * Common validation patterns that can be reused across different domains
 */

// ID validation (UUIDs, nanoid, etc.)
export const id = z.string().min(1, { message: 'ID is required' })

export const uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, {
    message: 'Invalid UUID format'
  })

export const nanoid = z
  .string()
  .regex(/^[A-Za-z0-9_-]{21}$/, {
    message: 'Invalid nanoid format'
  })

// Text content validation
export const shortText = z
  .string()
  .min(1, { message: 'This field is required' })
  .max(100, { message: 'Text is too long (max 100 characters)' })
  .trim()

export const mediumText = z
  .string()
  .min(1, { message: 'This field is required' })
  .max(500, { message: 'Text is too long (max 500 characters)' })
  .trim()

export const longText = z
  .string()
  .min(1, { message: 'This field is required' })
  .max(2000, { message: 'Text is too long (max 2000 characters)' })
  .trim()

// Rich text content (HTML)
export const richText = z
  .string()
  .max(10000, { message: 'Content is too long' })
  .refine(
    (val) => {
      // Basic HTML tag validation
      const htmlTagPattern = /<[^>]*>/g
      const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      const tags = val.match(htmlTagPattern) || []
      
      return tags.every(tag => {
        const tagName = tag.replace(/<\/?([^>]+)>/, '$1').split(' ')[0]
        return allowedTags.includes(tagName.toLowerCase())
      })
    },
    { message: 'Contains invalid HTML tags' }
  )

// File validation
export const fileSize = z
  .number()
  .positive({ message: 'File size must be positive' })
  .max(50 * 1024 * 1024, { message: 'File size must be less than 50MB' }) // 50MB max

export const imageFile = z.object({
  name: z.string().min(1, { message: 'File name is required' }),
  size: fileSize,
  type: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, {
      message: 'Only JPEG, PNG, GIF, and WebP images are allowed'
    }),
})

// Date and time validation
export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please enter a valid date (YYYY-MM-DD)' })

export const dateTimeString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/, {
    message: 'Please enter a valid date-time (ISO format)'
  })

export const futureDate = dateString.refine(
  (val) => new Date(val) > new Date(),
  { message: 'Date must be in the future' }
)

export const pastDate = dateString.refine(
  (val) => new Date(val) < new Date(),
  { message: 'Date must be in the past' }
)

// Numeric validation
export const positiveNumber = z
  .number()
  .positive({ message: 'Must be a positive number' })

export const nonNegativeNumber = z
  .number()
  .nonnegative({ message: 'Must be zero or positive' })

export const percentage = z
  .number()
  .min(0, { message: 'Percentage cannot be less than 0' })
  .max(100, { message: 'Percentage cannot be more than 100' })

export const price = z
  .number()
  .positive({ message: 'Price must be positive' })
  .multipleOf(0.01, { message: 'Price must have at most 2 decimal places' })

// Contact information
export const phoneNumber = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please enter a valid phone number'
  })

export const zipCode = z
  .string()
  .regex(/^[0-9]{5}(-[0-9]{4})?$/, {
    message: 'Please enter a valid ZIP code'
  })

// Social media handles
export const twitterHandle = z
  .string()
  .regex(/^@?[A-Za-z0-9_]{1,15}$/, {
    message: 'Invalid Twitter handle'
  })
  .transform(val => val.startsWith('@') ? val : `@${val}`)

export const instagramHandle = z
  .string()
  .regex(/^@?[A-Za-z0-9_.]{1,30}$/, {
    message: 'Invalid Instagram handle'
  })
  .transform(val => val.startsWith('@') ? val : `@${val}`)

// Search and filtering
export const searchQuery = z
  .string()
  .min(1, { message: 'Search query cannot be empty' })
  .max(200, { message: 'Search query is too long' })
  .trim()

export const sortOrder = z.enum(['asc', 'desc'], {
  message: 'Sort order must be "asc" or "desc"'
})

export const paginationSchema = z.object({
  page: z
    .number()
    .int()
    .positive({ message: 'Page must be a positive integer' })
    .default(1),
    
  limit: z
    .number()
    .int()
    .positive({ message: 'Limit must be a positive integer' })
    .max(100, { message: 'Limit cannot exceed 100' })
    .default(20),
    
  sortBy: z.string().optional(),
  sortOrder: sortOrder.default('desc'),
})

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  error: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
})

// Form state for server actions
export const formStateSchema = z.object({
  errors: z.record(z.string(), z.array(z.string())).optional(),
  message: z.string().optional(),
  success: z.boolean().optional(),
})

/**
 * Validation utilities
 */

// Transform string to boolean
export const stringToBoolean = z
  .string()
  .transform(val => val.toLowerCase() === 'true')

// Transform string to number
export const stringToNumber = z
  .string()
  .regex(/^\d+(\.\d+)?$/, { message: 'Must be a valid number' })
  .transform(val => parseFloat(val))

// Optional string (empty string becomes undefined)
export const optionalString = z
  .string()
  .optional()
  .transform(val => val?.trim() || undefined)

// Required select option
export const requiredSelect = z
  .string()
  .min(1, { message: 'Please make a selection' })
  .refine(val => val !== 'placeholder', {
    message: 'Please select a valid option'
  })

/**
 * Type exports
 */
export type PaginationData = z.infer<typeof paginationSchema>
export type ApiResponseData = z.infer<typeof apiResponseSchema>
export type FormStateData = z.infer<typeof formStateSchema>

/**
 * Schema composition helpers
 */

// Create a timestamped schema
export function withTimestamps<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.extend({
    createdAt: dateTimeString,
    updatedAt: dateTimeString,
  })
}

// Create a schema with ID
export function withId<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.extend({
    id: uuid,
  })
}

// Create a schema with user ID
export function withUserId<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.extend({
    userId: uuid,
  })
}

// Create a soft-deletable schema
export function withSoftDelete<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.extend({
    deletedAt: dateTimeString.nullable(),
  })
}
