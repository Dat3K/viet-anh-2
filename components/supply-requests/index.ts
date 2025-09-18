// Main components
export { StatsCards, CompactStatsCards } from './stats-cards'
export { FiltersSection, CompactFiltersSection } from './filters-section'
export { RequestsTable, SimpleRequestsTable } from './requests-table'
export { EmptyState } from './empty-state'

// Re-export badge components for convenience
export { StatusBadge, statusConfig, getStatusConfig, getStatusOptions } from '../ui/status-badge'
export { PriorityBadge, priorityConfig, getPriorityConfig, getPriorityOptions, getPriorityWeight } from '../ui/priority-badge'

// Types
export type { StatusType } from '../ui/status-badge'
export type { PriorityType } from '../ui/priority-badge'
export type { StatusFilter, PriorityFilter } from './filters-section'
