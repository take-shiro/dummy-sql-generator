import { faker } from '@faker-js/faker/locale/ja'
import type { ColumnDefinition, TableDefinition } from '@/types/schema'
import { inferFakerCategory } from './faker-map'
import { topologicalSort } from './topological'

type Row = Record<string, unknown>

function generateFakerValue(col: ColumnDefinition): unknown {
  const category = col.fakerCategory === 'auto' ? inferFakerCategory(col.name) : col.fakerCategory

  switch (category) {
    case 'person.fullName': return faker.person.fullName()
    case 'person.firstName': return faker.person.firstName()
    case 'person.lastName': return faker.person.lastName()
    case 'internet.email': return faker.internet.email()
    case 'internet.userName': return faker.internet.username()
    case 'internet.url': return faker.internet.url()
    case 'phone.number': return faker.phone.number()
    case 'location.city': return faker.location.city()
    case 'location.state': return faker.location.state()
    case 'location.streetAddress': return faker.location.streetAddress()
    case 'location.zipCode': return faker.location.zipCode()
    case 'location.country': return faker.location.country()
    case 'company.name': return faker.company.name()
    case 'datatype.uuid': return faker.string.uuid()
    case 'lorem.sentence': return faker.lorem.sentence()
    case 'lorem.word':
    default: return faker.lorem.word()
  }
}

function generateTypedValue(col: ColumnDefinition, dateFrom: Date, dateTo: Date): unknown {
  switch (col.type) {
    case 'TINYINT': return faker.number.int({ min: 0, max: 127 })
    case 'INT': return faker.number.int({ min: 0, max: 2_147_483_647 })
    case 'BIGINT': return faker.number.int({ min: 0, max: Number.MAX_SAFE_INTEGER })
    case 'DECIMAL':
    case 'FLOAT': {
      const scale = col.scale ?? 2
      return parseFloat(faker.number.float({ min: 0, max: 9999, fractionDigits: scale }).toFixed(scale))
    }
    case 'BOOLEAN': return faker.datatype.boolean() ? 1 : 0
    case 'DATE': return faker.date.between({ from: dateFrom, to: dateTo }).toISOString().slice(0, 10)
    case 'DATETIME':
    case 'TIMESTAMP': {
      const d = faker.date.between({ from: dateFrom, to: dateTo })
      return d.toISOString().slice(0, 19).replace('T', ' ')
    }
    case 'TEXT': return faker.lorem.paragraph()
    case 'VARCHAR': return generateFakerValue(col)
    case 'ENUM': return faker.helpers.arrayElement(col.enumValues)
    default: return faker.lorem.word()
  }
}

function generateColumnValue(
  col: ColumnDefinition,
  index: number,
  dateFrom: Date,
  dateTo: Date,
): unknown {
  if (col.type === 'ENUM' && col.enumValues.length > 0) {
    return faker.helpers.arrayElement(col.enumValues)
  }

  if (col.useFixedValues && col.fixedValues.length > 0) {
    return faker.helpers.arrayElement(col.fixedValues)
  }

  if (col.usePrefix && col.type === 'VARCHAR') {
    const num = String(index + 1).padStart(col.prefixDigits, '0')
    return `${col.prefix}${num}`
  }

  const isIntType = ['TINYINT', 'INT', 'BIGINT'].includes(col.type)
  if (col.useSequential && isIntType) {
    return index + 1
  }

  return generateTypedValue(col, dateFrom, dateTo)
}

export function generateRows(
  tables: TableDefinition[],
): { tableId: string; rows: Row[] }[] {
  const { order, cycleTableIds } = topologicalSort(tables)
  const tableMap = new Map(tables.map((t) => [t.id, t]))
  const generatedPkValues = new Map<string, unknown[]>()

  const results: { tableId: string; rows: Row[] }[] = []

  for (const tableId of order) {
    const table = tableMap.get(tableId)
    if (!table) continue

    const rowCount = table.rowCount
    const dateFrom = new Date('2020-01-01')
    const dateTo = new Date()

    const pkColumns = table.columns.filter((c) => c.isPrimaryKey)
    const uniqueTrackers = new Map<string, Set<string>>()
    for (const col of table.columns) {
      if (col.isUnique) uniqueTrackers.set(col.id, new Set())
    }

    const compositePkTracker = new Set<string>()
    const rows: Row[] = []

    for (let i = 0; i < rowCount; i++) {
      const row: Row = {}

      for (const col of table.columns) {
        if (col.nullable && Math.random() * 100 < col.nullRate) {
          row[col.name] = null
          continue
        }

        if (col.isForeignKey && col.foreignKeyRef) {
          const isCyclic = cycleTableIds.has(tableId)
          if (isCyclic) {
            row[col.name] = null
            continue
          }
          const pkKey = `${col.foreignKeyRef.tableId}::${col.foreignKeyRef.columnId}`
          const pkVals = generatedPkValues.get(pkKey)
          if (pkVals && pkVals.length > 0) {
            row[col.name] = faker.helpers.arrayElement(pkVals)
          } else {
            row[col.name] = null
          }
          continue
        }

        if (col.isUnique) {
          const tracker = uniqueTrackers.get(col.id)!
          let val: unknown
          let attempts = 0
          do {
            val = generateColumnValue(col, i, dateFrom, dateTo)
            attempts++
            if (attempts > 10000) break
          } while (tracker.has(String(val)))
          tracker.add(String(val))
          row[col.name] = val
          continue
        }

        row[col.name] = generateColumnValue(col, i, dateFrom, dateTo)
      }

      if (pkColumns.length > 1) {
        const compositeKey = pkColumns.map((c) => String(row[c.name])).join('::')
        if (compositePkTracker.has(compositeKey)) {
          i--
          continue
        }
        compositePkTracker.add(compositeKey)
      }

      rows.push(row)

      for (const pkCol of pkColumns) {
        const key = `${tableId}::${pkCol.id}`
        if (!generatedPkValues.has(key)) generatedPkValues.set(key, [])
        generatedPkValues.get(key)!.push(row[pkCol.name])
      }
    }

    results.push({ tableId, rows })
  }

  return results
}
