import { describe, it, expect } from 'vitest'
import { buildSql } from '../sql-builder'
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

function makeTable(id: string, name: string, columns: ColumnDefinition[], rowCount = 5): TableDefinition {
  return { id, name, columns, rowCount }
}

const baseTable = makeTable('t1', 'users', [
  makeCol('c1', 'id', { isPrimaryKey: true, type: 'INT' }),
  makeCol('c2', 'name'),
])

describe('buildSql', () => {
  it('INSERT文を生成する', () => {
    const { sql, warnings } = buildSql([baseTable], false)
    expect(warnings).toHaveLength(0)
    expect(sql).toContain('INSERT INTO `users`')
    expect(sql).toContain('`id`')
    expect(sql).toContain('`name`')
  })

  it('TRUNCATE オプションが有効なとき先頭にTRUNCATE文が入る', () => {
    const { sql } = buildSql([baseTable], true)
    expect(sql).toContain('TRUNCATE TABLE `users`')
    expect(sql.indexOf('TRUNCATE')).toBeLessThan(sql.indexOf('INSERT'))
  })

  it('PKがないテーブルはエラーを返す', () => {
    const table = makeTable('t1', 'bad', [makeCol('c1', 'name')])
    const { sql, warnings } = buildSql([table], false)
    expect(sql).toBe('')
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('件数分のINSERT値が含まれる', () => {
    const { sql } = buildSql([baseTable], false)
    // 値行は "  (" で始まる（カラムリストの括弧と区別）
    const matches = sql.match(/^\s+\(/gm)
    expect(matches?.length).toBe(5)
  })
})
