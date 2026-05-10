import { useState } from 'react'
import { Upload } from 'lucide-react'
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
} from '@/components/ui/alert-dialog'
import { parseDescribe } from '@/lib/describe-parser'
import type { ColumnDefinition } from '@/types/schema'

interface Props {
  onImport: (columns: ColumnDefinition[]) => void
}

export function DescribeImportDialog({ onImport }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  function handleImport() {
    const parsed = parseDescribe(text)
    if (parsed.length === 0) {
      setError('カラムを読み取れませんでした。DESCRIBE の出力を貼り付けてください。')
      return
    }
    const columns: ColumnDefinition[] = parsed.map((col) => ({
      ...col,
      id: crypto.randomUUID(),
    }))
    onImport(columns)
    setOpen(false)
    setText('')
    setError('')
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="h-4 w-4 mr-1" />
        DESCRIBE インポート
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>DESCRIBE インポート</AlertDialogTitle>
            <AlertDialogDescription>
              MySQLの <code>DESCRIBE テーブル名;</code> の出力結果、またはCSV形式を貼り付けてください。
              既存のカラム定義は上書きされます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea
            className="w-full h-48 font-mono text-xs p-3 rounded-md border bg-muted resize-y"
            placeholder={`CSV形式:\nField,Type,Null,Key,Default,Extra\nid,int,NO,PRI,NULL,auto_increment\nname,varchar(100),YES,,,\n\nまたはMySQLコンソール出力:\n| id   | int          | NO | PRI | NULL |  |\n| name | varchar(100) | YES|     | NULL |  |`}
            value={text}
            onChange={(e) => { setText(e.target.value); setError('') }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>インポート</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
