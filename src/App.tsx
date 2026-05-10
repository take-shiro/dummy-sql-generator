import { Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { TablePanel } from '@/components/TablePanel'
import { OutputPanel } from '@/components/OutputPanel'
import { useSchema } from '@/hooks/useSchema'

export default function App() {
  const {
    tables,
    addTable,
    removeTable,
    updateTable,
    addColumn,
    removeColumn,
    updateColumn,
    importColumns,
    resetAll,
  } = useSchema()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold">DummySqlGenerator</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              全リセット
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>全リセットの確認</AlertDialogTitle>
              <AlertDialogDescription>
                全てのテーブル定義を削除します。この操作は元に戻せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={resetAll}
              >
                リセット
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tables.map((table) => (
            <TablePanel
              key={table.id}
              table={table}
              tables={tables}
              onUpdateTable={(patch) => updateTable(table.id, patch)}
              onRemoveTable={() => removeTable(table.id)}
              onAddColumn={() => addColumn(table.id)}
              onRemoveColumn={(colId) => removeColumn(table.id, colId)}
              onUpdateColumn={(colId, patch) => updateColumn(table.id, colId, patch)}
              onImportColumns={(columns) => importColumns(table.id, columns)}
            />
          ))}
          <Button variant="outline" onClick={addTable}>
            <Plus className="h-4 w-4 mr-1" />
            テーブル追加
          </Button>
        </div>

        <div className="border-t p-6 bg-muted/20">
          <OutputPanel tables={tables} />
        </div>
      </div>
    </div>
  )
}
