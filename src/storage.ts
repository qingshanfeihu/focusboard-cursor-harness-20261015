import { parseImport } from './domain/transfer'
import { createSeedTasks } from './domain/seed'
import type { Task } from './domain/types'

export const STORAGE_KEY = 'focusboard.tasks.v1'

export interface LoadedTasks {
  tasks: Task[]
  warning: string | null
}

export function loadTasks(storage: Storage = localStorage, now = new Date()): LoadedTasks {
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { tasks: [], warning: '浏览器存储不可用，本次修改不会保留。' }
  }

  if (raw === null) {
    const tasks = createSeedTasks(now)
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      return { tasks, warning: '浏览器存储不可用，演示数据只保留在本次页面中。' }
    }
    return { tasks, warning: null }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('shape')
    const result = parseImport(JSON.stringify(parsed))
    if (!result.ok) throw new Error(result.message)
    return { tasks: result.tasks, warning: null }
  } catch {
    return {
      tasks: [],
      warning: '已保存的数据无法读取，已显示空白看板，原内容尚未覆盖。',
    }
  }
}

export function saveTasks(tasks: readonly Task[], storage: Storage = localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
