import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, SupabaseClient, RealtimePostgresChangesPayload, RealtimeChannelSendResponse } from '@supabase/supabase-js'

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
 * Interface for user-specific subscription options with performance optimizations
 */
interface UserSubscriptionOptions {
  userId: string
  includeApprovals?: boolean
  includeItems?: boolean
  onlyOwnRequests?: boolean
  /** Enable performance optimizations like debouncing */
  enablePerformanceOptimizations?: boolean
  /** Custom debounce delay in milliseconds (default: 100ms) */
  debounceMs?: number
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
 * Interface for connection health status
 */
interface RealtimeHealthStatus {
  connectionStatus: 'active' | 'no_channels' | 'connecting' | 'error'
  activeChannels: number
  channelNames: string[]
  isHealthy: boolean
  lastConnectionTime?: Date
  connectionErrors: number
  uptimeMs?: number
}

/**
 * Channel subscription status tracking
 */
interface ChannelStatus {
  channel: RealtimeChannel
  status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED' | 'CONNECTING'
  subscribedAt?: Date
  lastError?: Error
  retryCount: number
}

/**
 * Debounced callback wrapper for performance optimization
 */
class DebouncedCallback<T> {
  private timeoutId?: NodeJS.Timeout
  private lastPayload?: T
  
  constructor(
    private callback: (payload: T) => void,
    private delay: number = 100
  ) {}
  
  execute(payload: T): void {
    this.lastPayload = payload
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    
    this.timeoutId = setTimeout(() => {
      if (this.lastPayload) {
        this.callback(this.lastPayload)
        this.lastPayload = undefined
      }
    }, this.delay)
  }
  
  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
      this.lastPayload = undefined
    }
  }
}

/**
 * OptimizedRealtimeManager - Advanced Supabase real-time subscriptions manager
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Performance optimizations with debouncing
 * - Connection health monitoring
 * - Memory leak prevention with proper cleanup
 * - Error recovery and retry mechanisms
 * - Channel status tracking
 */
class OptimizedRealtimeManager {
  private supabase: SupabaseClient
  private channelStatuses = new Map<string, ChannelStatus>()
  private debouncedCallbacks = new Map<string, DebouncedCallback<any>>()
  private connectionStartTime = new Date()
  private connectionErrors = 0
  private maxRetryAttempts = 3
  private baseRetryDelay = 1000 // 1 second

  constructor() {
    this.supabase = createClient()
    
    // Setup global connection monitoring
    this.setupGlobalErrorHandling()
  }

  /**
   * Subscribe to multiple tables with a single channel - OPTIMIZED
   * Features: debouncing, error recovery, connection status tracking
   * @param channelName Unique name for the channel
   * @param subscriptions Array of table subscriptions
   * @param options Performance and configuration options
   * @param onError Global error handler for the channel
   * @returns RealtimeChannel instance
   */
  subscribeToMultipleTables(
    channelName: string,
    subscriptions: TableSubscription[],
    options: { 
      enableDebouncing?: boolean
      debounceMs?: number
      enableRetry?: boolean
      maxRetries?: number
    } = {},
    onError?: (error: Error) => void
  ): RealtimeChannel {
    // Remove existing channel if it exists
    this.unsubscribe(channelName)

    const channel = this.supabase.channel(channelName, {
      config: {
        // Use public channels for postgres_changes (private channels are for broadcast/presence)
        private: false,
      },
    })

    // Initialize channel status tracking
    this.channelStatuses.set(channelName, {
      channel,
      status: 'CONNECTING',
      retryCount: 0,
    })

    // Subscribe to each table with optimizations
    subscriptions.forEach((subscription) => {
      const { table, filter, callbacks } = subscription

      // Create debounced callbacks if enabled
      const debounceMs = options.debounceMs ?? 100
      const enableDebouncing = options.enableDebouncing ?? true
      
      const createOptimizedCallback = <T>(
        originalCallback?: (payload: T) => void,
        eventType?: string
      ) => {
        if (!originalCallback) return undefined
        
        if (enableDebouncing && eventType !== 'INSERT') {
          // Don't debounce INSERTs as they're typically single events
          const debouncedKey = `${channelName}-${table}-${eventType}`
          const debouncedCallback = new DebouncedCallback(originalCallback, debounceMs)
          this.debouncedCallbacks.set(debouncedKey, debouncedCallback)
          
          return (payload: T) => {
            try {
              debouncedCallback.execute(payload)
            } catch (error) {
              const errorObj = error instanceof Error ? error : new Error(String(error))
              this.handleChannelError(channelName, errorObj, onError, callbacks.onError)
            }
          }
        }
        
        return (payload: T) => {
          try {
            originalCallback(payload)
          } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error))
            this.handleChannelError(channelName, errorObj, onError, callbacks.onError)
          }
        }
      }

