# DummySqlGenerator

ブラウザだけで動作するダミーSQL生成ツールです。テーブル定義とカラム設定を入力するだけで、INSERT文形式のダミーデータを生成します。

🔗 **[https://take-shiro.github.io/dummy-sql-generator/](https://take-shiro.github.io/dummy-sql-generator/)**

## 機能

- 複数テーブルの定義・カラム設定
- テーブルごとの生成件数指定
- 対応型: `TINYINT` `INT` `BIGINT` `DECIMAL` `FLOAT` `VARCHAR` `TEXT` `DATE` `DATETIME` `TIMESTAMP` `BOOLEAN` `ENUM`
- FK の整合性を考慮した生成（トポロジカルソート）
- UNIQUE 制約・複合 PK 対応
- NULL 率をカラムごとに指定
- 連番生成（INT 系）・プレフィックス連番（VARCHAR）
- 固定選択肢・ENUM 対応
- `DESCRIBE` 出力からのインポート（CSV・パイプ区切り・タブ区切り）
- `TRUNCATE TABLE` オプション付き出力
- テーブル定義を localStorage に自動保存
- サーバー不要・完全ブラウザ完結

## 使い方

1. **テーブルを追加** → テーブル名と生成件数を入力
2. **カラムを追加** → 名前・型・制約を設定
3. **SQL を生成** ボタンを押す → INSERT 文が生成される
4. **コピー** してそのまま使う

### DESCRIBE インポート

`DESCRIBE テーブル名;` の出力結果をそのまま貼り付けてカラム定義をインポートできます。

```
# CSV形式
Field,Type,Null,Key,Default,Extra
id,int,NO,PRI,NULL,auto_increment
name,varchar(100),YES,,,

# MySQLコンソール出力もOK
| id   | int          | NO | PRI | NULL |  |
| name | varchar(100) | YES|     | NULL |  |
```

## 技術スタック

| | |
|---|---|
| フレームワーク | React + TypeScript |
| ビルド | Vite |
| スタイリング | Tailwind CSS + shadcn/ui |
| ダミーデータ | faker-js（日本語ロケール） |
| テスト | Vitest |
| ホスティング | GitHub Pages |

## ローカルで動かす

```bash
git clone https://github.com/take-shiro/dummy-sql-generator.git
cd dummy-sql-generator
npm install
npm run dev
```

## テスト

```bash
npm test
```

## ライセンス

MIT
