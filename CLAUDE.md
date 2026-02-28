# CLAUDE.md

## プロジェクト概要

インターンとして時給制で働く際の、月次給与と評価サイクル（160時間単位）の進捗を管理するWebアプリ。

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 16 (App Router, Turbopack) |
| 言語 | TypeScript |
| DB | PostgreSQL 16 (Docker) + Prisma 7 ORM |
| UI | Tailwind CSS v4 + shadcn/ui v3 |
| 実行環境 | Docker Compose (app + db) |

## 開発環境の起動

```bash
# 初回のみ: コンテナ起動 → マイグレーション
docker compose up -d
docker compose exec app sh -c "npx prisma migrate dev --name init"

# 2回目以降
docker compose up -d
```

`http://localhost:3000` でアクセス。

## よく使うコマンド

```bash
# コンテナのログ確認
docker compose logs app -f

# Prismaマイグレーション（スキーマ変更時）
docker compose exec app sh -c "npx prisma migrate dev --name <変更名>"

# Prisma Clientの再生成（schema.prisma変更後）
docker compose exec app sh -c "npx prisma generate && chown -R 1000:1000 src/generated/"
# ↑ 再生成後は必ずコンテナを再起動すること（古いクライアントがキャッシュされるため）
docker compose restart app

# パッケージ追加
docker compose exec app sh -c "npm install <package>"

# shadcn/uiコンポーネント追加
docker compose exec app sh -c "npx shadcn@latest add <component> --yes"

# コンテナを止める
docker compose down

# DBデータも含めて完全リセット
docker compose down -v
```

**注意**: WSL側にnpm/npxがないため、パッケージ操作はすべて `docker compose exec app` 経由で行う。

## ディレクトリ構成

```
src/
  app/
    actions/
      work-sessions.ts  # Server Actions: 勤務記録のCRUD・取得
      settings.ts       # Server Actions: 設定の取得・更新
    records/
      page.tsx                # 勤務記録一覧 (Server Component)
      RecordsPageWrapper.tsx  # 月切替ルーティング (Client Component)
      RecordsClient.tsx       # テーブル・モーダル表示 (Client Component)
      WorkSessionForm.tsx     # 追加・編集・削除モーダル (Client Component)
    settings/
      page.tsx          # 設定ページ (Server Component)
      SettingsForm.tsx  # 設定フォーム (Client Component)
    page.tsx            # ダッシュボード (Server Component)
    layout.tsx          # ナビゲーション付きレイアウト
    globals.css         # Tailwind + shadcn/ui CSS変数
  lib/
    prisma.ts   # PrismaClient シングルトン (pg アダプター使用)
    time.ts     # calcWorkMinutes ユーティリティ
  components/
    ui/         # shadcn/ui コンポーネント
  generated/
    prisma/     # Prisma 生成クライアント (編集禁止)
prisma/
  schema.prisma       # DBスキーマ定義
  migrations/         # マイグレーション履歴
prisma.config.ts      # Prisma 7 設定
docker-compose.yml
Dockerfile
```

## DBスキーマ

### WorkSession (work_sessions)
| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (UUID) | PK |
| date | DateTime (Date) | 勤務日 |
| startTime | String | 開始時刻 (HH:MM) |
| endTime | String | 終了時刻 (HH:MM) |
| breakMinutes | Int | 休憩時間(分) |
| note | String? | メモ |
| createdAt / updatedAt | DateTime | タイムスタンプ |

### Settings (settings)
| カラム | 型 | 説明 |
|--------|-----|------|
| id | String | PK (固定値: "default") |
| hourlyRate | Int | 時給 (円) |
| evaluationCycleHours | Int | 評価サイクル時間数 (デフォルト 160) |
| cycleStartDate | DateTime | 現在の評価サイクル開始日 |

## 重要な実装上の制約

### Prisma 7
- `@prisma/adapter-pg` アダプターが必須。直接 `new PrismaClient()` は不可。
- クライアントは `src/generated/prisma/` に生成される（`node_modules` ではない）。
- `prisma.config.ts` で datasource URL を設定（`DATABASE_URL` 環境変数から読む）。

### "use server" ファイルのルール
- `"use server"` を付けたファイルには **async 関数のみ** export できる。
- 純粋な計算ユーティリティ（`calcWorkMinutes` 等）は `src/lib/` に分離する。

### Docker node_modules
- node_modules はコンテナ内の anonymous volume に保持される（ホストと非同期）。
- IDE の型エラー（`prisma/config` 等）はホスト側の node_modules 不足が原因。コンテナ内の実行には影響しない。
- Docker が作成したファイルは root 所有になる場合がある。
  修正: `docker compose exec app sh -c "chown -R 1000:1000 <dir>"`

### Tailwind CSS v4
- `tailwind.config.js` は不要。CSS変数ベースの設定（`globals.css` に定義済み）。

## Git コミットルール（Claude Code）

Claude Code がコミットを作成する際の規約。

### コミットメッセージ形式

```
<type>: <変更の概要（日本語可）>

<本文：なぜこの変更をしたか（任意）>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### type の種類

| type | 用途 |
|------|------|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `style` | UIや書式の変更（ロジック変更なし） |
| `refactor` | リファクタリング（機能変更なし） |
| `docs` | ドキュメントのみの変更 |
| `chore` | ビルド・設定ファイルの変更 |

### コミット粒度の方針

- 1コミット = 1つの論理的な変更単位
- 複数の独立した変更は別コミットに分ける
- ユーザーから明示的に指示された場合のみコミットを作成する

### 禁止事項

- `--no-verify`（フック回避）は使用しない
- `git push --force` は使用しない
- `git commit --amend` は明示的な指示がない限り使用しない
- 空コミットは作成しない

## 将来の Supabase 移行

`docker-compose.yml` の `DATABASE_URL` を Supabase の接続文字列に差し替えるだけで移行可能。Prisma スキーマはそのまま使える。

```yaml
environment:
  - DATABASE_URL=postgresql://postgres.<project>:<password>@<host>:5432/postgres
```
