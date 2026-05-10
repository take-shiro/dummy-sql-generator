import type { TableDefinition, GenerationWarning } from '@/types/schema'

export interface TopologicalResult {
  order: string[]
  warnings: GenerationWarning[]
  cycleTableIds: Set<string>
}

export function topologicalSort(tables: TableDefinition[]): TopologicalResult {
  const warnings: GenerationWarning[] = []
  const tableIds = tables.map((t) => t.id)
  const tableMap = new Map(tables.map((t) => [t.id, t]))

  const deps = new Map<string, Set<string>>()
  for (const table of tables) {
    deps.set(table.id, new Set())
    for (const col of table.columns) {
      if (col.isForeignKey && col.foreignKeyRef) {
        const refTableId = col.foreignKeyRef.tableId
        if (refTableId !== table.id && tableMap.has(refTableId)) {
          deps.get(table.id)!.add(refTableId)
        }
      }
    }
  }

  const visited = new Set<string>()
  const inStack = new Set<string>()
  const cycleTableIds = new Set<string>()
  const order: string[] = []

  function dfs(id: string): boolean {
    if (inStack.has(id)) {
      cycleTableIds.add(id)
      return true
    }
    if (visited.has(id)) return false

    inStack.add(id)
    for (const dep of deps.get(id) ?? []) {
      if (dfs(dep)) {
        cycleTableIds.add(id)
      }
    }
    inStack.delete(id)
    visited.add(id)
    order.push(id)
    return false
  }

  for (const id of tableIds) {
    dfs(id)
  }

  if (cycleTableIds.size > 0) {
    const names = [...cycleTableIds]
      .map((id) => tableMap.get(id)?.name ?? id)
      .join(', ')
    warnings.push({
      message: `循環参照が検出されました（${names}）。該当するFKカラムの値はNULLで生成されます。`,
    })
  }

  return { order, warnings, cycleTableIds }
}
