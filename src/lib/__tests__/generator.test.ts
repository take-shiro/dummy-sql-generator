import { describe, it, expect } from 'vitest'
import { generateRows } from '../generator'
import type { TableDefinition, ColumnDefinition } from '@/types/schema'

function makeCol(id: string, name: string, overrides: Partial<ColumnDefinition> = {}): ColumnDefinition {
  return {
    id,
    name,
    type: 'VARCHAR',
    nullable: false,
    nullRate: 0,
    isPrimaryKey: false,
    isForeignKey: false,
    foreignKeyRef: null,
    isUnique: false,
    enumValues: [],
    fixedValues: [],
    useFixedValues: false,
    maxLength: 255,
    precision: null,
    scale: null,
    usePrefix: false,
    prefix: '',
    prefixDigits: 5,
    useSequential: false,
    fakerCategory: 'auto',
    dateRange: { from: '2020-01-01', to: '2025-01-01' },
    ...overrides,
  }
}

function makeTable(id: string, name: string, columns: ColumnDefinition[], rowCount = 10): TableDefinition {
  return { id, name, columns, rowCount }
}

describe('generateRows', () => {
  it('指定件数のデータを生成する', () => {
    const tables = [makeTable('t1', 'users', [
      makeCol('c1', 'id', { isPrimaryKey: true, type: 'INT' }),
      makeCol('c2', 'name'),
    ], 10)]
    const result = generateRows(tables)
    expect(result[0].rows).toHaveLength(10)
  })

  it('プレフィックス連番を正しく生成する', () => {
    const tables = [makeTable('t1', 'users', [
      makeCol('c1', 'id', { isPrimaryKey: true, usePrefix: true, prefix: 'USR', prefixDigits: 5 }),
    ], 3)]
    const result = generateRows(tables)
    const rows = result[0].rows
    expect(rows[0]['id']).toBe('USR00001')
    expect(rows[1]['id']).toBe('USR00002')
    expect(rows[2]['id']).toBe('USR00003')
  })

  it('連番オプションで1始まりの連番を生成する', () => {
    const tables = [makeTable('t1', 'users', [
      makeCol('c1', 'id', { isPrimaryKey: true, type: 'INT', useSequential: true }),
    ], 5)]
    const result = generateRows(tables)
    const ids = result[0].rows.map((r) => r['id'])
    expect(ids).toEqual([1, 2, 3, 4, 5])
  })

  it('UNIQUE制約でデータが重複しない', () => {
    const tables = [makeTable('t1', 'users', [
      makeCol('c1', 'id', { isPrimaryKey: true, type: 'INT' }),
      makeCol('c2', 'email', { isUnique: true, fakerCategory: 'internet.email' }),
    ], 50)]
    const result = generateRows(tables)
    const emails = result[0].rows.map((r) => r['email'])
    const unique = new Set(emails)
    expect(unique.size).toBe(emails.length)
  })

  it('ENUM値は選択肢の中からのみ生成される', () => {
    const enumValues = ['active', 'inactive', 'pending']
    const tables = [makeTable('t1', 'users', [
      makeCol('c1', 'id', { isPrimaryKey: true, type: 'INT' }),
      makeCol('c2', 'status', { type: 'ENUM', enumValues }),
    ], 20)]
    const result = generateRows(tables)
    for (const row of result[0].rows) {
      expect(enumValues).toContain(row['status'])
    }
  })

  it('NULL率に応じてNULLが生成される（統計的）', () => {
    const tables = [makeTable('t1', 'users', [
      makeCol('c1', 'id', { isPrimaryKey: true, type: 'INT' }),
      makeCol('c2', 'note', { nullable: true, nullRate: 100 }),
    ], 50)]
    const result = generateRows(tables)
    const nullCount = result[0].rows.filter((r) => r['note'] === null).length
    expect(nullCount).toBe(50)
  })

  it('FK値は親テーブルのPKから引かれる', () => {
    const parent = makeTable('t1', 'users', [
      makeCol('c1', 'id', { isPrimaryKey: true, type: 'INT' }),
    ])
    const child = makeTable('t2', 'orders', [
      makeCol('c2', 'id', { isPrimaryKey: true, type: 'INT' }),
      makeCol('c3', 'user_id', { isForeignKey: true, foreignKeyRef: { tableId: 't1', columnId: 'c1' }, type: 'INT' }),
    ])
    const result = generateRows([parent, child])
    const parentIds = result.find((r) => r.tableId === 't1')!.rows.map((r) => r['id'])
    const childUserIds = result.find((r) => r.tableId === 't2')!.rows.map((r) => r['user_id'])
    for (const uid of childUserIds) {
      if (uid !== null) expect(parentIds).toContain(uid)
    }
  })

  it('複合PKは組み合わせのユニーク性を保証する', () => {
    const tables = [makeTable('t1', 'rel', [
      makeCol('c1', 'a', { isPrimaryKey: true, type: 'INT' }),
      makeCol('c2', 'b', { isPrimaryKey: true, type: 'INT' }),
    ])]
    const result = generateRows(tables)
    const keys = result[0].rows.map((r) => `${r['a']}::${r['b']}`)
    const unique = new Set(keys)
    expect(unique.size).toBe(keys.length)
  })
})
