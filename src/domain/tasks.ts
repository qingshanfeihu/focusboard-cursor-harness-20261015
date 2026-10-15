import { isCalendarDate } from './dates'
import type { Task, TaskDraft } from './types'

export function emptyDraft(): TaskDraft {
  return {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    tags: '',
  }
}

export function draftFromTask(task: Task): TaskDraft {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? '',
    tags: task.tags.join(', '),
  }
}

export function normalizeTags(input: string): string[] {
  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of input.split(/[,，]/)) {
    const tag = part.trim()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
  }
  return tags
}

export function titleError(title: string): string | null {
  return title.trim() === '' ? '请填写标题' : null
}

export function taskFromDraft(draft: TaskDraft, existing?: Task, now = new Date()): Task | null {
  if (titleError(draft.title)) return null
  if (draft.dueDate && !isCalendarDate(draft.dueDate)) return null
  const timestamp = now.toISOString()
  return {
    id: existing?.id ?? crypto.randomUUID(),
    title: draft.title.trim(),
    description: draft.description.trim(),
    status: draft.status,
    priority: draft.priority,
    dueDate: draft.dueDate ? draft.dueDate : null,
    tags: normalizeTags(draft.tags),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}
