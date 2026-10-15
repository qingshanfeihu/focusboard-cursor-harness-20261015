import { isOverdue } from '../domain/stats'
import { STATUSES, PRIORITY_LABEL, STATUS_LABEL, type Status, type Task } from '../domain/types'

function formatDue(task: Task, today: string): string {
  if (!task.dueDate) return '无截止日期'
  if (task.dueDate === today) return `今天到期 ${task.dueDate}`
  if (isOverdue(task, today)) return `已逾期 ${task.dueDate}`
  return task.dueDate
}

export function TaskCard({
  task,
  today,
  onEdit,
  onDelete,
  onStatus,
}: {
  task: Task
  today: string
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatus: (task: Task, status: Status) => void
}) {
  const overdue = isOverdue(task, today)
  return (
    <article className={`task-card priority-${task.priority}${overdue ? ' is-overdue' : ''}`}>
      <header className="task-card-top">
        <h3>{task.title}</h3>
        <span className={`priority priority-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
      </header>
      {task.description ? <p className="task-description">{task.description}</p> : null}
      <p className={`due${overdue ? ' due-overdue' : ''}`}>{formatDue(task, today)}</p>
      {task.tags.length > 0 ? (
        <ul className="tags">
          {task.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      ) : null}
      <div className="task-actions">
        <select
          aria-label={`状态 ${task.title}`}
          value={task.status}
          onChange={(event) => onStatus(task, event.target.value as Status)}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <button type="button" className="button button-ghost" aria-label={`编辑 ${task.title}`} onClick={() => onEdit(task)}>
          编辑
        </button>
        <button type="button" className="button button-danger" aria-label={`删除 ${task.title}`} onClick={() => onDelete(task)}>
          删除
        </button>
      </div>
    </article>
  )
}

export function Board({
  tasks,
  today,
  onEdit,
  onDelete,
  onStatus,
}: {
  tasks: Task[]
  today: string
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatus: (task: Task, status: Status) => void
}) {
  return (
    <div className="board">
      {STATUSES.map((status) => {
        const column = tasks.filter((task) => task.status === status)
        return (
          <section key={status} className={`column column-${status}`} aria-labelledby={`column-${status}`}>
            <header className="column-header">
              <h2 id={`column-${status}`}>{STATUS_LABEL[status]}</h2>
              <span>{column.length}</span>
            </header>
            {column.length === 0 ? <p className="column-empty">这一列没有任务</p> : null}
            <div className="column-cards">
              {column.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  today={today}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatus={onStatus}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export function TaskList({
  tasks,
  today,
  onEdit,
  onDelete,
  onStatus,
}: {
  tasks: Task[]
  today: string
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatus: (task: Task, status: Status) => void
}) {
  return (
    <div className="task-list" role="list" aria-label="任务列表">
      {tasks.map((task) => (
        <div key={task.id} role="listitem">
          <TaskCard task={task} today={today} onEdit={onEdit} onDelete={onDelete} onStatus={onStatus} />
        </div>
      ))}
    </div>
  )
}
