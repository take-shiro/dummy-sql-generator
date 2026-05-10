import type { ColumnDefinition, ColumnType } from '@/types/schema'

function parseColumnType(rawType: string): ColumnType {
  const t = rawType.toLowerCase().replace(/\(.*\)/, '').trim()
  if (t === 'tinyint') return 'TINYINT'
  if (t === 'int' || t === 'integer' || t === 'mediumint' || t === 'smallint') return 'INT'
  if (t === 'bigint') return 'BIGINT'
  if (t === 'decimal' || t === 'numeric') return 'DECIMAL'
  if (t === 'float' || t === 'double') return 'FLOAT'
  if (t === 'varchar' || t === 'char') return 'VARCHAR'
  if (t === 'text' || t === 'mediumtext' || t === 'longtext' || t === 'tinytext') return 'TEXT'
  if (t === 'date') return 'DATE'
  if (t === 'datetime') return 'DATETIME'
  if (t === 'timestamp') return 'TIMESTAMP'
  if (t === 'boolean' || t === 'bool') return 'BOOLEAN'
  if (t === 'enum') return 'ENUM'
  return 'VARCHAR'
}

function parseVarcharLength(rawType: string): number | null {
  const match = rawType.match(/\((\d+)\)/)
  return match ? parseInt(match[1], 10) : null
}

function parseEnumValues(rawType: string): string[] {
  const match = rawType.match(/enum\((.+)\)/i)
  if (!match) return []
  return match[1].split(',').map((v) => v.trim().replace(/^'|'$/g, ''))
}

function parseDecimal(rawType: string): { precision: number; scale: number } {
  const match = rawType.match(/\((\d+),\s*(\d+)\)/)
  if (match) return { precision: parseInt(match[1], 10), scale: parseInt(match[2], 10) }
  return { precision: 10, scale: 2 }
}

interface ParsedRow {
  field: string
  type: string
  null: string
  key: string
}

function parseDescribeText(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  const rows: ParsedRow[] = []

  for (const line of lines) {
    if (line.startsWith('+') || line.startsWith('-')) continue

    // タブ区切り形式
    if (line.includes('\t')) {
      const parts = line.split('\t')
      if (parts[0].toLowerCase() === 'field') continue
      rows.push({ field: parts[0], type: parts[1] ?? '', null: parts[2] ?? '', key: parts[3] ?? '' })
      continue
    }

    // | 区切り形式（MySQLコンソール出力）
    if (line.startsWith('|')) {
      const parts = line.split('|').map((p) => p.trim()).filter(Boolean)
      if (parts[0].toLowerCase() === 'field') continue
      if (parts.length < 2) continue
      rows.push({ field: parts[0], type: parts[1] ?? '', null: parts[2] ?? '', key: parts[3] ?? '' })
      continue
    }

    // CSV形式（ENUM型のカンマを考慮してフィールド名と型を先に取り出す）
    if (line.includes(',')) {
      const match = line.match(/^([^,]+),([^,]+(?:\([^)]*\))?),([^,]*),([^,]*)/)
      if (!match) continue
      if (match[1].toLowerCase() === 'field') continue
      rows.push({ field: match[1], type: match[2], null: match[3], key: match[4] })
    }
  }

  return rows
}

export function parseDescribe(text: string): Omit<ColumnDefinition, 'id'>[] {
  const parsed = parseDescribeText(text)

  return parsed.map((row) => {
    const colType = parseColumnType(row.type)
    const nullable = row.null.toLowerCase() === 'yes'
    const isPrimaryKey = row.key.toLowerCase() === 'pri'
    const enumValues = colType === 'ENUM' ? parseEnumValues(row.type) : []
    const maxLength = colType === 'VARCHAR' ? (parseVarcharLength(row.type) ?? 255) : null
    const { precision, scale } = ['DECIMAL', 'FLOAT'].includes(colType) ? parseDecimal(row.type) : { precision: null, scale: null }

    return {
      name: row.field,
      type: colType,
      nullable,
      nullRate: 0,
      isPrimaryKey,
      isForeignKey: false,
      foreignKeyRef: null,
      isUnique: false,
      enumValues,
      fixedValues: [],
      useFixedValues: false,
      maxLength,
      precision,
      scale,
      usePrefix: false,
      prefix: '',
      prefixDigits: 5,
      useSequential: false,
      fakerCategory: 'auto',
      dateRange: { from: '2020-01-01', to: new Date().toISOString().slice(0, 10) },
    }
  })
}
