import type { TableDefinition, GenerationResult } from '@/types/schema'
import { validate, validateUniqueCapacity } from './validator'
import { topologicalSort } from './topological'
import { generateRows } from './generator'

type Row = Record<string, unknown>

function escapeValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `'${str}'`
}

function buildInsert(tableName: string, rows: Row[]): string {
  if (rows.length === 0) return ''
  const columns = Object.keys(rows[0])
  const colList = columns.map((c) => `\`${c}\``).join(', ')
  const valueLines = rows
    .map((row) => `(${columns.map((c) => escapeValue(row[c])).join(', ')})`)
    .join(',\n  ')
  return `INSERT INTO \`${tableName}\` (${colList}) VALUES\n  ${valueLines};`
}

export function buildSql(
  tables: TableDefinition[],
  includeTruncate: boolean,
): GenerationResult {
  const maxRowCount = Math.max(...tables.map((t) => t.rowCount))
  const validationErrors = [
    ...validate(tables),
    ...validateUniqueCapacity(tables, maxRowCount),
  ]

  if (validationErrors.length > 0) {
    return {
      sql: '',
      warnings: validationErrors.map((e) => ({ message: e.message })),
    }
  }

  const { warnings, order } = topologicalSort(tables)
  const tableMap = new Map(tables.map((t) => [t.id, t]))

  const generatedRows = generateRows(tables)
  const rowMap = new Map(generatedRows.map((r) => [r.tableId, r.rows]))

  const parts: string[] = []

  for (const tableId of order) {
    const table = tableMap.get(tableId)
    if (!table) continue
    const rows = rowMap.get(tableId) ?? []

    if (includeTruncate) {
      parts.push(`TRUNCATE TABLE \`${table.name}\`;`)
    }

    const insert = buildInsert(table.name, rows)
    if (insert) parts.push(insert)
  }

  return {
    sql: parts.join('\n\n'),
    warnings,
  }
}
