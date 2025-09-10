'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">User Profile</h2>
        <p className="text-gray-600 text-center">No user signed in</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">User Profile</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User ID
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border font-mono">
            {user.id}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
            {user.email}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Confirmed
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
            {user.email_confirmed_at ? (
              <span className="text-green-600 font-semibold">✓ Confirmed</span>
            ) : (
              <span className="text-yellow-600 font-semibold">⚠ Not confirmed</span>
            )}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Created At
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
            {new Date(user.created_at).toLocaleString()}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Sign In
          </label>
          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
          </p>
        </div>
        
        {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metadata
            </label>
            <pre className="text-xs text-gray-900 bg-gray-50 p-2 rounded border overflow-x-auto">
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
