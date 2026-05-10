import { describe, it, expect } from 'vitest'
import { validate, validateUniqueCapacity } from '../validator'
import type { TableDefinition, ColumnDefinition } from '@/types/schema'

function makeTable(overrides: Partial<TableDefinition> = {}): TableDefinition {
  return {
    id: 't1',
    name: 'users',
    columns: [],
    rowCount: 10,
    ...overrides,
  }
}

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

describe('validate', () => {
  it('PKが未設定のテーブルにエラーを出す', () => {
    const tables = [makeTable({ columns: [makeCol('c1', 'name')] })]
    const errors = validate(tables)
    expect(errors.some((e) => e.message.includes('PK'))).toBe(true)
  })

  it('PKが設定されているとエラーなし', () => {
    const tables = [makeTable({ columns: [makeCol('c1', 'id', { isPrimaryKey: true })] })]
    expect(validate(tables)).toHaveLength(0)
  })

  it('ENUMで選択肢未定義のとき エラーを出す', () => {
    const tables = [makeTable({
      columns: [
        makeCol('c1', 'id', { isPrimaryKey: true }),
        makeCol('c2', 'status', { type: 'ENUM', enumValues: [] }),
      ],
    })]
    const errors = validate(tables)
    expect(errors.some((e) => e.message.includes('ENUM'))).toBe(true)
  })

  it('FK参照先テーブルが存在しない場合エラー', () => {
    const tables = [makeTable({
      columns: [
        makeCol('c1', 'id', { isPrimaryKey: true }),
        makeCol('c2', 'user_id', { isForeignKey: true, foreignKeyRef: { tableId: 'nonexistent', columnId: 'x' } }),
      ],
    })]
    const errors = validate(tables)
    expect(errors.some((e) => e.message.includes('FK参照先テーブル'))).toBe(true)
  })

  it('FK参照先カラムがPKでない場合エラー', () => {
    const t1 = makeTable({ id: 't1', name: 'users', columns: [makeCol('c1', 'id', { isPrimaryKey: true }), makeCol('c2', 'name')] })
    const t2 = makeTable({ id: 't2', name: 'orders', columns: [
      makeCol('c3', 'id', { isPrimaryKey: true }),
      makeCol('c4', 'user_name', { isForeignKey: true, foreignKeyRef: { tableId: 't1', columnId: 'c2' } }),
    ] })
    const errors = validate([t1, t2])
    expect(errors.some((e) => e.message.includes('PKではありません'))).toBe(true)
  })
})

describe('validateUniqueCapacity', () => {
  it('固定選択肢数が件数を下回るとエラー', () => {
    const tables = [makeTable({
      columns: [
        makeCol('c1', 'id', { isPrimaryKey: true }),
        makeCol('c2', 'code', { isUnique: true, useFixedValues: true, fixedValues: ['A', 'B'] }),
      ],
    })]
    const errors = validateUniqueCapacity(tables, 10)
    expect(errors.some((e) => e.message.includes('UNIQUE'))).toBe(true)
  })

  it('固定選択肢数が件数以上なら問題なし', () => {
    const tables = [makeTable({
      columns: [
        makeCol('c1', 'id', { isPrimaryKey: true }),
        makeCol('c2', 'code', { isUnique: true, useFixedValues: true, fixedValues: ['A', 'B', 'C'] }),
      ],
    })]
    expect(validateUniqueCapacity(tables, 3)).toHaveLength(0)
  })
})
