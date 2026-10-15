import { describe, expect, it } from 'vitest'
import { filterTasks, emptyFilters } from './filter'
import { isOverdue, overview } from './stats'
import { normalizeTags, taskFromDraft, titleError } from './tasks'
import { applyImport, parseImport, serializeTasks } from './transfer'
import type { Task, TaskDraft } from './types'

const today = '2026-10-15'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: '买牛奶',
    description: '全脂',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-10-20',
    tags: ['生活'],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  }
}

function draft(overrides: Partial<TaskDraft> = {}): TaskDraft {
  return {
    title: '买牛奶',
    description: ' 全脂 ',
    status: 'todo',
    priority: 'low',
    dueDate: '',
    tags: '生活, 生活，采购',
    ...overrides,
  }
}

describe('任务字段', () => {
  it('拒绝空白标题，并去掉首尾空白', () => {
    expect(titleError('   ')).toBe('请填写标题')
    expect(taskFromDraft(draft({ title: '   ' }))).toBeNull()
    const created = taskFromDraft(draft({ title: '  买牛奶  ' }), undefined, new Date('2026-10-15T01:02:03.000Z'))
    expect(created?.title).toBe('买牛奶')
    expect(created?.description).toBe('全脂')
    expect(created?.tags).toEqual(['生活', '采购'])
    expect(created?.dueDate).toBeNull()
  })

  it('编辑时保留 id 和创建时间', () => {
    const existing = task()
    const next = taskFromDraft(draft({ title: '买面包' }), existing, new Date('2026-10-16T00:00:00.000Z'))
    expect(next?.id).toBe(existing.id)
    expect(next?.createdAt).toBe(existing.createdAt)
    expect(next?.updatedAt).toBe('2026-10-16T00:00:00.000Z')
  })

  it('标签去重并忽略空片段', () => {
    expect(normalizeTags(' , a，a, b ')).toEqual(['a', 'b'])
  })
})

describe('筛选与排序', () => {
  const tasks = [
    task({ id: 'a', title: '写简报', description: '三句话', status: 'done', priority: 'low', dueDate: '2026-10-10', tags: ['写作'] }),
    task({ id: 'b', title: '看板', description: '窄屏', status: 'doing', priority: 'high', dueDate: today, tags: ['设计'] }),
    task({ id: 'c', title: '验收', description: '键盘', status: 'todo', priority: 'high', dueDate: '2026-10-13', tags: ['验收'] }),
    task({ id: 'd', title: '无日期', description: '记录', status: 'todo', priority: 'low', dueDate: null, tags: ['验收'] }),
    task({ id: 'e', title: '同样日期', description: '靠后', status: 'todo', priority: 'medium', dueDate: '2026-10-13', tags: ['验收'] }),
  ]

  it('可以组合筛选，清除后恢复全部', () => {
    const filters = { ...emptyFilters, query: '验收', status: 'todo' as const, priority: 'high' as const, tag: '验收' }
    expect(filterTasks(tasks, filters).map((item) => item.id)).toEqual(['c'])
    expect(filterTasks(tasks, emptyFilters)).toHaveLength(tasks.length)
  })

  it('搜索只匹配标题和描述', () => {
    expect(filterTasks(tasks, { ...emptyFilters, query: '设计' })).toHaveLength(0)
    expect(filterTasks(tasks, { ...emptyFilters, query: '窄屏' }).map((item) => item.id)).toEqual(['b'])
  })

  it('截止日期排序稳定，没有日期的任务放在最后', () => {
    const ascending = filterTasks(tasks, { ...emptyFilters, dueSort: 'asc' }).map((item) => item.id)
    expect(ascending).toEqual(['a', 'c', 'e', 'b', 'd'])
    const descending = filterTasks(tasks, { ...emptyFilters, dueSort: 'desc' }).map((item) => item.id)
    expect(descending).toEqual(['b', 'c', 'e', 'a', 'd'])
  })
})

describe('概览', () => {
  it('完成任务和截止日当天都不算逾期，空列表完成率不是 NaN', () => {
    const tasks = [
      task({ id: 'done', status: 'done', dueDate: '2026-10-01' }),
      task({ id: 'today', status: 'doing', dueDate: today }),
      task({ id: 'late', status: 'todo', dueDate: '2026-10-14' }),
      task({ id: 'none', status: 'todo', dueDate: null }),
    ]
    expect(isOverdue(tasks[0], today)).toBe(false)
    expect(isOverdue(tasks[1], today)).toBe(false)
    expect(isOverdue(tasks[2], today)).toBe(true)
    const summary = overview(tasks, today)
    expect(summary).toEqual({ total: 4, completionRate: 0.25, overdue: 1 })
    const empty = overview([], today)
    expect(empty.completionRate).toBe(0)
    expect(Number.isNaN(empty.completionRate)).toBe(false)
  })
})

describe('导入导出', () => {
  const original = [
    task({ title: '  保留空白  ' }),
    task({ id: 't2', title: '第二条', description: '', dueDate: null, tags: [], priority: 'high', status: 'done' }),
  ]

  it('导出再导入后保留全部字段', () => {
    const parsed = parseImport(serializeTasks(original))
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.tasks).toEqual(original)
  })

  it('第二条记录不合法时整批拒绝，已有任务和字段都不改变', () => {
    const snapshot = structuredClone(original)
    const taskRefs = original.map((item) => item)
    const tagRefs = original.map((item) => item.tags)
    const raw = JSON.stringify({
      version: 1,
      tasks: [
        task({ id: 'new-1', title: '第一条合法', description: '不应写入' }),
        { ...task({ id: 'new-2', title: '第二条非法' }), status: 'archived' },
      ],
    })
    const next = applyImport(original, raw)
    expect(next.error).toMatch(/第 2 条/)
    expect(next.tasks).toBe(original)
    expect(original).toEqual(snapshot)
    expect(next.tasks.some((item) => item.title === '第一条合法')).toBe(false)
    original.forEach((item, index) => {
      expect(item).toBe(taskRefs[index])
      expect(item.tags).toBe(tagRefs[index])
      expect(item).toEqual(snapshot[index])
    })
  })

  it('非法内容被拒绝且不替换原列表', () => {
    const cases = [
      '{',
      '{"tasks":"no"}',
      JSON.stringify([{ ...original[0], status: 'later' }]),
      JSON.stringify([{ ...original[0], title: '   ' }]),
      JSON.stringify([{ ...original[0], dueDate: '2026-02-31' }]),
      JSON.stringify([original[0], original[0]]),
      JSON.stringify({ version: 1 }),
    ]
    for (const raw of cases) {
      const next = applyImport(original, raw)
      expect(next.error).toBeTruthy()
      expect(next.tasks).toBe(original)
    }
  })
})
