import { useMemo, useState } from 'react'
import { Dialog } from './components/Dialog'
import { TaskFormDialog } from './components/TaskFormDialog'
import { Board, TaskList } from './components/TaskViews'
import { todayKey } from './domain/dates'
import { collectTags, emptyFilters, filterTasks, filtersAreClear } from './domain/filter'
import { formatRate, overview } from './domain/stats'
import { applyImport, serializeTasks } from './domain/transfer'
import { PRIORITIES, STATUSES, PRIORITY_LABEL, STATUS_LABEL, type Status, type Task } from './domain/types'
import { useTasks } from './store'

function readFile(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('无法读取文件'))
    reader.readAsText(file)
  })
}

export function App() {
  const { state, dispatch } = useTasks()
  const [today] = useState(() => todayKey())
  const [editing, setEditing] = useState<Task | null | undefined>(undefined)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const visible = useMemo(() => filterTasks(state.tasks, state.filters), [state.tasks, state.filters])
  const tags = useMemo(() => collectTags(state.tasks), [state.tasks])
  const stats = overview(state.tasks, today)
  const dialogOpen = editing !== undefined || pendingDelete !== null || confirmClear

  function setFilter<K extends keyof typeof state.filters>(key: K, value: (typeof state.filters)[K]) {
    dispatch({ type: 'set-filters', filters: { ...state.filters, [key]: value } })
  }

  function onSave(task: Task) {
    const creating = editing === null
    dispatch({ type: 'save-task', task, notice: creating ? '已创建任务。' : '已保存修改。' })
    setEditing(undefined)
  }

  function onStatus(task: Task, status: Status) {
    dispatch({ type: 'patch-task', task: { ...task, status, updatedAt: new Date().toISOString() } })
  }

  async function onImport(file: File, input: HTMLInputElement) {
    const text = await readFile(file)
    const next = applyImport(state.tasks, text)
    input.value = ''
    if (next.error) {
      setImportError(next.error)
      return
    }
    setImportError(null)
    dispatch({ type: 'import', tasks: next.tasks })
  }

  function onExport() {
    const blob = new Blob([serializeTasks(state.tasks)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'focusboard-tasks.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <div className="app-shell" inert={dialogOpen ? true : undefined}>
        <header className="topbar">
          <div>
            <p className="eyebrow">本地任务看板</p>
            <h1>FocusBoard</h1>
          </div>
          <div className="top-actions">
            <div className="view-switch" role="group" aria-label="视图">
              <button
                type="button"
                className="button button-ghost"
                aria-pressed={state.view === 'board'}
                onClick={() => dispatch({ type: 'set-view', view: 'board' })}
              >
                看板
              </button>
              <button
                type="button"
                className="button button-ghost"
                aria-pressed={state.view === 'list'}
                onClick={() => dispatch({ type: 'set-view', view: 'list' })}
              >
                列表
              </button>
            </div>
            <button id="create-task" type="button" className="button button-primary" onClick={() => setEditing(null)}>
              新建任务
            </button>
            <label className="button button-ghost file-button">
              导入 JSON
              <input
                aria-label="导入 JSON"
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void onImport(file, event.target)
                }}
              />
            </label>
            <button type="button" className="button button-ghost" onClick={onExport}>
              导出 JSON
            </button>
            <button type="button" className="button button-danger" onClick={() => setConfirmClear(true)}>
              清空数据
            </button>
          </div>
        </header>

        {state.warning ? (
          <p className="banner banner-warning" role="alert">
            {state.warning}
          </p>
        ) : null}
        {importError ? (
          <p className="banner banner-warning" role="alert">
            {importError}
          </p>
        ) : null}
        {state.notice ? (
          <p className="banner banner-notice" role="status">
            {state.notice}
          </p>
        ) : null}

        <section className="overview" aria-label="概览">
          <div>
            <p>任务总数</p>
            <strong data-testid="stat-total">{stats.total}</strong>
          </div>
          <div>
            <p>完成率</p>
            <strong data-testid="stat-rate">{formatRate(stats.completionRate)}</strong>
          </div>
          <div>
            <p>逾期任务</p>
            <strong data-testid="stat-overdue">{stats.overdue}</strong>
          </div>
        </section>

        <section className="filters" aria-label="筛选">
          <div className="filter-search">
            <label htmlFor="search">搜索</label>
            <input
              id="search"
              value={state.filters.query}
              placeholder="搜索标题或描述"
              onChange={(event) => setFilter('query', event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="filter-status">筛选状态</label>
            <select
              id="filter-status"
              value={state.filters.status}
              onChange={(event) => setFilter('status', event.target.value as typeof state.filters.status)}
            >
              <option value="all">全部状态</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-priority">筛选优先级</label>
            <select
              id="filter-priority"
              value={state.filters.priority}
              onChange={(event) => setFilter('priority', event.target.value as typeof state.filters.priority)}
            >
              <option value="all">全部优先级</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-tag">筛选标签</label>
            <select id="filter-tag" value={state.filters.tag} onChange={(event) => setFilter('tag', event.target.value)}>
              <option value="all">全部标签</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-sort">截止日期排序</label>
            <select
              id="filter-sort"
              value={state.filters.dueSort}
              onChange={(event) => setFilter('dueSort', event.target.value as typeof state.filters.dueSort)}
            >
              <option value="none">不排序</option>
              <option value="asc">截止日期从早到晚</option>
              <option value="desc">截止日期从晚到早</option>
            </select>
          </div>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => dispatch({ type: 'set-filters', filters: emptyFilters })}
            disabled={filtersAreClear(state.filters)}
          >
            清除筛选
          </button>
        </section>

        <main>
          {state.tasks.length === 0 ? (
            <div className="empty-state">
              <h2>还没有任务</h2>
              <p>新建一条任务，或导入之前导出的 JSON。</p>
              <button type="button" className="button button-primary" onClick={() => setEditing(null)}>
                新建第一条任务
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="empty-state">
              <h2>没有符合条件的任务</h2>
              <p>搜索和筛选可以组合。清除后会回到全部任务。</p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => dispatch({ type: 'set-filters', filters: emptyFilters })}
              >
                清除筛选
              </button>
            </div>
          ) : state.view === 'board' ? (
            <Board tasks={visible} today={today} onEdit={setEditing} onDelete={setPendingDelete} onStatus={onStatus} />
          ) : (
            <TaskList tasks={visible} today={today} onEdit={setEditing} onDelete={setPendingDelete} onStatus={onStatus} />
          )}
        </main>
      </div>

      {editing !== undefined ? (
        <TaskFormDialog task={editing ?? undefined} onClose={() => setEditing(undefined)} onSave={onSave} />
      ) : null}

      {pendingDelete ? (
        <Dialog title="删除这条任务？" onClose={() => setPendingDelete(null)} initialFocusSelector="#dialog-cancel">
          <div className="dialog-body">
            <p>
              确定删除「{pendingDelete.title}」吗？删除后只能用已有的 JSON 备份再导入。
            </p>
          </div>
          <div className="dialog-actions">
            <button type="button" id="dialog-cancel" className="button button-ghost" onClick={() => setPendingDelete(null)}>
              取消
            </button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => {
                dispatch({ type: 'delete', id: pendingDelete.id })
                setPendingDelete(null)
              }}
            >
              确认删除
            </button>
          </div>
        </Dialog>
      ) : null}

      {confirmClear ? (
        <Dialog title="清空全部任务？" onClose={() => setConfirmClear(false)} initialFocusSelector="#dialog-cancel">
          <div className="dialog-body">
            <p>清空后看板为空，刷新也不会恢复演示数据。可以先导出 JSON。</p>
          </div>
          <div className="dialog-actions">
            <button type="button" id="dialog-cancel" className="button button-ghost" onClick={() => setConfirmClear(false)}>
              取消
            </button>
            <button
              type="button"
              className="button button-danger"
              onClick={() => {
                dispatch({ type: 'clear' })
                setConfirmClear(false)
              }}
            >
              确认清空
            </button>
          </div>
        </Dialog>
      ) : null}
    </div>
  )
}
