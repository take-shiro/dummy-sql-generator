import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ColumnRow } from './ColumnRow'
import { DescribeImportDialog } from './DescribeImportDialog'
import type { ColumnDefinition, TableDefinition } from '@/types/schema'

interface Props {
  table: TableDefinition
  tables: TableDefinition[]
  onUpdateTable: (patch: Partial<Pick<TableDefinition, 'name' | 'rowCount'>>) => void
  onRemoveTable: () => void
  onAddColumn: () => void
  onRemoveColumn: (columnId: string) => void
  onUpdateColumn: (columnId: string, patch: Partial<ColumnDefinition>) => void
  onImportColumns: (columns: ColumnDefinition[]) => void
}

export function TablePanel({
  table,
  tables,
  onUpdateTable,
  onRemoveTable,
  onAddColumn,
  onRemoveColumn,
  onUpdateColumn,
  onImportColumns,
}: Props) {
  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          placeholder="テーブル名"
          value={table.name}
          onChange={(e) => onUpdateTable({ name: e.target.value })}
          className="font-medium w-48"
        />
        <label className="flex items-center gap-1.5 text-sm">
          生成件数
          <Input
            type="number"
            min={1}
            value={table.rowCount}
            onChange={(e) => onUpdateTable({ rowCount: Number(e.target.value) })}
            className="w-20"
          />
          件
        </label>
        <DescribeImportDialog onImport={onImportColumns} />
        <Button variant="ghost" size="icon" onClick={onRemoveTable} className="ml-auto">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="space-y-2">
        {table.columns.map((col) => (
          <ColumnRow
            key={col.id}
            col={col}
            tables={tables}
            tableId={table.id}
            onChange={(patch) => onUpdateColumn(col.id, patch)}
            onRemove={() => onRemoveColumn(col.id)}
          />
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={onAddColumn}>
        <Plus className="h-4 w-4 mr-1" />
        カラム追加
      </Button>
    </div>
  )
}
