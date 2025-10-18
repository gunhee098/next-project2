# My Blog App

Next.js App Routerを使用して構築された現代的なブログアプリケーションです。JWT認証、コメント、いいね機能、ダークモード、多言語サポートなどの機能を提供します。

## 🔒 セキュリティ強化版

このバージョンは**httpOnlyクッキーベースの認証**を採用し、XSS攻撃に対する保護を強化しています。

### セキュリティ特徴

- **httpOnlyクッキー**: JWTトークンをhttpOnlyクッキーに保存し、JavaScriptからのアクセスを防止
- **XSS攻撃防止**: クライアント側でトークンが盗まれるリスクを排除
- **SameSite属性**: CSRF攻撃を防ぐためSameSite=Strictを設定
- **Secure属性**: HTTPS環境でのみクッキーを送信
- **自動認証**: `credentials: 'include'`で全APIリクエストに自動的にクッキーを含める

## 🚀 主な機能

- **ユーザー認証**: JWT基盤の会員登録・ログイン（httpOnlyクッキー方式）
- **ブログ投稿**: 記事の作成、編集、削除
- **コメントシステム**: 記事別コメント作成・削除
- **いいね機能**: 記事への「いいね」・取り消し
- **画像アップロード**: Cloudinary連携
- **検索機能**: タイトル・内容検索
- **ダークモード**: ライト・ダークテーマ対応
- **多言語対応**: 英語・日本語サポート
- **レスポンシブデザイン**: モバイルフレンドリーUI

## 🛠 技術スタック

- **フロントエンド**: React 18, Next.js 13+ (App Router), TypeScript
- **スタイリング**: Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: JWT + httpOnlyクッキー + bcrypt
- **画像ストレージ**: Cloudinary
- **ユーティリティ**: date-fns

## 📁 プロジェクト構造

```
my-next-project/
├── app/
│   ├── api/                 # APIルート
│   │   ├── auth/           # 認証API（httpOnlyクッキー対応）
│   │   ├── comments/       # コメントAPI
│   │   ├── likes/          # いいねAPI
│   │   ├── posts/          # 記事API
│   │   ├── upload/         # 画像アップロードAPI
│   │   ├── auth/me/        # 現在のユーザー情報取得
│   │   └── user/           # ユーザーAPI
│   ├── blog/               # ブログページ群
│   │   ├── [id]/           # 個別記事ページ
│   │   ├── [id]/edit/      # 記事編集ページ
│   │   ├── new/            # 新規記事作成
│   │   └── page.tsx        # 記事一覧
│   ├── components/         # 再利用可能コンポーネント
│   │   ├── LanguageProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemeToggleButton.tsx
│   │   ├── ShareButton.tsx
│   │   └── post-form.tsx
│   ├── lib/                # ライブラリ・設定
│   │   ├── auth.ts         # 認証ユーティリティ（httpOnlyクッキー対応）
│   │   └── prisma.ts
│   ├── locales/           # 多言語ファイル
│   │   ├── en.json
│   │   └── ja.json
│   ├── register/          # ユーザー登録
│   ├── hooks/            # カスタムフック
│   │   └── useAuth.tsx
│   ├── styles/           # スタイル
│   │   └── globals.css
│   ├── layout.tsx        # グローバルレイアウト
│   ├── page.tsx          # メインページ（ログイン）
│   ├── providers.tsx     # Context Providers
│   └── middleware.ts     # Next.js ミドルウェア（認証保護）
├── prisma/              # データベーススキーマ
├── public/              # 静的ファイル
│   └── *.svg           # アイコンファイル群
├── .env                 # 環境変数
├── README.md           # このファイル
└── 設定ファイル群...
```

## 🏃‍♂️ 開始方法

### 1. クローン・インストール

```bash
git clone <repository-url>
cd my-next-project
npm install
```

### 2. 環境変数設定

`.env.local`ファイルを作成し、以下の内容を追加してください：

```env
# データベース
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# JWT（httpOnlyクッキー用）
JWT_SECRET="your_jwt_secret_key_min_32_chars"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Node環境
NODE_ENV="development"
```

### 3. データベース設定

```bash
# Prismaスキーマ生成
npx prisma generate

# データベースマイグレーション
npx prisma db push

# Prisma Studio（オプション）
npx prisma studio
```

### 4. 開発サーバー実行

```bash
npm run dev
```

ブラウザで`http://localhost:3000`にアクセスしてください。

## 📱 使用方法

1. **ユーザー登録**: `/register`でアカウント作成
2. **ログイン**: メールアドレスとパスワードでログイン（httpOnlyクッキーが自動設定）
3. **投稿作成**: ログイン後、新しい記事を作成
4. **インタラクション**: コメント投稿、いいね、検索などを利用
5. **設定変更**: 右上からテーマ・言語を変更

## 🔐 認証フロー（httpOnlyクッキー方式）

```
1. ログイン
   ↓
2. サーバーがJWTトークンを生成
   ↓
3. httpOnly + Secure + SameSite=Strict クッキーで返却
   ↓
4. ブラウザが自動的にクッキーを保存
   ↓
5. 以降のリクエストで credentials: 'include' で自動送信
   ↓
6. ミドルウェアがクッキーからトークンを検証
```

## 🔧 開発用スクリプト

```bash
npm run dev          # 開発サーバー実行
npm run build        # 本番用ビルド
npm run start        # 本番サーバー実行
npm run lint         # ESLint実行
npx prisma studio   # Prisma Studio実行
```

## 📦 主要依存関係

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "prisma": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.0.0",
  "cloudinary": "^1.0.0"
}
```

## 🚀 デプロイメント

### Vercelでのデプロイ

1. GitHubにコードをプッシュ
2. [Vercel](https://vercel.com)でインポート
3. 環境変数を設定（`JWT_SECRET`は本番環境用の強力なキーを使用）
4. デプロイ完了

### 本番環境のセキュリティ設定

- `NODE_ENV="production"`を設定
- `JWT_SECRET`は最小32文字以上の強力なランダム文字列
- HTTPSを強制
- CORS設定の適切な限定

### データベース

- **開発環境**: ローカルPostgreSQL
- **本番環境**: Railway、PlanetScale、Supabaseなどを推奨

## 🔒 セキュリティベストプラクティス

1. **httpOnlyクッキー**: XSS攻撃からの保護
2. **入力値検証**: サーバーサイドでの厳格な検証
3. **レート制限**: ブルートフォース攻撃への対策
4. **パスワードハッシュ化**: bcryptで安全に暗号化
5. **CORS設定**: 不正なクロスオリジンリクエストを防止
6. **ミドルウェア認証**: 保護されたルートへのアクセス制御

## 🤝 コントリビューション

1. プロジェクトをフォーク
2. Featureブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で配布されています。

---

⭐ このプロジェクトが役に立ちましたら、スターをお願いします！