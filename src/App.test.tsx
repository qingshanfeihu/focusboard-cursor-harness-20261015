import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { serializeTasks } from './domain/transfer'
import type { Task } from './domain/types'
import { STORAGE_KEY } from './storage'
import { TaskProvider } from './store'

function renderApp() {
  return render(
    <TaskProvider>
      <App />
    </TaskProvider>,
  )
}

async function expectFocusStaysInside(user: ReturnType<typeof userEvent.setup>, dialog: HTMLElement) {
  for (let step = 0; step < 12; step += 1) {
    await user.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)
  }
  for (let step = 0; step < 4; step += 1) {
    await user.tab({ shift: true })
    expect(dialog.contains(document.activeElement)).toBe(true)
  }
}

describe('看板界面', () => {
  it('首次打开展示演示数据、完成率和逾期数', () => {
    renderApp()
    expect(screen.getByRole('heading', { name: 'FocusBoard' })).toBeInTheDocument()
    expect(screen.getByText('写项目简报')).toBeInTheDocument()
    expect(screen.getByTestId('stat-total')).toHaveTextContent('4')
    expect(screen.getByTestId('stat-rate')).toHaveTextContent('25%')
    expect(screen.getByTestId('stat-overdue')).toHaveTextContent('1')
    expect(screen.getByText(/今天到期/)).toBeInTheDocument()
  })

  it('空标题会提示错误，合法标题会去掉空白并保存', async () => {
    localStorage.setItem(STORAGE_KEY, '[]')
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: '新建任务' }))
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByRole('alert')).toHaveTextContent('请填写标题')
    await user.type(screen.getByLabelText('标题'), '  买牛奶  ')
    await user.type(screen.getByLabelText('描述'), '全脂')
    await user.click(screen.getByRole('button', { name: '保存' }))
    expect(screen.getByRole('heading', { name: '买牛奶' })).toBeInTheDocument()
    expect(screen.getByText('全脂')).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Task[]
    expect(stored[0]?.title).toBe('买牛奶')
  })

  it('删除前需要确认，取消不会删除', async () => {
    localStorage.setItem(STORAGE_KEY, '[]')
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: '新建任务' }))
    await user.type(screen.getByLabelText('标题'), '买牛奶')
    await user.click(screen.getByRole('button', { name: '保存' }))
    await user.click(screen.getByRole('button', { name: '删除 买牛奶' }))
    expect(screen.getByRole('dialog', { name: '删除这条任务？' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.getByRole('heading', { name: '买牛奶' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '删除 买牛奶' }))
    await user.click(screen.getByRole('button', { name: '确认删除' }))
    expect(screen.queryByRole('heading', { name: '买牛奶' })).not.toBeInTheDocument()
    expect(screen.getByText('还没有任务')).toBeInTheDocument()
  })

  it('搜索只命中标题或描述，组合筛选可以清除', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.type(screen.getByLabelText('搜索'), '设计')
    expect(screen.getByText('没有符合条件的任务')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('搜索'))
    await user.type(screen.getByLabelText('搜索'), '三句话')
    expect(screen.getByText('写项目简报')).toBeInTheDocument()
    expect(screen.queryByText('整理验收清单')).not.toBeInTheDocument()
    await user.clear(screen.getByLabelText('搜索'))
    await user.selectOptions(screen.getByLabelText('筛选状态'), 'todo')
    await user.selectOptions(screen.getByLabelText('筛选优先级'), 'high')
    await user.selectOptions(screen.getByLabelText('筛选标签'), '验收')
    expect(screen.getByText('整理验收清单')).toBeInTheDocument()
    expect(screen.queryByText('补充标签示例')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '清除筛选' }))
    expect(screen.getByText('补充标签示例')).toBeInTheDocument()
  })

  it('可以切换列表，并把未完成的逾期任务标成完成', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: '列表' }))
    expect(screen.getByRole('list', { name: '任务列表' })).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('状态 整理验收清单'), 'done')
    expect(screen.getByTestId('stat-overdue')).toHaveTextContent('0')
    expect(screen.getByTestId('stat-rate')).toHaveTextContent('50%')
  })

  it('坏导入保留原任务，好导入替换为完整字段', async () => {
    const user = userEvent.setup()
    renderApp()
    const input = screen.getByLabelText('导入 JSON')
    await user.upload(input, new File(['{'], 'bad.json', { type: 'application/json' }))
    expect(await screen.findByText(/不是有效的 JSON/)).toBeInTheDocument()
    expect(screen.getByText('写项目简报')).toBeInTheDocument()

    const replacement: Task = {
      id: 'imported-1',
      title: '导入的任务',
      description: '来自文件',
      status: 'doing',
      priority: 'low',
      dueDate: '2026-12-01',
      tags: ['外部'],
      createdAt: '2026-10-02T00:00:00.000Z',
      updatedAt: '2026-10-03T00:00:00.000Z',
    }
    await user.upload(input, new File([serializeTasks([replacement])], 'ok.json', { type: 'application/json' }))
    expect(await screen.findByText('导入的任务')).toBeInTheDocument()
    expect(screen.queryByText('写项目简报')).not.toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Task[]
    expect(stored).toEqual([replacement])
  })

  it('导入文件只有第二条不合法时整批拒绝，已有任务字段不变', async () => {
    const user = userEvent.setup()
    renderApp()
    const before = localStorage.getItem(STORAGE_KEY)
    const existing = JSON.parse(before ?? '[]') as Task[]
    expect(existing.length).toBeGreaterThan(1)
    const raw = JSON.stringify({
      version: 1,
      tasks: [
        {
          id: 'partial-ok',
          title: '这条不该出现',
          description: '第一条合法',
          status: 'todo',
          priority: 'low',
          dueDate: null,
          tags: ['临时'],
          createdAt: '2026-10-04T00:00:00.000Z',
          updatedAt: '2026-10-04T00:00:00.000Z',
        },
        {
          id: 'partial-bad',
          title: '第二条坏了',
          description: '状态非法',
          status: 'archived',
          priority: 'low',
          dueDate: null,
          tags: [],
          createdAt: '2026-10-04T00:00:00.000Z',
          updatedAt: '2026-10-04T00:00:00.000Z',
        },
      ],
    })
    await user.upload(
      screen.getByLabelText('导入 JSON'),
      new File([raw], 'partial.json', { type: 'application/json' }),
    )
    expect(await screen.findByText(/第 2 条任务字段不完整或取值无效/)).toBeInTheDocument()
    expect(screen.queryByText('这条不该出现')).not.toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toBe(before)
    const after = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Task[]
    expect(after).toEqual(existing)
    expect(screen.getByText(existing[0].title)).toBeInTheDocument()
    expect(screen.getByText(existing[0].description)).toBeInTheDocument()
    expect(screen.getByText(existing[1].title)).toBeInTheDocument()
  })

  it('刷新后仍能读到新建任务，清空后不会回到演示数据', async () => {
    localStorage.setItem(STORAGE_KEY, '[]')
    const user = userEvent.setup()
    const first = renderApp()
    await user.click(screen.getByRole('button', { name: '新建任务' }))
    await user.type(screen.getByLabelText('标题'), '持久任务')
    await user.click(screen.getByRole('button', { name: '保存' }))
    first.unmount()
    const second = renderApp()
    expect(screen.getByText('持久任务')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '清空数据' }))
    await user.click(screen.getByRole('button', { name: '确认清空' }))
    expect(screen.getByText('还没有任务')).toBeInTheDocument()
    second.unmount()
    renderApp()
    expect(screen.getByText('还没有任务')).toBeInTheDocument()
    expect(screen.queryByText('写项目简报')).not.toBeInTheDocument()
  })

  it('新建、编辑和删除弹窗把焦点留在内部，关闭后回到入口', async () => {
    const user = userEvent.setup()
    renderApp()

    const createButton = screen.getByRole('button', { name: '新建任务' })
    createButton.focus()
    await user.click(createButton)
    const createDialog = screen.getByRole('dialog', { name: '新建任务' })
    expect(createDialog.contains(document.activeElement)).toBe(true)
    await expectFocusStaysInside(user, createDialog)
    await user.keyboard('{Escape}')
    expect(document.activeElement).toBe(createButton)

    const editButton = screen.getByRole('button', { name: '编辑 写项目简报' })
    editButton.focus()
    await user.click(editButton)
    const editDialog = screen.getByRole('dialog', { name: '编辑任务' })
    expect(editDialog.contains(document.activeElement)).toBe(true)
    await expectFocusStaysInside(user, editDialog)
    await user.click(within(editDialog).getByRole('button', { name: '取消' }))
    expect(document.activeElement).toBe(editButton)

    const deleteButton = screen.getByRole('button', { name: '删除 写项目简报' })
    deleteButton.focus()
    await user.click(deleteButton)
    const deleteDialog = screen.getByRole('dialog', { name: '删除这条任务？' })
    expect(deleteDialog.contains(document.activeElement)).toBe(true)
    await expectFocusStaysInside(user, deleteDialog)
    await user.click(within(deleteDialog).getByRole('button', { name: '取消' }))
    expect(document.activeElement).toBe(deleteButton)

    await user.click(deleteButton)
    await user.click(screen.getByRole('button', { name: '确认删除' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '新建任务' }))
    expect(screen.queryByText('写项目简报')).not.toBeInTheDocument()
  })
})
