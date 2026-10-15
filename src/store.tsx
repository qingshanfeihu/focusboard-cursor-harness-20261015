import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode } from 'react'
import { emptyFilters, type TaskFilters } from './domain/filter'
import type { Task } from './domain/types'
import { loadTasks, saveTasks } from './storage'

export type ViewMode = 'board' | 'list'

interface State {
  tasks: Task[]
  filters: TaskFilters
  view: ViewMode
  warning: string | null
  notice: string | null
}

type Action =
  | { type: 'save-task'; task: Task; notice: string }
  | { type: 'patch-task'; task: Task }
  | { type: 'delete'; id: string }
  | { type: 'import'; tasks: Task[] }
  | { type: 'clear' }
  | { type: 'set-filters'; filters: TaskFilters }
  | { type: 'set-view'; view: ViewMode }
  | { type: 'set-warning'; warning: string | null }
  | { type: 'set-notice'; notice: string | null }

function upsert(tasks: Task[], task: Task): Task[] {
  const exists = tasks.some((item) => item.id === task.id)
  if (!exists) return [task, ...tasks]
  return tasks.map((item) => (item.id === task.id ? task : item))
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'save-task':
      return { ...state, tasks: upsert(state.tasks, action.task), notice: action.notice }
    case 'patch-task':
      return { ...state, tasks: upsert(state.tasks, action.task), notice: null }
    case 'delete':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.id),
        notice: '已删除任务。',
      }
    case 'import':
      return { ...state, tasks: action.tasks, notice: `已导入 ${action.tasks.length} 条任务。`, warning: null }
    case 'clear':
      return { ...state, tasks: [], filters: emptyFilters, notice: '已清空全部任务。' }
    case 'set-filters':
      return { ...state, filters: action.filters }
    case 'set-view':
      return { ...state, view: action.view }
    case 'set-warning':
      return { ...state, warning: action.warning }
    case 'set-notice':
      return { ...state, notice: action.notice }
    default:
      return state
  }
}

const TaskContext = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null)

function createInitialState(): State {
  const loaded = loadTasks()
  return {
    tasks: loaded.tasks,
    filters: emptyFilters,
    view: 'board',
    warning: loaded.warning,
    notice: null,
  }
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState)
  const baseline = useRef<Task[] | null>(null)

  useEffect(() => {
    if (baseline.current === null) {
      baseline.current = state.tasks
      return
    }
    if (baseline.current === state.tasks) return
    try {
      saveTasks(state.tasks)
    } catch {
      dispatch({ type: 'set-warning', warning: '无法写入浏览器存储，修改只保留在本次页面中。' })
    }
  }, [state.tasks])

  return <TaskContext.Provider value={{ state, dispatch }}>{children}</TaskContext.Provider>
}

export function useTasks() {
  const value = useContext(TaskContext)
  if (!value) throw new Error('useTasks 只能在 TaskProvider 内使用')
  return value
}
