import { afterEach, describe, expect, it } from 'vitest'
import { createSeedTasks } from './domain/seed'
import { STORAGE_KEY, loadTasks, saveTasks } from './storage'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(key: string) {
    return this.map.get(key) ?? null
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
}

const now = new Date('2026-10-15T08:00:00')

describe('localStorage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('没有存档时写入演示数据', () => {
    const storage = new MemoryStorage()
    const loaded = loadTasks(storage, now)
    expect(loaded.warning).toBeNull()
    expect(loaded.tasks.map((task) => task.id)).toEqual(createSeedTasks(now).map((task) => task.id))
    expect(storage.getItem(STORAGE_KEY)).toContain('seed-review')
  })

  it('合法数据可以再次读取', () => {
    const storage = new MemoryStorage()
    const tasks = createSeedTasks(now).slice(0, 1)
    saveTasks(tasks, storage)
    expect(loadTasks(storage, now).tasks).toEqual(tasks)
  })

  it('损坏的 JSON 不抛错，也不覆盖原内容', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{bad')
    const loaded = loadTasks(storage, now)
    expect(loaded.tasks).toEqual([])
    expect(loaded.warning).toMatch(/无法读取/)
    expect(storage.getItem(STORAGE_KEY)).toBe('{bad')
  })

  it('清空后的空数组不会在刷新时变回演示数据', () => {
    const storage = new MemoryStorage()
    saveTasks([], storage)
    const loaded = loadTasks(storage, now)
    expect(loaded.tasks).toEqual([])
    expect(loaded.warning).toBeNull()
  })
})
