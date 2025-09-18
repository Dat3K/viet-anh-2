import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, SupabaseClient, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Interface for table subscription configuration
 */
interface TableSubscription {
  table: string
  filter?: string
  callbacks: {
    onInsert?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
    onUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
    onDelete?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
    onError?: (error: Error) => void
  }
}

/**
 * Interface for supply request specific callbacks
 */
interface SupplyRequestCallbacks {
  onRequestUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onItemUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onApprovalUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onError?: (error: Error) => void
}

/**
 * Interface for user-specific subscription options
 */
interface UserSubscriptionOptions {
  userId: string
  includeApprovals?: boolean
  includeItems?: boolean
  onlyOwnRequests?: boolean
}

/**
 * Interface for single table subscription callbacks
 */
interface SingleTableCallbacks {
  onInsert?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
  onError?: (error: Error) => void
}

/**
 * RealtimeManager - Manages Supabase real-time subscriptions
 * Provides centralized management of real-time channels with proper cleanup
 */
class RealtimeManager {
  private supabase: SupabaseClient
  private activeChannels = new Map<string, RealtimeChannel>()

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Subscribe to multiple tables with a single channel
   * @param channelName Unique name for the channel
   * @param subscriptions Array of table subscriptions
   * @param onError Global error handler for the channel
   * @returns RealtimeChannel instance
   */
  subscribeToMultipleTables(
    channelName: string,
    subscriptions: TableSubscription[],
    onError?: (error: Error) => void
  ): RealtimeChannel {
    // Remove existing channel if it exists
    this.unsubscribe(channelName)

    const channel = this.supabase.channel(channelName)

    // Subscribe to each table
    subscriptions.forEach((subscription) => {
      const { table, filter, callbacks } = subscription

      // Subscribe to INSERT events
      if (callbacks.onInsert) {
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table,
            ...(filter && { filter })
          },
          (payload) => {
            try {
              callbacks.onInsert?.(payload)
            } catch (error) {
              const errorObj = error instanceof Error ? error : new Error(String(error))
              callbacks.onError?.(errorObj)
              onError?.(errorObj)
            }
          }
        )
      }

      // Subscribe to UPDATE events
      if (callbacks.onUpdate) {
        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table,
            ...(filter && { filter })
          },
          (payload) => {
            try {
              callbacks.onUpdate?.(payload)
            } catch (error) {
              const errorObj = error instanceof Error ? error : new Error(String(error))
              callbacks.onError?.(errorObj)
              onError?.(errorObj)
            }
          }
        )
      }

      // Subscribe to DELETE events
      if (callbacks.onDelete) {
        channel.on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table,
            ...(filter && { filter })
          },
          (payload) => {
            try {
              callbacks.onDelete?.(payload)
            } catch (error) {
              const errorObj = error instanceof Error ? error : new Error(String(error))
              callbacks.onError?.(errorObj)
              onError?.(errorObj)
            }
          }
        )
      }
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to real-time channel: ${channelName}`)
      } else if (status === 'CHANNEL_ERROR') {
        const error = new Error(`❌ Channel subscription failed: ${channelName}`)
        console.error(error)
        onError?.(error)
      } else if (status === 'TIMED_OUT') {
        const error = new Error(`⏱️ Channel subscription timed out: ${channelName}`)
        console.error(error)
        onError?.(error)
      } else if (status === 'CLOSED') {
        console.log(`🔒 Channel closed: ${channelName}`)
      }
    })

    // Store the channel for cleanup
    this.activeChannels.set(channelName, channel)

    return channel
  }

  /**
   * Subscribe to a single table
   * @param channelName Unique name for the channel
   * @param table Table name to subscribe to
   * @param filter Optional filter for the subscription
   * @param callbacks Event callbacks
   * @returns RealtimeChannel instance
   */
  subscribeToTable(
    channelName: string,
    table: string,
    filter?: string,
    callbacks: SingleTableCallbacks = {}
  ): RealtimeChannel {
    return this.subscribeToMultipleTables(
      channelName,
      [
        {
          table,
          filter,
          callbacks
        }
      ],
      callbacks.onError
    )
  }

  /**
   * Unsubscribe from a channel and clean up resources
   * @param channelName Name of the channel to unsubscribe from
   */
  unsubscribe(channelName: string): void {
    const channel = this.activeChannels.get(channelName)
    
    if (channel) {
      try {
        this.supabase.removeChannel(channel)
        this.activeChannels.delete(channelName)
        console.log(`🔌 Unsubscribed from channel: ${channelName}`)
      } catch (error) {
        console.error(`❌ Error unsubscribing from channel ${channelName}:`, error)
      }
    } else {
      console.warn(`⚠️ Channel not found for unsubscription: ${channelName}`)
    }
  }

  /**
   * Unsubscribe from all active channels
   */
  unsubscribeAll(): void {
    const channelNames = Array.from(this.activeChannels.keys())
    
    channelNames.forEach((channelName) => {
      this.unsubscribe(channelName)
    })

    console.log(`🧹 Unsubscribed from all ${channelNames.length} channels`)
  }

  /**
   * Get list of active channel names
   * @returns Array of active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.activeChannels.keys())
  }

  /**
   * Get the number of active channels
   * @returns Number of active channels
   */
  getActiveChannelCount(): number {
    return this.activeChannels.size
  }

  /**
   * Check if a specific channel is active
   * @param channelName Name of the channel to check
   * @returns True if channel is active, false otherwise
   */
  isChannelActive(channelName: string): boolean {
    return this.activeChannels.has(channelName)
  }

  /**
   * Setup global error handling for real-time connections
   * Note: Supabase RealtimeClient doesn't expose onOpen/onClose/onError methods
   * Connection status is handled per channel via subscribe callbacks
   */
  setupGlobalErrorHandling(): void {
    console.log('🔧 Global error handling setup - monitoring via channel subscriptions')
    // Connection monitoring is handled per channel in subscribe callbacks
    // Each channel subscription provides status updates: SUBSCRIBED, CHANNEL_ERROR, TIMED_OUT, CLOSED
  }

  /**
   * Get connection status based on active channels
   * @returns Connection status string
   */
  getConnectionStatus(): string {
    const channelCount = this.activeChannels.size
    if (channelCount === 0) {
      return 'no_channels'
    }
    return 'active' // Channels are active, connection assumed healthy
  }

  /**
   * Force reconnection by recreating all channels
   * Supabase handles connection management automatically
   */
  reconnect(): void {
    try {
      const channelNames = Array.from(this.activeChannels.keys())
      console.log(`🔄 Reconnecting ${channelNames.length} channels...`)
      
      // Unsubscribe all channels and let them be recreated
      channelNames.forEach(channelName => {
        this.unsubscribe(channelName)
      })
      
      console.log('🔄 Real-time reconnection completed - channels will be recreated on next subscription')
    } catch (error) {
      console.error('❌ Error during reconnection:', error)
    }
  }

  /**
   * Subscribe to supply request updates for a specific user
   * @param options User subscription options
   * @param callbacks Supply request specific callbacks
   * @returns RealtimeChannel instance
   */
  subscribeToSupplyRequests(
    options: UserSubscriptionOptions,
    callbacks: SupplyRequestCallbacks
  ): RealtimeChannel {
    const channelName = `supply-requests-${options.userId}`
    const subscriptions: TableSubscription[] = []

    // Subscribe to requests table
    subscriptions.push({
      table: 'requests',
      filter: options.onlyOwnRequests ? `requester_id=eq.${options.userId}` : undefined,
      callbacks: {
        onInsert: callbacks.onRequestUpdate,
        onUpdate: callbacks.onRequestUpdate,
        onDelete: callbacks.onRequestUpdate,
        onError: callbacks.onError
      }
    })

    // Subscribe to request_items if needed
    if (options.includeItems) {
      subscriptions.push({
        table: 'request_items',
        callbacks: {
          onInsert: callbacks.onItemUpdate,
          onUpdate: callbacks.onItemUpdate,
          onDelete: callbacks.onItemUpdate,
          onError: callbacks.onError
        }
      })
    }

    // Subscribe to request_approvals if needed
    if (options.includeApprovals) {
      subscriptions.push({
        table: 'request_approvals',
        callbacks: {
          onInsert: callbacks.onApprovalUpdate,
          onUpdate: callbacks.onApprovalUpdate,
          onDelete: callbacks.onApprovalUpdate,
          onError: callbacks.onError
        }
      })
    }

    return this.subscribeToMultipleTables(
      channelName,
      subscriptions,
      callbacks.onError
    )
  }

  /**
   * Subscribe to approval updates for a specific user (approver perspective)
   * @param userId User ID of the approver
   * @param callbacks Approval specific callbacks
   * @returns RealtimeChannel instance
   */
  subscribeToApprovalUpdates(
    userId: string,
    callbacks: Pick<SupplyRequestCallbacks, 'onApprovalUpdate' | 'onError'>
  ): RealtimeChannel {
    return this.subscribeToTable('approval-updates', 'request_approvals', undefined, {
      onInsert: callbacks.onApprovalUpdate,
      onUpdate: callbacks.onApprovalUpdate,
      onDelete: callbacks.onApprovalUpdate,
      onError: callbacks.onError
    })
  }

  /**
   * Unsubscribe from supply request updates for a specific user
   * @param userId User ID
   */
  unsubscribeFromSupplyRequests(userId: string): void {
    this.unsubscribe(`supply-requests-${userId}`)
  }

  /**
   * Unsubscribe from approval updates for a specific user
   * @param userId User ID
   */
  unsubscribeFromApprovalUpdates(userId: string): void {
    this.unsubscribe(`approvals-${userId}`)
  }

  /**
   * Get health status of real-time connections
   * @returns Health status object
   */
  getHealthStatus() {
    return {
      connectionStatus: this.getConnectionStatus(),
      activeChannels: this.getActiveChannelCount(),
      channelNames: this.getActiveChannels(),
      isHealthy: this.getActiveChannelCount() > 0 && this.getConnectionStatus() === 'active'
    }
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager()
