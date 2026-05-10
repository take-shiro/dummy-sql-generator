import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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
import { buildSql } from '@/lib/sql-builder'
import type { TableDefinition, GenerationWarning } from '@/types/schema'

interface Props {
  tables: TableDefinition[]
}

export function OutputPanel({ tables }: Props) {
  const [includeTruncate, setIncludeTruncate] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sql, setSql] = useState('')
  const [warnings, setWarnings] = useState<GenerationWarning[]>([])
  const [copied, setCopied] = useState(false)

  function handleGenerate(withTruncate: boolean) {
    const result = buildSql(tables, withTruncate)
    setSql(result.sql)
    setWarnings(result.warnings)
  }

  function onClickGenerate() {
    if (includeTruncate) {
      setConfirmOpen(true)
    } else {
      handleGenerate(false)
    }
  }

  async function onCopy() {
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={includeTruncate} onCheckedChange={setIncludeTruncate} />
          TRUNCATE を先頭に付加
        </label>
        <Button onClick={onClickGenerate}>SQL を生成</Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>TRUNCATE の確認</AlertDialogTitle>
            <AlertDialogDescription>
              生成されるSQLの先頭に <code>TRUNCATE TABLE</code> が含まれます。
              実行するとテーブルのデータが全て削除されます。本当に続行しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => handleGenerate(true)}
            >
              続行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
              {w.message}
            </div>
          ))}
        </div>
      )}

      {sql && (
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={onCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'コピー済み' : 'コピー'}
          </Button>
          <textarea
            readOnly
            value={sql}
            className="w-full h-96 font-mono text-xs p-4 rounded-md border bg-muted resize-y"
          />
        </div>
      )}
    </div>
  )
}
