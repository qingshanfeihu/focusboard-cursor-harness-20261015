import type { Priority, Status, Task } from './types'

export interface TaskFilters {
  query: string
  status: Status | 'all'
  priority: Priority | 'all'
  tag: string | 'all'
  dueSort: 'none' | 'asc' | 'desc'
}

export const emptyFilters: TaskFilters = {
  query: '',
  status: 'all',
  priority: 'all',
  tag: 'all',
  dueSort: 'none',
}

export function filtersAreClear(filters: TaskFilters): boolean {
  return (
    filters.query.trim() === '' &&
    filters.status === 'all' &&
    filters.priority === 'all' &&
    filters.tag === 'all' &&
    filters.dueSort === 'none'
  )
}

function compareDue(a: Task, b: Task, direction: 'asc' | 'desc'): number {
  if (!a.dueDate && !b.dueDate) return 0
  if (!a.dueDate) return 1
  if (!b.dueDate) return -1
  const compared = a.dueDate.localeCompare(b.dueDate)
  return direction === 'asc' ? compared : -compared
}

export function filterTasks(tasks: readonly Task[], filters: TaskFilters): Task[] {
  const query = filters.query.trim().toLowerCase()
  const matched = tasks.filter((task) => {
    if (query) {
      const haystack = `${task.title}\n${task.description}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (filters.tag !== 'all' && !task.tags.includes(filters.tag)) return false
    return true
  })
  if (filters.dueSort === 'none') return matched
  return matched
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const byDue = compareDue(a.task, b.task, filters.dueSort as 'asc' | 'desc')
      return byDue === 0 ? a.index - b.index : byDue
    })
    .map((item) => item.task)
}

export function collectTags(tasks: readonly Task[]): string[] {
  const tags = new Set<string>()
  for (const task of tasks) {
    for (const tag of task.tags) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b, 'zh'))
}
