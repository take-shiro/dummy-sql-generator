import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FAKER_CATEGORIES } from '@/lib/faker-map'
import type { ColumnDefinition, ColumnType, TableDefinition } from '@/types/schema'

const COLUMN_TYPES: ColumnType[] = [
  'TINYINT', 'INT', 'BIGINT', 'DECIMAL', 'FLOAT',
  'VARCHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP',
  'BOOLEAN', 'ENUM',
]

interface Props {
  col: ColumnDefinition
  tables: TableDefinition[]
  tableId: string
  onChange: (patch: Partial<ColumnDefinition>) => void
  onRemove: () => void
}

export function ColumnRow({ col, tables, tableId, onChange, onRemove }: Props) {
  const isIntType = ['TINYINT', 'INT', 'BIGINT'].includes(col.type)
  const isDate = ['DATE', 'DATETIME', 'TIMESTAMP'].includes(col.type)
  const isVarchar = col.type === 'VARCHAR'
  const isEnum = col.type === 'ENUM'
  const isDecimal = ['DECIMAL', 'FLOAT'].includes(col.type)
  const otherTables = tables.filter((t) => t.id !== tableId)
  const refTable = otherTables.find((t) => t.id === col.foreignKeyRef?.tableId)
  const pkColumns = refTable?.columns.filter((c) => c.isPrimaryKey) ?? []

  return (
    <div className="border rounded-md p-3 space-y-3 bg-white">
      <div className="flex items-center gap-2">
        <Input
          placeholder="カラム名"
          value={col.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-48"
        />
        <Select value={col.type} onValueChange={(v) => onChange({ type: v as ColumnType })}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMN_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <Switch checked={col.isPrimaryKey} onCheckedChange={(v) => onChange({ isPrimaryKey: v })} />
          PK
        </label>
        <label className="flex items-center gap-1.5">
          <Switch checked={col.isUnique} onCheckedChange={(v) => onChange({ isUnique: v })} />
          UNIQUE
        </label>
        <label className="flex items-center gap-1.5">
          <Switch checked={col.nullable} onCheckedChange={(v) => onChange({ nullable: v, nullRate: v ? col.nullRate : 0 })} />
          NULL可
        </label>
        {col.nullable && (
          <label className="flex items-center gap-1.5">
            NULL率
            <Input
              type="number"
              min={0}
              max={100}
              value={col.nullRate}
              onChange={(e) => onChange({ nullRate: Number(e.target.value) })}
              className="w-16"
            />
            %
          </label>
        )}
        <label className="flex items-center gap-1.5">
          <Switch checked={col.isForeignKey} onCheckedChange={(v) => onChange({ isForeignKey: v, foreignKeyRef: null })} />
          FK
        </label>
      </div>

      {col.isForeignKey && (
        <div className="flex gap-2 items-center text-sm">
          <Label>参照テーブル</Label>
          <Select
            value={col.foreignKeyRef?.tableId ?? ''}
            onValueChange={(v) => onChange({ foreignKeyRef: { tableId: v, columnId: '' } })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="テーブルを選択" />
            </SelectTrigger>
            <SelectContent>
              {otherTables.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {refTable && (
            <>
              <Label>PKカラム</Label>
              <Select
                value={col.foreignKeyRef?.columnId ?? ''}
                onValueChange={(v) => onChange({ foreignKeyRef: { tableId: refTable.id, columnId: v } })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="カラムを選択" />
                </SelectTrigger>
                <SelectContent>
                  {pkColumns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      )}

      {isVarchar && (
        <div className="flex flex-wrap gap-4 text-sm items-center">
          <label className="flex items-center gap-1.5">
            最大長
            <Input
              type="number"
              min={1}
              value={col.maxLength ?? 255}
              onChange={(e) => onChange({ maxLength: Number(e.target.value) })}
              className="w-20"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <Switch checked={col.useFixedValues} onCheckedChange={(v) => onChange({ useFixedValues: v })} />
            固定選択肢
          </label>
          {col.useFixedValues && (
            <div className="w-full">
              <Input
                placeholder="カンマ区切りで入力 例: A,B,C"
                value={col.fixedValues.join(',')}
                onChange={(e) => onChange({ fixedValues: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              />
            </div>
          )}
          {!col.useFixedValues && (
            <>
              <label className="flex items-center gap-1.5">
                <Switch checked={col.usePrefix} onCheckedChange={(v) => onChange({ usePrefix: v })} />
                プレフィックス連番
              </label>
              {col.usePrefix && (
                <>
                  <label className="flex items-center gap-1.5">
                    プレフィックス
                    <Input
                      value={col.prefix}
                      onChange={(e) => onChange({ prefix: e.target.value })}
                      className="w-24"
                    />
                  </label>
                  <label className="flex items-center gap-1.5">
                    桁数
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={col.prefixDigits}
                      onChange={(e) => onChange({ prefixDigits: Number(e.target.value) })}
                      className="w-16"
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>
      )}

      {(isVarchar || isEnum) && (
        <div className="flex items-center gap-2 text-sm">
          {isEnum && (
            <div className="w-full">
              <Label>ENUM選択肢（カンマ区切り）</Label>
              <Input
                placeholder="例: active,inactive,pending"
                value={col.enumValues.join(',')}
                onChange={(e) => onChange({ enumValues: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="mt-1"
              />
            </div>
          )}
          {isVarchar && !col.useFixedValues && !col.usePrefix && (
            <div className="w-full">
              <Label>データ種別</Label>
              <Select value={col.fakerCategory} onValueChange={(v) => onChange({ fakerCategory: v as typeof col.fakerCategory })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAKER_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {isDecimal && (
        <div className="flex gap-4 text-sm items-center">
          <label className="flex items-center gap-1.5">
            精度
            <Input type="number" min={1} value={col.precision ?? 10} onChange={(e) => onChange({ precision: Number(e.target.value) })} className="w-16" />
          </label>
          <label className="flex items-center gap-1.5">
            スケール
            <Input type="number" min={0} value={col.scale ?? 2} onChange={(e) => onChange({ scale: Number(e.target.value) })} className="w-16" />
          </label>
        </div>
      )}

      {isDate && (
        <div className="flex gap-4 text-sm items-center">
          <label className="flex items-center gap-1.5">
            開始日
            <Input type="date" value={col.dateRange.from} onChange={(e) => onChange({ dateRange: { ...col.dateRange, from: e.target.value } })} className="w-36" />
          </label>
          <label className="flex items-center gap-1.5">
            終了日
            <Input type="date" value={col.dateRange.to} onChange={(e) => onChange({ dateRange: { ...col.dateRange, to: e.target.value } })} className="w-36" />
          </label>
        </div>
      )}

      {isIntType && (
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <Switch checked={col.useSequential} onCheckedChange={(v) => onChange({ useSequential: v })} />
            連番（1, 2, 3...）
          </label>
          {!col.useSequential && (
            <p className="text-xs text-muted-foreground">
              ランダム範囲: {col.type === 'TINYINT' ? '0〜127' : col.type === 'INT' ? '0〜2,147,483,647' : '0〜9,007,199,254,740,991'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
