import type { FakerCategory } from '@/types/schema'

export const FAKER_CATEGORIES: { value: FakerCategory; label: string }[] = [
  { value: 'auto', label: '自動（カラム名から推測）' },
  { value: 'person.fullName', label: '氏名' },
  { value: 'person.firstName', label: '名' },
  { value: 'person.lastName', label: '姓' },
  { value: 'internet.email', label: 'メールアドレス' },
  { value: 'internet.userName', label: 'ユーザー名' },
  { value: 'internet.url', label: 'URL' },
  { value: 'phone.number', label: '電話番号' },
  { value: 'location.city', label: '市区町村' },
  { value: 'location.state', label: '都道府県' },
  { value: 'location.streetAddress', label: '番地' },
  { value: 'location.zipCode', label: '郵便番号' },
  { value: 'location.country', label: '国名' },
  { value: 'company.name', label: '会社名' },
  { value: 'lorem.word', label: 'ランダム単語' },
  { value: 'lorem.sentence', label: 'ランダム文章' },
  { value: 'datatype.uuid', label: 'UUID' },
]

const NAME_MAP: Record<string, FakerCategory> = {
  name: 'person.fullName',
  full_name: 'person.fullName',
  fullname: 'person.fullName',
  first_name: 'person.firstName',
  firstname: 'person.firstName',
  last_name: 'person.lastName',
  lastname: 'person.lastName',
  email: 'internet.email',
  mail: 'internet.email',
  username: 'internet.userName',
  user_name: 'internet.userName',
  url: 'internet.url',
  website: 'internet.url',
  phone: 'phone.number',
  tel: 'phone.number',
  telephone: 'phone.number',
  city: 'location.city',
  prefecture: 'location.state',
  state: 'location.state',
  address: 'location.streetAddress',
  zip: 'location.zipCode',
  zip_code: 'location.zipCode',
  postal_code: 'location.zipCode',
  country: 'location.country',
  company: 'company.name',
  company_name: 'company.name',
  uuid: 'datatype.uuid',
}

export function inferFakerCategory(columnName: string): FakerCategory {
  const lower = columnName.toLowerCase()
  return NAME_MAP[lower] ?? 'lorem.word'
}
