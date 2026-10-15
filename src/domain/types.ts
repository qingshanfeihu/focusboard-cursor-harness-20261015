export const STATUSES = ['todo', 'doing', 'done'] as const
export type Status = (typeof STATUSES)[number]

export const PRIORITIES = ['low', 'medium', 'high'] as const
export type Priority = (typeof PRIORITIES)[number]

export interface Task {
  id: string
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface TaskDraft {
  title: string
  description: string
  status: Status
  priority: Priority
  dueDate: string
  tags: string
}

export const STATUS_LABEL: Record<Status, string> = {
  todo: '待办',
  doing: '进行中',
  done: '完成',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && STATUSES.includes(value as Status)
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === 'string' && PRIORITIES.includes(value as Priority)
}
