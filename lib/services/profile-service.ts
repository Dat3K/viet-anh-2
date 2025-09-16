'use client'

import { createClient } from '@/lib/supabase/client'
import { ProfileWithDetails, Profile } from '@/types/database'

const supabase = createClient()

/**
 * Fetch user profile with role and department details
 * Optimized with proper joins based on actual database schema
 */
export async function fetchProfile(userId: string): Promise<ProfileWithDetails> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles(
        *,
        department:departments(*)
      )
    `)
    .eq('id', userId)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  if (!data) {
    throw new Error('Profile not found')
  }

  // Transform the data to match ProfileWithDetails type
  const profile: ProfileWithDetails = {
    ...data,
    department: data.role?.department || null
  }

  return profile
}

/**
 * Update user profile information
 * Returns the updated profile with relationships
 * Optimized to only update allowed fields
 */
export async function updateProfile(
  userId: string, 
  updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'employee_code'>>
): Promise<ProfileWithDetails> {
  // Validate that we have something to update
  if (!updates || Object.keys(updates).length === 0) {
    throw new Error('No updates provided')
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .eq('is_active', true) // Only update active profiles

  if (updateError) {
    console.error('Error updating profile:', updateError)
    throw new Error(`Failed to update profile: ${updateError.message}`)
  }

  // Fetch the updated profile with relationships
  return fetchProfile(userId)
}

/**
 * Check if profile exists for a user ID
 * Optimized to use minimal data transfer
 */
export async function checkProfileExists(userId: string): Promise<boolean> {
  if (!userId) {
    return false
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle() // Use maybeSingle to avoid throwing on not found

  if (error) {
    console.error('Error checking profile existence:', error)
    return false
  }

  return !!data
}

/**
 * Wait for profile to be created by database trigger
 * Uses exponential backoff for optimal performance
 * Enhanced with better error handling and logging
 */
async function waitForProfile(userId: string, maxAttempts: number = 8): Promise<ProfileWithDetails> {
  if (!userId) {
    throw new Error('User ID is required')
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const profile = await fetchProfile(userId)
      if (attempt > 1) {
        console.log(`Profile found for user ${userId} after ${attempt} attempts`)
      }
      return profile
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(`Profile not found for user ${userId} after ${maxAttempts} attempts`)
        throw new Error(`Profile not found after ${maxAttempts} attempts. Database trigger may have failed or user may not exist.`)
      }
      
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms, 3200ms
      const delay = Math.min(100 * Math.pow(2, attempt - 1), 3000)
      console.log(`Profile not found for user ${userId}, attempt ${attempt}/${maxAttempts}, retrying in ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unexpected error in waitForProfile')
}

/**
 * Get profile - optimized for automatic profile creation via database trigger
 * If profile doesn't exist immediately, waits for database trigger to create it
 * Enhanced with better validation and error handling
 */
export async function getProfile(userId: string): Promise<ProfileWithDetails> {
  if (!userId) {
    throw new Error('User ID is required')
  }

  try {
    // Try to fetch existing profile first
    return await fetchProfile(userId)
  } catch (error) {
    // Profile might not exist yet if user just registered
    // Wait for database trigger to create it
    console.log('Profile not found immediately, waiting for database trigger for user:', userId)
    return await waitForProfile(userId)
  }
}

/**
 * Get profile by employee code
 * Useful for admin functions and employee lookup
 */
export async function getProfileByEmployeeCode(employeeCode: string): Promise<ProfileWithDetails | null> {
  if (!employeeCode) {
    throw new Error('Employee code is required')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles(
        *,
        department:departments(*)
      )
    `)
    .eq('employee_code', employeeCode)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile by employee code:', error)
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  if (!data) {
    return null
  }

  // Transform the data to match ProfileWithDetails type
  const profile: ProfileWithDetails = {
    ...data,
    department: data.role?.department || null
  }

  return profile
}

/**
 * Get profiles by department ID
 * Useful for department-based queries and admin functions
 */
export async function getProfilesByDepartment(departmentId: string): Promise<ProfileWithDetails[]> {
  if (!departmentId) {
    throw new Error('Department ID is required')
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      role:roles!inner(
        *,
        department:departments!inner(*)
      )
    `)
    .eq('role.department_id', departmentId)
    .eq('is_active', true)
    .order('full_name')

  if (error) {
    console.error('Error fetching profiles by department:', error)
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }

  // Transform the data to match ProfileWithDetails type
  return data.map(item => ({
    ...item,
    department: item.role?.department || null
  }))
}

/**
 * Deactivate profile (soft delete)
 * Sets is_active to false instead of deleting the record
 */
export async function deactivateProfile(userId: string): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required')
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error deactivating profile:', error)
    throw new Error(`Failed to deactivate profile: ${error.message}`)
  }
}
