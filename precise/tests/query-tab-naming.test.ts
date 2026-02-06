import { beforeEach, describe, expect, it } from 'vitest'
import Queries from '../src/schema/Queries'

class LocalStorageMock {
  private readonly store = new Map<string, string>()

  get length() {
    return this.store.size
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }
}

function seedQuery(localStorageMock: LocalStorageMock, id: string, title: string) {
  localStorageMock.setItem(
    `query_${id}`,
    JSON.stringify({
      id,
      title,
      type: 'USER_ADDED',
      query: '',
      isPinned: false,
    })
  )
}

describe('Query tab naming', () => {
  beforeEach(() => {
    const localStorageMock = new LocalStorageMock()
    ;(globalThis as any).localStorage = localStorageMock
    ;(globalThis as any).window = { location: { search: '' } }
  })

  it('uses Query 1 for the first tab', () => {
    const queries = new Queries()
    expect(queries.getCurrentQuery().title).toBe('Query 1')
  })

  it('fills missing index when creating a new tab', () => {
    const localStorageMock = globalThis.localStorage as unknown as LocalStorageMock
    seedQuery(localStorageMock, 'id-1', 'Query 1')
    seedQuery(localStorageMock, 'id-3', 'Query 3')

    const queries = new Queries()
    const created = queries.addQuery(false)

    expect(created.title).toBe('Query 2')
  })
})
