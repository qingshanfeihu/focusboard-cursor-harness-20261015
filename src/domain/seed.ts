import { shiftDate, todayKey } from './dates'
import type { Task } from './types'

export function createSeedTasks(now = new Date()): Task[] {
  const today = todayKey(now)
  const timestamp = now.toISOString()
  return [
    {
      id: 'seed-brief',
      title: '写项目简报',
      description: '用三句话说明本周要交付的结果。',
      status: 'done',
      priority: 'medium',
      dueDate: shiftDate(today, -1),
      tags: ['写作'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'seed-layout',
      title: '调整看板布局',
      description: '确认三列在窄屏上仍能阅读。',
      status: 'doing',
      priority: 'high',
      dueDate: today,
      tags: ['设计'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'seed-review',
      title: '整理验收清单',
      description: '核对逾期、导入和键盘路径。',
      status: 'todo',
      priority: 'high',
      dueDate: shiftDate(today, -2),
      tags: ['验收'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'seed-tags',
      title: '补充标签示例',
      description: '给没有截止日期的任务留一条记录。',
      status: 'todo',
      priority: 'low',
      dueDate: null,
      tags: ['整理', '验收'],
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]
}
