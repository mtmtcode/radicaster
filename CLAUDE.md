# CLAUDE.md

## プロジェクト概要

radicasterはRadikoの番組を録音しPodcast化するサーバーレスアプリケーション。AWS Lambda, EventBridge, S3, CloudFrontを活用し、低コストで運用する。

## アーキテクチャ

4つのコンポーネントで構成される多言語プロジェクト:

- **cli/** — 録音登録用CLIツール (Ruby 2.7)
- **rec_radiko/** — 録音実行Lambda関数 (Ruby 2.7 + FFmpeg, Docker)
- **gen_feed/** — Podcastフィード生成Lambda関数 (Ruby 2.7, Docker)
- **deployment/** — AWSインフラ定義 (AWS CDK v2, TypeScript)
- **web/** — 管理用Webダッシュボード (Next.js 16, React 19, TypeScript)

データフロー: CLI/Web → S3(定義YAML) + EventBridge(スケジュール) → rec_radiko Lambda(録音) → S3(M4Aアップロード) → gen_feed Lambda(RSS生成) → CloudFront(配信)

## 技術スタック

- Ruby 2.7 (Lambda関数, CLI)
- TypeScript 5 (CDK, Web)
- Next.js 16 / React 19 / Tailwind CSS v4 (Web UI)
- AWS CDK v2 (インフラ)
- Docker (Lambda コンテナイメージ)
- バージョン管理: mise (.mise.toml)

## ビルド・テストコマンド

### Ruby (cli, rec_radiko, gen_feed)

```bash
# テスト実行（各ディレクトリで）
bundle exec rspec

# 単一ファイルのテスト
bundle exec rspec spec/path/to/spec.rb

# Docker ビルド（rec_radiko, gen_feed）
bundle exec rake build

# Docker 実行（ローカルテスト用）
bundle exec rake run
```

### CDK (deployment/)

```bash
cd deployment
npm run build    # TypeScriptコンパイル
npm run test     # Jestテスト
cdk synth        # CloudFormationテンプレート生成
cdk diff         # 差分確認
cdk deploy --all # デプロイ
```

### Web (web/)

```bash
cd web
npm run dev      # 開発サーバー (localhost:3000)
npm run build    # プロダクションビルド
npm run lint     # ESLint
```

## コーディング規約

### Ruby

- モジュールによる名前空間: `Radicaster::CLI`, `Radicaster::RecRadiko`, `Radicaster::GenFeed`
- `attr_reader` を優先（イミュータブル指向）
- テストは RSpec（BDDスタイル, `rspec-parameterized` でデータ駆動テスト）

### TypeScript / React

- strict モード有効
- フォームバリデーション: react-hook-form + zod
- スタイリング: Tailwind CSS
- サーバーサイドAWS操作: Next.js Server Actions / API Routes
- アイコン: lucide-react

## プロジェクト構造

```
cli/lib/cli/          # CLI ビジネスロジック
rec_radiko/lib/rec-radiko/  # 録音ロジック
gen_feed/lib/gen-feed/      # フィード生成ロジック
deployment/lib/       # CDKスタック定義
web/app/              # Next.js App Router (ページ, API, コンポーネント)
web/lib/              # ユーティリティ, Server Actions
```

## 環境変数

`.env.example` を参照。主要な変数:

- `RADICASTER_S3_BUCKET` — S3バケット名
- `RADICASTER_BASIC_AUTH_USER` / `RADICASTER_BASIC_AUTH_PASSWORD` — Basic認証
- `RADICASTER_REC_RADIKO_ARN` — 録音Lambda関数ARN
- `RADICASTER_RADIKO_MAIL` / `RADICASTER_RADIKO_PASSWORD` — Radikoプレミアム（任意）

## 注意事項

- 個人での視聴目的以外での利用は禁止
- Rubyコンポーネントは Ruby 2.7 を要求する（Gemfile で `ruby "~> 2.7.0"` 指定）
- Lambda関数はDockerコンテナイメージとしてデプロイされる
- ドキュメント・コメントは日本語
