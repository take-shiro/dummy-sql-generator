import { useState, useEffect } from 'react'
import type { TableDefinition, ColumnDefinition } from '@/types/schema'

const uuidv4 = () => crypto.randomUUID()

const STORAGE_KEY = 'dummy-sql-generator-schema'

function createDefaultColumn(): ColumnDefinition {
  return {
    id: uuidv4(),
    name: '',
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
    dateRange: {
      from: '2020-01-01',
      to: new Date().toISOString().slice(0, 10),
    },
  }
}

function createDefaultTable(): TableDefinition {
  return {
    id: uuidv4(),
    name: '',
    columns: [createDefaultColumn()],
    rowCount: 100,
  }
}

function loadFromStorage(): TableDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [createDefaultTable()]
    const parsed = JSON.parse(raw) as TableDefinition[]
    return parsed.map((t) => ({
      rowCount: 100,
      ...t,
      columns: t.columns.map((c) => ({ useSequential: false, ...c })),
    }))
  } catch {
    return [createDefaultTable()]
  }
}

export function useSchema() {
  const [tables, setTables] = useState<TableDefinition[]>(loadFromStorage)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables))
  }, [tables])

  function addTable() {
    setTables((prev) => [...prev, createDefaultTable()])
  }

  function removeTable(tableId: string) {
    setTables((prev) => prev.filter((t) => t.id !== tableId))
  }

  function updateTable(tableId: string, patch: Partial<Pick<TableDefinition, 'name' | 'rowCount'>>) {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, ...patch } : t)),
    )
  }

  function addColumn(tableId: string) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, columns: [...t.columns, createDefaultColumn()] }
          : t,
      ),
    )
  }

  function removeColumn(tableId: string, columnId: string) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) }
          : t,
      ),
    )
  }

  function updateColumn(tableId: string, columnId: string, patch: Partial<ColumnDefinition>) {
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.map((c) =>
                c.id === columnId ? { ...c, ...patch } : c,
              ),
            }
          : t,
      ),
    )
  }

  function importColumns(tableId: string, columns: ColumnDefinition[]) {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, columns } : t)),
    )
  }

  function resetAll() {
    const fresh = [createDefaultTable()]
    setTables(fresh)
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    tables,
    addTable,
    removeTable,
    updateTable,
    addColumn,
    removeColumn,
    updateColumn,
    importColumns,
    resetAll,
    createDefaultColumn,
  }
}
