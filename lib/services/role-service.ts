import { BaseService } from './base-service'
import type { 
  RoleInsert, 
  RoleUpdate,
  ProfileWithDetails,
  RoleWithDepartment
} from '@/types/database'

/**
 * Service for managing roles and role hierarchies
 * Implements Repository pattern with hierarchy management
 */
export class RoleService extends BaseService {
  /**
   * Get all active roles
   */
  async getActiveRoles(): Promise<RoleWithDepartment[]> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RoleService.getActiveRoles')
    }
  }

  /**
   * Get all roles (including inactive)
   */
  async getAllRoles(): Promise<RoleWithDepartment[]> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .select(`
          *,
          department:departments(*)
        `)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RoleService.getAllRoles')
    }
  }

  /**
   * Get role by ID with department and hierarchy info
   */
  async getRoleById(id: string): Promise<RoleWithDepartment | null> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .select(`
          *,
          department:departments(*),
          parent_role_info:roles!parent_role(*)
        `)
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
      this.handleError(error, 'RoleService.getRoleById')
    }
  }

  /**
   * Get roles by department
   */
  async getRolesByDepartment(departmentId: string): Promise<RoleWithDepartment[]> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RoleService.getRolesByDepartment')
    }
  }

  /**
   * Get role hierarchy (parent and children)
   */
  async getRoleHierarchy(roleId: string): Promise<{
    role: RoleWithDepartment
    parent?: RoleWithDepartment
    children: RoleWithDepartment[]
  } | null> {
    try {
      const role = await this.getRoleById(roleId)
      if (!role) return null

      // Get parent role if exists
      let parent: RoleWithDepartment | undefined
      if (role.parent_role) {
        parent = await this.getRoleById(role.parent_role) || undefined
      }

      // Get child roles
      const { data: children, error: childrenError } = await this.supabase
        .from('roles')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('parent_role', roleId)
        .eq('is_active', true)
        .order('name')

      if (childrenError) throw childrenError

      return {
        role,
        parent,
        children: children || []
      }
    } catch (error) {
      this.handleError(error, 'RoleService.getRoleHierarchy')
    }
  }

  /**
   * Get all subordinate roles (recursive)
   */
  async getSubordinateRoles(roleId: string): Promise<RoleWithDepartment[]> {
    try {
      const subordinates: RoleWithDepartment[] = []
      
      // Get direct children
      const { data: directChildren, error } = await this.supabase
        .from('roles')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('parent_role', roleId)
        .eq('is_active', true)

      if (error) throw error

      if (directChildren) {
        subordinates.push(...directChildren)
        
        // Recursively get children of children
        for (const child of directChildren) {
          const childSubordinates = await this.getSubordinateRoles(child.id)
          subordinates.push(...childSubordinates)
        }
      }

      return subordinates
    } catch (error) {
      this.handleError(error, 'RoleService.getSubordinateRoles')
    }
  }

  /**
   * Get all supervisor roles (recursive up the hierarchy)
   */
  async getSupervisorRoles(roleId: string): Promise<RoleWithDepartment[]> {
    try {
      const supervisors: RoleWithDepartment[] = []
      
      const role = await this.getRoleById(roleId)
      if (!role || !role.parent_role) return supervisors

      const parent = await this.getRoleById(role.parent_role)
      if (parent) {
        supervisors.push(parent)
        
        // Recursively get parent's parents
        const parentSupervisors = await this.getSupervisorRoles(parent.id)
        supervisors.push(...parentSupervisors)
      }

      return supervisors
    } catch (error) {
      this.handleError(error, 'RoleService.getSupervisorRoles')
    }
  }

  /**
   * Create new role
   */
  async createRole(roleData: RoleInsert): Promise<RoleWithDepartment> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .insert({
          ...roleData,
          created_at: this.getCurrentTimestamp(),
          updated_at: this.getCurrentTimestamp()
        })
        .select(`
          *,
          department:departments(*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'RoleService.createRole')
    }
  }

  /**
   * Update role
   */
  async updateRole(id: string, updates: RoleUpdate): Promise<RoleWithDepartment> {
    try {
      const { data, error } = await this.supabase
        .from('roles')
        .update({
          ...updates,
          updated_at: this.getCurrentTimestamp()
        })
        .eq('id', id)
        .select(`
          *,
          department:departments(*)
        `)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      this.handleError(error, 'RoleService.updateRole')
    }
  }

  /**
   * Activate role
   */
  async activateRole(id: string): Promise<RoleWithDepartment> {
    try {
      return await this.updateRole(id, { is_active: true })
    } catch (error) {
      this.handleError(error, 'RoleService.activateRole')
    }
  }

  /**
   * Deactivate role
   */
  async deactivateRole(id: string): Promise<RoleWithDepartment> {
    try {
      return await this.updateRole(id, { is_active: false })
    } catch (error) {
      this.handleError(error, 'RoleService.deactivateRole')
    }
  }

  /**
   * Check if role name is available
   */
  async isRoleNameAvailable(name: string, excludeId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('roles')
        .select('id')
        .eq('name', name)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query

      if (error) throw error
      return !data || data.length === 0
    } catch (error) {
      this.handleError(error, 'RoleService.isRoleNameAvailable')
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(roleId: string): Promise<ProfileWithDetails[]> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          role:roles(
            id,
            name,
            department_id,
            is_active,
            parent_role
          ),
          department:roles!inner(departments(*))
        `)
        .eq('role_id', roleId)
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      return data || []
    } catch (error) {
      this.handleError(error, 'RoleService.getUsersByRole')
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(): Promise<{
    total: number
    active: number
    inactive: number
    byDepartment: Array<{
      department: string
      count: number
    }>
  }> {
    try {
      const [totalResult, activeResult, departmentResult] = await Promise.all([
        this.supabase
          .from('roles')
          .select('id', { count: 'exact', head: true }),
        this.supabase
          .from('roles')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        this.supabase
          .from('roles')
          .select(`
            department_id,
            departments!inner(name)
          `)
          .eq('is_active', true)
      ])

      if (totalResult.error) throw totalResult.error
      if (activeResult.error) throw activeResult.error
      if (departmentResult.error) throw departmentResult.error

      const total = totalResult.count || 0
      const active = activeResult.count || 0

      // Count by department
      const departmentCounts = new Map<string, number>()
      departmentResult.data?.forEach((role: { department_id: string; departments: { name: string }[] }) => {
        const deptName = role.departments[0]?.name || 'No Department'
        departmentCounts.set(deptName, (departmentCounts.get(deptName) || 0) + 1)
      })

      const byDepartment = Array.from(departmentCounts.entries()).map(([department, count]) => ({
        department,
        count
      }))

      return {
        total,
        active,
        inactive: total - active,
        byDepartment
      }
    } catch (error) {
      this.handleError(error, 'RoleService.getRoleStats')
    }
  }

  /**
   * Check if user can manage role (based on hierarchy)
   */
  async canUserManageRole(roleId: string): Promise<boolean> {
    try {
      const userProfile = await this.getCurrentUserProfile()
      
      if (!userProfile.role_id) return false

      // Get user's subordinate roles
      const subordinateRoles = await this.getSubordinateRoles(userProfile.role_id)
      
      // Check if target role is in subordinates or is the user's own role
      return roleId === userProfile.role_id || 
             subordinateRoles.some(role => role.id === roleId)
    } catch (error) {
      console.error('Error checking role management permission:', error)
      return false
    }
  }
}

export const roleService = new RoleService()
