import { BaseService } from './base-service'
import type { 
  RequestType, 
  RequestTypeInsert, 
  RequestTypeUpdate 
} from '@/types/database'

/**
 * Service for managing request types
 */
export class RequestTypeService extends BaseService {
  /**
   * Get all active request types
   */
  async getActiveRequestTypes(): Promise<RequestType[]> {
    try {
      const { data, error } = await this.supabase
        .from('request_types')
        .select('*')
        .eq('is_active', true)
        .order('display_name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestTypeService.getActiveRequestTypes')
    }
  }

  /**
   * Get request type by name
   */
  async getRequestTypeByName(name: string): Promise<RequestType | null> {
    try {
      const { data, error } = await this.supabase
        .from('request_types')
        .select('*')
        .eq('name', name)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      this.handleError(error, 'RequestTypeService.getRequestTypeByName')
    }
  }

  /**
   * Get request type by ID
   */
  async getRequestTypeById(id: string): Promise<RequestType | null> {
    try {
      const { data, error } = await this.supabase
        .from('request_types')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      this.handleError(error, 'RequestTypeService.getRequestTypeById')
    }
  }

  /**
   * Get all request types (including inactive)
   */
  async getAllRequestTypes(): Promise<RequestType[]> {
    try {
      const { data, error } = await this.supabase
        .from('request_types')
        .select('*')
        .order('display_name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RequestTypeService.getAllRequestTypes')
    }
  }

  /**
   * Create new request type (admin only)
   */
  async createRequestType(requestType: RequestTypeInsert): Promise<RequestType> {
    try {
      const { data, error } = await this.supabase
        .from('request_types')
        .insert({
          ...requestType,
          created_at: this.getCurrentTimestamp(),
          updated_at: this.getCurrentTimestamp()
        })
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'RequestTypeService.createRequestType')
    }
  }

  /**
   * Update request type (admin only)
   */
  async updateRequestType(id: string, updates: RequestTypeUpdate): Promise<RequestType> {
    try {
      const { data, error } = await this.supabase
        .from('request_types')
        .update({
          ...updates,
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'RequestTypeService.updateRequestType')
    }
  }

  /**
   * Deactivate request type (soft delete)
   */
  async deactivateRequestType(id: string): Promise<RequestType> {
    try {
      const { data, error } = await this.supabase
        .from('request_types')
        .update({
          is_active: false,
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'RequestTypeService.deactivateRequestType')
    }
  }

  /**
   * Activate request type
   */
  async activateRequestType(id: string): Promise<RequestType> {
    try {
      const { data, error } = await this.supabase
        .from('request_types')
        .update({
          is_active: true,
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'RequestTypeService.activateRequestType')
    }
  }
}

export const requestTypeService = new RequestTypeService()
