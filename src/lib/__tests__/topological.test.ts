import { describe, it, expect } from 'vitest'
import { topologicalSort } from '../topological'
import type { TableDefinition } from '@/types/schema'

function makeTable(id: string, name: string, fkRefs: { tableId: string }[] = []): TableDefinition {
  return {
    id,
    name,
    columns: [
      ...fkRefs.map((ref, i) => ({
        id: `col-fk-${id}-${i}`,
        name: `fk_col_${i}`,
        type: 'INT' as const,
        nullable: false,
        nullRate: 0,
        isPrimaryKey: false,
        isForeignKey: true,
        foreignKeyRef: { tableId: ref.tableId, columnId: 'pk' },
        isUnique: false,
        enumValues: [],
        fixedValues: [],
        useFixedValues: false,
        maxLength: null,
        precision: null,
        scale: null,
        usePrefix: false,
        prefix: '',
        prefixDigits: 5,
        fakerCategory: 'auto' as const,
        dateRange: { from: '2020-01-01', to: '2025-01-01' },
      })),
    ],
  }
}

describe('topologicalSort', () => {
  it('依存のない場合そのまま返す', () => {
    const tables = [makeTable('t1', 'users'), makeTable('t2', 'products')]
    const { order, warnings } = topologicalSort(tables)
    expect(order).toHaveLength(2)
    expect(warnings).toHaveLength(0)
  })

  it('親テーブルが先に来る', () => {
    const t1 = makeTable('t1', 'users')
    const t2 = makeTable('t2', 'orders', [{ tableId: 't1' }])
    const { order } = topologicalSort([t2, t1])
    expect(order.indexOf('t1')).toBeLessThan(order.indexOf('t2'))
  })

  it('循環参照を検出して警告を出す', () => {
    const t1 = makeTable('t1', 'a', [{ tableId: 't2' }])
    const t2 = makeTable('t2', 'b', [{ tableId: 't1' }])
    const { warnings, cycleTableIds } = topologicalSort([t1, t2])
    expect(warnings.length).toBeGreaterThan(0)
    expect(cycleTableIds.size).toBeGreaterThan(0)
  })
})
