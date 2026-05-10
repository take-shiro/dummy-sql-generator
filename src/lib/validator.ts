import type { TableDefinition, ValidationError } from '@/types/schema'

export function validate(tables: TableDefinition[]): ValidationError[] {
  const errors: ValidationError[] = []
  const tableMap = new Map(tables.map((t) => [t.id, t]))

  for (const table of tables) {
    const pkColumns = table.columns.filter((c) => c.isPrimaryKey)
    if (pkColumns.length === 0) {
      errors.push({
        tableId: table.id,
        message: `テーブル "${table.name}" にPKが設定されていません`,
      })
    }

    for (const col of table.columns) {
      if (col.type === 'ENUM' && col.enumValues.length === 0) {
        errors.push({
          tableId: table.id,
          columnId: col.id,
          message: `"${table.name}.${col.name}": ENUM の選択肢が未定義です`,
        })
      }

      if (col.useFixedValues && col.fixedValues.length === 0) {
        errors.push({
          tableId: table.id,
          columnId: col.id,
          message: `"${table.name}.${col.name}": 固定選択肢が未定義です`,
        })
      }

      if (col.isForeignKey && col.foreignKeyRef) {
        const refTable = tableMap.get(col.foreignKeyRef.tableId)
        if (!refTable) {
          errors.push({
            tableId: table.id,
            columnId: col.id,
            message: `"${table.name}.${col.name}": FK参照先テーブルが存在しません`,
          })
          continue
        }

        const refCol = refTable.columns.find((c) => c.id === col.foreignKeyRef!.columnId)
        if (!refCol) {
          errors.push({
            tableId: table.id,
            columnId: col.id,
            message: `"${table.name}.${col.name}": FK参照先カラムが存在しません`,
          })
          continue
        }

        if (!refCol.isPrimaryKey) {
          errors.push({
            tableId: table.id,
            columnId: col.id,
            message: `"${table.name}.${col.name}": FK参照先カラム "${refTable.name}.${refCol.name}" はPKではありません`,
          })
        }
      }
    }
  }

  return errors
}

export function validateUniqueCapacity(
  tables: TableDefinition[],
  rowCount: number,
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const table of tables) {
    for (const col of table.columns) {
      if (!col.isUnique) continue

      const hasFixedValues =
        (col.type === 'ENUM' && col.enumValues.length > 0) ||
        (col.useFixedValues && col.fixedValues.length > 0)

      if (hasFixedValues) {
        const values = col.type === 'ENUM' ? col.enumValues : col.fixedValues
        if (values.length < rowCount) {
          errors.push({
            tableId: table.id,
            columnId: col.id,
            message: `"${table.name}.${col.name}": UNIQUE制約がありますが、選択肢数(${values.length})が生成件数(${rowCount})を下回っています`,
          })
        }
      }
    }
  }

  return errors
}
