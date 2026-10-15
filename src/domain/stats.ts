import type { Task } from './types'

export interface Overview {
  total: number
  completionRate: number
  overdue: number
}

export function isOverdue(task: Task, today: string): boolean {
  if (task.status === 'done' || !task.dueDate) return false
  return task.dueDate < today
}

export function overview(tasks: readonly Task[], today: string): Overview {
  const total = tasks.length
  const done = tasks.filter((task) => task.status === 'done').length
  return {
    total,
    completionRate: total === 0 ? 0 : done / total,
    overdue: tasks.filter((task) => isOverdue(task, today)).length,
  }
}

export function formatRate(rate: number): string {
  if (!Number.isFinite(rate)) return '0%'
  return `${Math.round(rate * 100)}%`
}
