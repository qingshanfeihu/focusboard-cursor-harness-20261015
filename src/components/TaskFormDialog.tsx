import { useState, type FormEvent } from 'react'
import { PRIORITIES, STATUSES, PRIORITY_LABEL, STATUS_LABEL, type Task, type TaskDraft } from '../domain/types'
import { draftFromTask, emptyDraft, taskFromDraft, titleError } from '../domain/tasks'
import { Dialog } from './Dialog'

export function TaskFormDialog({
  task,
  onClose,
  onSave,
}: {
  task?: Task
  onClose: () => void
  onSave: (task: Task) => void
}) {
  const [draft, setDraft] = useState<TaskDraft>(() => (task ? draftFromTask(task) : emptyDraft()))
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    if (key === 'title') setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const nextError = titleError(draft.title)
    if (nextError) {
      setError(nextError)
      return
    }
    const next = taskFromDraft(draft, task)
    if (!next) {
      setError('请检查标题和截止日期。')
      return
    }
    onSave(next)
  }

  return (
    <Dialog title={task ? '编辑任务' : '新建任务'} onClose={onClose} initialFocusSelector="#task-title">
      <form className="dialog-form" onSubmit={onSubmit}>
        <div className="dialog-body">
          <label htmlFor="task-title">标题</label>
          <input
            id="task-title"
            value={draft.title}
            onChange={(event) => update('title', event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'task-title-error' : undefined}
          />
          {error ? (
            <p id="task-title-error" className="field-error" role="alert">
              {error}
            </p>
          ) : null}

          <label htmlFor="task-description">描述</label>
          <textarea
            id="task-description"
            rows={4}
            value={draft.description}
            onChange={(event) => update('description', event.target.value)}
          />

          <div className="form-grid">
            <div>
              <label htmlFor="task-status">状态</label>
              <select
                id="task-status"
                value={draft.status}
                onChange={(event) => update('status', event.target.value as TaskDraft['status'])}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="task-priority">优先级</label>
              <select
                id="task-priority"
                value={draft.priority}
                onChange={(event) => update('priority', event.target.value as TaskDraft['priority'])}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABEL[priority]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="task-due">截止日期</label>
          <input
            id="task-due"
            type="date"
            value={draft.dueDate}
            onChange={(event) => update('dueDate', event.target.value)}
          />

          <label htmlFor="task-tags">标签</label>
          <input
            id="task-tags"
            value={draft.tags}
            placeholder="用逗号分隔"
            onChange={(event) => update('tags', event.target.value)}
          />
          <p className="field-hint">多个标签用逗号分隔，留空表示没有标签。</p>
        </div>
        <div className="dialog-actions">
          <button type="button" id="dialog-cancel" className="button button-ghost" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="button button-primary">
            保存
          </button>
        </div>
      </form>
    </Dialog>
  )
}
