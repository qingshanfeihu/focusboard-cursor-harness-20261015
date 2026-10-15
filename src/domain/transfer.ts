import { isCalendarDate } from './dates'
import { isPriority, isStatus, type Task } from './types'

export interface ImportFailure {
  ok: false
  message: string
}

export interface ImportSuccess {
  ok: true
  tasks: Task[]
}

export type ImportResult = ImportFailure | ImportSuccess

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  const task = value as Record<string, unknown>
  if (typeof task.id !== 'string' || task.id.trim() === '') return false
  if (typeof task.title !== 'string' || task.title.trim() === '') return false
  if (typeof task.description !== 'string') return false
  if (!isStatus(task.status) || !isPriority(task.priority)) return false
  if (task.dueDate !== null && (typeof task.dueDate !== 'string' || !isCalendarDate(task.dueDate))) return false
  if (!Array.isArray(task.tags) || task.tags.some((tag) => typeof tag !== 'string' || tag.trim() === '')) return false
  if (typeof task.createdAt !== 'string' || !Number.isFinite(Date.parse(task.createdAt))) return false
  if (typeof task.updatedAt !== 'string' || !Number.isFinite(Date.parse(task.updatedAt))) return false
  return true
}

function copyTask(task: Task): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    tags: [...task.tags],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }
}

export function parseImport(raw: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, message: '文件不是有效的 JSON。' }
  }

  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { tasks?: unknown }).tasks)
      ? (data as { tasks: unknown[] }).tasks
      : null
  if (!list) {
    return { ok: false, message: '导入内容必须是任务数组，或包含 tasks 数组的对象。' }
  }

  const tasks: Task[] = []
  const ids = new Set<string>()
  for (let index = 0; index < list.length; index += 1) {
    const item = list[index]
    if (!isTask(item)) {
      return { ok: false, message: `第 ${index + 1} 条任务字段不完整或取值无效，未导入任何内容。` }
    }
    if (ids.has(item.id)) {
      return { ok: false, message: `第 ${index + 1} 条任务的 id 重复，未导入任何内容。` }
    }
    ids.add(item.id)
    tasks.push(copyTask(item))
  }
  return { ok: true, tasks }
}

export function serializeTasks(tasks: readonly Task[]): string {
  return JSON.stringify({ version: 1, tasks: tasks.map((task) => copyTask(task)) }, null, 2)
}

export function applyImport(current: Task[], raw: string): { tasks: Task[]; error: string | null } {
  const result = parseImport(raw)
  if (!result.ok) return { tasks: current, error: result.message }
  return { tasks: result.tasks, error: null }
}
