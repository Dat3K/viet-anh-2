import { BaseService } from './base-service'
import type { 
  Department, 
  DepartmentInsert, 
  DepartmentUpdate 
} from '@/types/database'

/**
 * Service for managing departments
 * Implements Repository pattern for department operations
 */
export class DepartmentService extends BaseService {
  /**
   * Get all active departments
   */
  async getActiveDepartments(): Promise<Department[]> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'DepartmentService.getActiveDepartments')
    }
  }

  /**
   * Get all departments (including inactive)
   */
  async getAllDepartments(): Promise<Department[]> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
        .select('*')
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'DepartmentService.getAllDepartments')
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string): Promise<Department | null> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
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
      this.handleError(error, 'DepartmentService.getDepartmentById')
    }
  }

  /**
   * Get department by code
   */
  async getDepartmentByCode(code: string): Promise<Department | null> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
        .select('*')
        .eq('code', code)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return data
    } catch (error) {
      this.handleError(error, 'DepartmentService.getDepartmentByCode')
    }
  }

  /**
   * Create new department
   */
  async createDepartment(departmentData: DepartmentInsert): Promise<Department> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
        .insert({
          ...departmentData,
          created_at: this.getCurrentTimestamp(),
          updated_at: this.getCurrentTimestamp()
        })
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'DepartmentService.createDepartment')
    }
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, updates: DepartmentUpdate): Promise<Department> {
    try {
      const { data, error } = await this.supabase
        .from('departments')
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
      this.handleError(error, 'DepartmentService.updateDepartment')
    }
  }

  /**
   * Activate department
   */
  async activateDepartment(id: string): Promise<Department> {
    try {
      return await this.updateDepartment(id, { is_active: true })
    } catch (error) {
      this.handleError(error, 'DepartmentService.activateDepartment')
    }
  }

  /**
   * Deactivate department
   */
  async deactivateDepartment(id: string): Promise<Department> {
    try {
      return await this.updateDepartment(id, { is_active: false })
    } catch (error) {
      this.handleError(error, 'DepartmentService.deactivateDepartment')
    }
  }

  /**
   * Check if department code is available
   */
  async isDepartmentCodeAvailable(code: string, excludeId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('departments')
        .select('id')
        .eq('code', code)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) throw error
      return !data || data.length === 0
    } catch (error) {
      this.handleError(error, 'DepartmentService.isDepartmentCodeAvailable')
    }
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(): Promise<{
    total: number
    active: number
    inactive: number
  }> {
    try {
      const [totalResult, activeResult] = await Promise.all([
        this.supabase
          .from('departments')
          .select('id', { count: 'exact', head: true }),
        this.supabase
          .from('departments')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true)
      ])

      if (totalResult.error) throw totalResult.error
      if (activeResult.error) throw activeResult.error

      const total = totalResult.count || 0
      const active = activeResult.count || 0

      return {
        total,
        active,
        inactive: total - active
      }
    } catch (error) {
      this.handleError(error, 'DepartmentService.getDepartmentStats')
    }
  }
}

export const departmentService = new DepartmentService()
