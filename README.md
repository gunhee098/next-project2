# Modern Blog Application

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-latest-blue?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma" alt="Prisma">
</p>

Next.js 15 (App Router) + TypeScript で構築した、エンタープライズグレードのセキュリティを実装したブログアプリケーションです。

## 🎯 プロジェクト概要

このアプリケーションは、実務レベルのセキュリティ対策、認証システム、データベース設計を実践したフルスタックアプリケーションです。モダンな技術スタックと、実際のプロダクション環境で必要とされるベストプラクティスを採用しています。

**🌐 デモURL**: [https://next-project2-rosy.vercel.app/]
**📂 GitHubリポジトリ**: [https://github.com/gunhee098/next-project2.git]

## ✨ 主要機能

### 認証・セキュリティ
- ✅ **JWT認証** (httpOnly Cookie方式)
- ✅ **パスワードハッシュ化** (bcrypt, SALT_ROUNDS=12)
- ✅ **セッション独立性** (複数デバイス対応)
- ✅ **レート制限** (ブルートフォース攻撃対策)

### コア機能
- ✅ **投稿管理** (CRUD操作、画像アップロード)
- ✅ **コメントシステム** (ネストされた会話)
- ✅ **いいね機能** (リアルタイム更新)
- ✅ **検索機能** (タイトル・内容の全文検索)

### UI/UX
- ✅ **レスポンシブデザイン** (モバイルファースト)
- ✅ **ダークモード** (システム設定連動)
- ✅ **多言語対応** (日本語・英語)
- ✅ **アクセシビリティ** (WAI-ARIA準拠)

## 🛠️ 技術スタック

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **UI Components**: Custom components with Tailwind

### Backend
- **API**: Next.js API Routes (RESTful)
- **ORM**: Prisma 5
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Image Storage**: Cloudinary

### 開発ツール
- **Version Control**: Git / GitHub
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier

## 🔐 実装したセキュリティ対策

このプロジェクトでは、以下のセキュリティ対策を実装しています：

| 対策 | 実装方法 | 効果 |
|------|----------|------|
| **XSS攻撃防止** | httpOnly Cookie | JSからトークンアクセス不可 |
| **CSRF攻撃防止** | SameSite=Lax Cookie | クロスサイトリクエスト制限 |
| **パスワード保護** | bcrypt (SALT_ROUNDS=12) | DB漏洩時も安全 |
| **ブルートフォース対策** | レート制限 (15分/5回) | 総当たり攻撃防止 |
| **セッション管理** | 固有sessionId付与 | デバイス間の独立性確保 |
| **SQL Injection対策** | Prisma ORM | パラメータ化クエリ |

### 認証フロー
```typescript
// 1. ログイン時
POST /api/auth
→ JWTトークン生成 (sessionId付与)
→ httpOnly Cookie に保存

// 2. API呼び出し時
fetch('/api/posts', {
  credentials: 'include' // Cookie自動送信
})
→ ミドルウェアで認証チェック
→ 認証済みならデータ返却

// 3. ログアウト時
POST /api/logout
→ Cookie削除
```

## 📂 プロジェクト構造
```
app/
├── api/                    # REST API エンドポイント
│   ├── auth/              # 認証 (登録/ログイン)
│   ├── posts/             # 投稿CRUD
│   ├── comments/          # コメントCRUD
│   ├── likes/             # いいね機能
│   └── upload/            # 画像アップロード
├── blog/                  # ブログページ
│   ├── [id]/             # 動的ルーティング
│   ├── [id]/edit/        # 投稿編集
│   └── new/              # 新規投稿
├── components/            # 再利用可能コンポーネント
├── hooks/                 # カスタムフック
├── lib/                   # ユーティリティ関数
│   ├── auth.ts           # 認証ヘルパー
│   └── prisma.ts         # Prismaクライアント
└── middleware.ts         # 認証ミドルウェア

prisma/
└── schema.prisma         # データベーススキーマ
```

## 🗄️ データベース設計
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcryptハッシュ化
  name      String
  posts     Post[]
  comments  Comment[]
  likes     Like[]
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  imageUrl  String?
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  comments  Comment[]
  likes     Like[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Comment, Like モデルも同様...
```

## 🚀 ローカル環境セットアップ

### 必要な環境
- Node.js 18.x 以上
- PostgreSQL 14.x 以上
- npm または yarn

### 1. クローン & インストール
```bash
git clone https://github.com/gunhee098/next-project2.git
cd next-project2
npm install
```

### 2. 環境変数設定

`.env.local` を作成：
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/blog_db"

# JWT Secret (本番環境では32文字以上の強力なキーを使用)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# Cloudinary (画像アップロード)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Environment
NODE_ENV="development"
```

### 3. データベースセットアップ
```bash
# Prisma生成
npx prisma generate

# マイグレーション実行
npx prisma db push

# (オプション) Prisma Studio起動
npx prisma studio
```

### 4. 開発サーバー起動
```bash
npm run dev
```

→ http://localhost:3000 にアクセス

## 📊 パフォーマンス最適化

- **画像最適化**: Next.js Image コンポーネント使用
- **コード分割**: 動的import による遅延読み込み
- **メモ化**: useCallback, useMemo でレンダリング最適化
- **データベースクエリ**: Prismaで効率的なクエリ生成
- **キャッシング**: Next.js の自動キャッシング活用

## 🧪 今後の改善予定

- [ ] ユニットテスト (Jest + React Testing Library)
- [ ] E2Eテスト (Playwright)
- [ ] CI/CD パイプライン (GitHub Actions)
- [ ] WebSocket によるリアルタイム通知
- [ ] Redis によるセッションキャッシング

## 💡 学んだこと・工夫した点

### 技術面
- TypeScriptの型システムによる開発効率向上
- Next.js App Routerの最新機能活用
- Prisma ORMによる型安全なDB操作
- httpOnly Cookieによるセキュアな認証実装

### 苦労した点
**セッション独立性の実装**  
複数デバイスからの同時ログイン時、トークン管理が課題でした。各ログインごとに固有のsessionIdを付与することで、デバイス間の独立性を確保しました。
```typescript
// 各ログインで固有のセッションIDを生成
const sessionId = crypto.randomUUID();
const token = jwt.sign({
  userId: user.id,
  sessionId: sessionId, // デバイス識別用
  loginTime: Date.now()
}, JWT_SECRET);
```

## 📝 開発スクリプト
```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
npm run lint         # ESLint実行
npx prisma studio   # データベースGUI
```

## 🌐 デプロイ

**推奨プラットフォーム**: Vercel

1. GitHubにプッシュ
2. Vercelでインポート
3. 環境変数を設定
4. 自動デプロイ

**データベース**: Supabase / PlanetScale / Railway

## 👤 作成者

**名前**: Geonhee  
**Email**: imgh098@gmail.com  
**GitHub**: [@gunhee098](https://github.com/gunhee098)  
**Portfolio**: [https://next-project2-rosy.vercel.app](https://next-project2-rosy.vercel.app)

## 📄 ライセンス
  
MIT License

---

**⭐ このプロジェクトが参考になりましたら、スターをお願いします！**