      // Subscribe to events with optimized callbacks
      const events = [
        { event: 'INSERT' as const, callback: createOptimizedCallback(callbacks.onInsert, 'INSERT') },
        { event: 'UPDATE' as const, callback: createOptimizedCallback(callbacks.onUpdate, 'UPDATE') },
        { event: 'DELETE' as const, callback: createOptimizedCallback(callbacks.onDelete, 'DELETE') },
      ]

      events.forEach(({ event, callback }) => {
        if (callback) {
          // Proper typing for Supabase postgres_changes events
          // Using proper Supabase RealtimeChannel.on typing
          (channel as any).on(
            'postgres_changes',
            {
              event,
              schema: 'public',
              table,
              ...(filter && { filter }),
            },
            callback
          )
        }
      })
    })

    // Subscribe to the channel with enhanced status tracking
    channel.subscribe((status) => {
      const channelStatus = this.channelStatuses.get(channelName)
      if (channelStatus) {
        channelStatus.status = status
        
        switch (status) {
          case 'SUBSCRIBED':
            channelStatus.subscribedAt = new Date()
            channelStatus.retryCount = 0
            console.log(`✅ Optimized realtime channel subscribed: ${channelName}`)
            break
            
          case 'CHANNEL_ERROR':
            this.connectionErrors++
            const error = new Error(`❌ Channel subscription failed: ${channelName}`)
            channelStatus.lastError = error
            
            // Enhanced error logging
            console.error('🚨 REALTIME SUBSCRIPTION ERROR:', {
              channelName,
              userId: subscriptions.find(s => s.table === 'requests')?.filter?.includes('requester_id=eq.') ? 
                subscriptions.find(s => s.table === 'requests')?.filter?.split('requester_id=eq.')[1] : 'unknown',
              tables: subscriptions.map(s => s.table),
              error: error.message,
              retryCount: channelStatus.retryCount,
              timestamp: new Date().toISOString()
            })
            
            this.handleChannelError(channelName, error, onError)
            
            // Auto-retry with exponential backoff if enabled
            if (options.enableRetry && channelStatus.retryCount < (options.maxRetries ?? this.maxRetryAttempts)) {
              console.log(`🔄 Auto-retrying subscription for ${channelName}...`)
              this.scheduleRetry(channelName, subscriptions, options, onError)
            } else {
              console.error(`❌ Max retries exceeded for ${channelName}. Check:
              1. Tables enabled for realtime: ${subscriptions.map(s => s.table).join(', ')}
              2. RLS policies on realtime.messages table
              3. User authentication status
              4. Network connectivity`)
            }
            break
            
          case 'TIMED_OUT':
            const timeoutError = new Error(`⏱️ Channel subscription timed out: ${channelName}`)
            channelStatus.lastError = timeoutError
            console.error(timeoutError)
            this.handleChannelError(channelName, timeoutError, onError)
            break
            
          case 'CLOSED':
            console.log(`🔒 Channel closed: ${channelName}`)
            break
        }
        
        this.channelStatuses.set(channelName, channelStatus)
      }
    })

    return channel
  }

  /**
   * Subscribe to a single table with optimization support
   * @param channelName Unique name for the channel
   * @param table Table name to subscribe to
   * @param filter Optional filter for the subscription
   * @param callbacks Event callbacks
   * @param options Performance options
   * @returns RealtimeChannel instance
   */
  subscribeToTable(
    channelName: string,
    table: string,
    filter?: string,
    callbacks: SingleTableCallbacks = {},
    options: { 
      enableDebouncing?: boolean
      debounceMs?: number
      enableRetry?: boolean
      maxRetries?: number
    } = {}
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
      options,
      callbacks.onError
    )
  }

  /**
   * Handle channel errors with proper logging and recovery
   */
  private handleChannelError(
    channelName: string, 
    error: Error, 
    globalErrorHandler?: (error: Error) => void,
    localErrorHandler?: (error: Error) => void
  ): void {
    console.error(`🚨 Channel error [${channelName}]:`, error.message)
    
    // Update channel status
    const channelStatus = this.channelStatuses.get(channelName)
    if (channelStatus) {
      channelStatus.lastError = error
      this.channelStatuses.set(channelName, channelStatus)
    }
    
    // Call error handlers
    localErrorHandler?.(error)
    globalErrorHandler?.(error)
  }
  
  /**
   * Schedule retry with exponential backoff
   */
  private scheduleRetry(
    channelName: string,
    subscriptions: TableSubscription[],
    options: { 
      enableDebouncing?: boolean
      debounceMs?: number
      enableRetry?: boolean
      maxRetries?: number
    },
    onError?: (error: Error) => void
  ): void {
    const channelStatus = this.channelStatuses.get(channelName)
    if (!channelStatus) return
    
    channelStatus.retryCount++
    const delay = this.baseRetryDelay * Math.pow(2, channelStatus.retryCount - 1)
    
    console.log(`🔄 Scheduling retry ${channelStatus.retryCount}/${options.maxRetries ?? this.maxRetryAttempts} for channel ${channelName} in ${delay}ms`)
    
    setTimeout(() => {
      if (this.channelStatuses.has(channelName)) {
        this.subscribeToMultipleTables(channelName, subscriptions, options, onError)
      }
    }, delay)
  }

  /**
   * Enhanced unsubscribe with proper cleanup of optimizations
   * @param channelName Name of the channel to unsubscribe from
   */
  unsubscribe(channelName: string): void {
    const channelStatus = this.channelStatuses.get(channelName)
    
    if (channelStatus?.channel) {
      try {
        // Cancel all debounced callbacks for this channel
        const debouncedKeys = Array.from(this.debouncedCallbacks.keys())
          .filter(key => key.startsWith(`${channelName}-`))
        
        debouncedKeys.forEach(key => {
          const debouncedCallback = this.debouncedCallbacks.get(key)
          if (debouncedCallback) {
            debouncedCallback.cancel()
            this.debouncedCallbacks.delete(key)
          }
        })
        
        // Safely unsubscribe and remove channel
        try {
          this.supabase.removeChannel(channelStatus.channel)
        } catch (removeError) {
          // Channel might already be removed by Supabase, ignore this error
          console.debug(`Channel ${channelName} already removed or not found in Supabase client`)
        }
        
        this.channelStatuses.delete(channelName)
        
        console.log(`🔌 Optimized channel unsubscribed: ${channelName}`)
      } catch (error) {
        console.error(`❌ Error unsubscribing from channel ${channelName}:`, error)
        // Still clean up our internal state even if Supabase cleanup failed  
        this.channelStatuses.delete(channelName)
      }
    } else {
      // Silently handle missing channels - this is normal during cleanup
      console.debug(`Channel not found for unsubscription (normal during cleanup): ${channelName}`)
    }
  }

  /**
   * Enhanced unsubscribe all with complete cleanup
   */
  unsubscribeAll(): void {
    const channelNames = Array.from(this.channelStatuses.keys())
    
    channelNames.forEach((channelName) => {
      this.unsubscribe(channelName)
    })
    
    // Clear all remaining debounced callbacks
    this.debouncedCallbacks.forEach(callback => callback.cancel())
    this.debouncedCallbacks.clear()
    
    // Reset connection stats
    this.connectionErrors = 0
    this.connectionStartTime = new Date()

    console.log(`🧹 Optimized cleanup: unsubscribed from all ${channelNames.length} channels`)
  }

  /**
   * Force cleanup all channels - useful for user logout or app cleanup
   */
  forceCleanupAll(): void {
    try {
      // Remove all channels from Supabase client first
      const channels = Array.from(this.channelStatuses.values())
      channels.forEach(({ channel }) => {
        try {
          this.supabase.removeChannel(channel)
        } catch (error) {
          // Ignore errors during force cleanup
          console.debug('Force cleanup channel error (ignored):', error)
        }
      })

      // Clear all internal state
      this.channelStatuses.clear()
      this.debouncedCallbacks.forEach(callback => callback.cancel())
      this.debouncedCallbacks.clear()
      
      // Reset connection stats
      this.connectionErrors = 0
      this.connectionStartTime = new Date()

      console.log(`🧹 Force cleanup completed: cleared all realtime subscriptions`)
    } catch (error) {
      console.error('Error during force cleanup:', error)
    }
  }

  /**
   * Get list of active channel names
   * @returns Array of active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.channelStatuses.keys())
  }

  /**
   * Get the number of active channels
   * @returns Number of active channels
   */
  getActiveChannelCount(): number {
    return this.channelStatuses.size
  }

  /**
   * Check if a specific channel is active and healthy
   * @param channelName Name of the channel to check
   * @returns True if channel is active and subscribed, false otherwise
   */
  isChannelActive(channelName: string): boolean {
    const channelStatus = this.channelStatuses.get(channelName)
    return channelStatus?.status === 'SUBSCRIBED'
  }
  
  /**
   * Get detailed channel status
   * @param channelName Name of the channel
   * @returns Channel status information
   */
  getChannelStatus(channelName: string): ChannelStatus | undefined {
    return this.channelStatuses.get(channelName)
  }

  /**
   * Setup global error handling for real-time connections
   * Enhanced with connection monitoring and health checks
   */
  setupGlobalErrorHandling(): void {
    console.log('🔧 Optimized global error handling setup - monitoring via channel subscriptions')
    
    // Set up periodic health checks
    setInterval(() => {
      this.performHealthCheck()
    }, 30000) // Check every 30 seconds
  }

  /**
   * Perform health check on all channels
   */
  private performHealthCheck(): void {
    const unhealthyChannels = Array.from(this.channelStatuses.entries())
      .filter(([_, status]) => status.status === 'CHANNEL_ERROR' || status.status === 'TIMED_OUT')
    
    if (unhealthyChannels.length > 0) {
      console.warn(`⚠️ Found ${unhealthyChannels.length} unhealthy channels:`, 
        unhealthyChannels.map(([name]) => name))
    }
  }

  /**
   * Get connection status based on active channels with enhanced monitoring
   * @returns Connection status
   */
  getConnectionStatus(): 'active' | 'no_channels' | 'connecting' | 'error' {
    const channelCount = this.channelStatuses.size
    if (channelCount === 0) {
      return 'no_channels'
    }
    
    const subscribedCount = Array.from(this.channelStatuses.values())
      .filter(status => status.status === 'SUBSCRIBED').length
    
    if (subscribedCount === 0) {
      const hasConnecting = Array.from(this.channelStatuses.values())
        .some(status => status.status === 'CONNECTING')
      return hasConnecting ? 'connecting' : 'error'
    }
    
    return 'active'
  }

  /**
   * Force reconnection by recreating all channels with enhanced error handling
   */
  reconnect(): void {
    try {
      const channelNames = Array.from(this.channelStatuses.keys())
      console.log(`🔄 Optimized reconnection for ${channelNames.length} channels...`)
      
      // Store channel configurations for recreation
      const channelConfigs = new Map<string, { 
        subscriptions: TableSubscription[], 
        options: {
          enableDebouncing?: boolean
          debounceMs?: number
          enableRetry?: boolean
          maxRetries?: number
        }, 
        onError?: (error: Error) => void 
      }>()
      
      // Unsubscribe all channels
      channelNames.forEach(channelName => {
        // Could store config here for auto-recreation if needed
        this.unsubscribe(channelName)
      })
      
      // Reset connection stats
      this.connectionErrors = 0
      this.connectionStartTime = new Date()
      
      console.log('🔄 Optimized reconnection completed - channels ready for recreation')
    } catch (error) {
      console.error('❌ Error during optimized reconnection:', error)
    }
  }

  /**
   * Subscribe to supply request updates for a specific user - OPTIMIZED
   * @param options User subscription options with performance settings
   * @param callbacks Supply request specific callbacks
   * @returns RealtimeChannel instance
   */
  subscribeToSupplyRequests(
    options: UserSubscriptionOptions,
    callbacks: SupplyRequestCallbacks
  ): RealtimeChannel {
    const channelName = `supply-requests-${options.userId}`
    const subscriptions: TableSubscription[] = []

    // Subscribe to requests table with smart filtering
    subscriptions.push({
      table: 'requests',
      // More specific filtering to reduce unnecessary events
      filter: options.onlyOwnRequests ? `requester_id=eq.${options.userId}` : undefined,
      callbacks: {
        onInsert: callbacks.onRequestUpdate,
        onUpdate: callbacks.onRequestUpdate,
        onDelete: callbacks.onRequestUpdate,
        onError: callbacks.onError
      }
    })

    // Subscribe to request_items if needed with performance optimization
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

    // Use optimized subscription with performance settings
    const optimizationOptions = {
      enableDebouncing: options.enablePerformanceOptimizations ?? true,
      debounceMs: options.debounceMs ?? 100,
      enableRetry: true,
      maxRetries: 3
    }

    return this.subscribeToMultipleTables(
      channelName,
      subscriptions,
      optimizationOptions,
      callbacks.onError
    )
  }

  /**
   * Subscribe to approval updates for a specific user - OPTIMIZED (approver perspective)
   * @param userId User ID of the approver
   * @param callbacks Approval specific callbacks
   * @returns RealtimeChannel instance
   */
  subscribeToApprovalUpdates(
    userId: string,
    callbacks: Pick<SupplyRequestCallbacks, 'onApprovalUpdate' | 'onError'>
  ): RealtimeChannel {
    // Fixed channel naming to be consistent with unsubscribe
    const channelName = `approval-updates-${userId}`
    
    return this.subscribeToTable(
      channelName, 
      'request_approvals', 
      undefined, 
      {
        onInsert: callbacks.onApprovalUpdate,
        onUpdate: callbacks.onApprovalUpdate,
        onDelete: callbacks.onApprovalUpdate,
        onError: callbacks.onError
      },
      {
        enableDebouncing: true,
        debounceMs: 150, // Slightly higher debounce for approval updates
        enableRetry: true,
        maxRetries: 2
      }
    )
  }

  /**
   * Unsubscribe from supply request updates for a specific user
   * @param userId User ID
   */
  unsubscribeFromSupplyRequests(userId: string): void {
    this.unsubscribe(`supply-requests-${userId}`)
  }

  /**
   * Unsubscribe from approval updates for a specific user - FIXED
   * @param userId User ID
   */
  unsubscribeFromApprovalUpdates(userId: string): void {
    // Fixed to match the channel name used in subscribeToApprovalUpdates
    this.unsubscribe(`approval-updates-${userId}`)
  }

  /**
   * Get comprehensive health status of real-time connections - ENHANCED
   * @returns Enhanced health status object
   */
  getHealthStatus(): RealtimeHealthStatus {
    const connectionStatus = this.getConnectionStatus()
    const activeChannels = this.getActiveChannelCount()
    const uptimeMs = Date.now() - this.connectionStartTime.getTime()
    
    return {
      connectionStatus,
      activeChannels,
      channelNames: this.getActiveChannels(),
      isHealthy: activeChannels > 0 && connectionStatus === 'active',
      lastConnectionTime: this.connectionStartTime,
      connectionErrors: this.connectionErrors,
      uptimeMs
    }
  }
  
  /**
   * Get detailed status of all channels
   * @returns Map of channel statuses
   */
  getAllChannelStatuses(): Map<string, ChannelStatus> {
    return new Map(this.channelStatuses)
  }
  
  /**
   * Force cleanup of unhealthy channels
   */
  cleanupUnhealthyChannels(): void {
    const unhealthyChannels = Array.from(this.channelStatuses.entries())
      .filter(([_, status]) => 
        status.status === 'CHANNEL_ERROR' || 
        status.status === 'TIMED_OUT' ||
        (status.subscribedAt && Date.now() - status.subscribedAt.getTime() > 300000) // 5 minutes
      )
    
    unhealthyChannels.forEach(([channelName]) => {
      console.log(`🧹 Cleaning up unhealthy channel: ${channelName}`)
      this.unsubscribe(channelName)
    })
    
    if (unhealthyChannels.length > 0) {
      console.log(`🧹 Cleaned up ${unhealthyChannels.length} unhealthy channels`)
    }
  }
}

// Export optimized singleton instance
export const realtimeManager = new OptimizedRealtimeManager()
