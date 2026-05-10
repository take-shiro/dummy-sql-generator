export type ColumnType =
  | 'TINYINT'
  | 'INT'
  | 'BIGINT'
  | 'DECIMAL'
  | 'FLOAT'
  | 'VARCHAR'
  | 'TEXT'
  | 'DATE'
  | 'DATETIME'
  | 'TIMESTAMP'
  | 'BOOLEAN'
  | 'ENUM'

export type FakerCategory =
  | 'person.fullName'
  | 'person.firstName'
  | 'person.lastName'
  | 'internet.email'
  | 'internet.userName'
  | 'internet.url'
  | 'phone.number'
  | 'location.city'
  | 'location.state'
  | 'location.streetAddress'
  | 'location.zipCode'
  | 'location.country'
  | 'company.name'
  | 'lorem.word'
  | 'lorem.sentence'
  | 'datatype.uuid'
  | 'auto'

export interface ForeignKeyRef {
  tableId: string
  columnId: string
}

export interface DateRange {
  from: string
  to: string
}

export interface ColumnDefinition {
  id: string
  name: string
  type: ColumnType
  nullable: boolean
  nullRate: number
  isPrimaryKey: boolean
  isForeignKey: boolean
  foreignKeyRef: ForeignKeyRef | null
  isUnique: boolean
  enumValues: string[]
  fixedValues: string[]
  useFixedValues: boolean
  maxLength: number | null
  precision: number | null
  scale: number | null
  usePrefix: boolean
  prefix: string
  prefixDigits: number
  useSequential: boolean
  fakerCategory: FakerCategory
  dateRange: DateRange
}

export interface TableDefinition {
  id: string
  name: string
  columns: ColumnDefinition[]
  rowCount: number
}

export interface GenerationConfig {
  rowCount: number
  includeTruncate: boolean
}

export interface ValidationError {
  tableId: string
  columnId?: string
  message: string
}

export interface GenerationWarning {
  message: string
}

export interface GenerationResult {
  sql: string
  warnings: GenerationWarning[]
}
