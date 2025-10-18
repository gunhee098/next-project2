// 📂 app/lib/prisma.ts
// このファイルは、アプリケーション全体で使用される単一のPrisma Clientインスタンスを管理します。
// ホットリロード時のパフォーマンスとデータベース接続の安定性を最適化します。

import { PrismaClient } from "@prisma/client"; // PrismaClient クラスをインポート

// [グローバルオブジェクトへのPrismaClientインスタンス格納]
// 開発環境のホットリロード時に、新しいPrismaClientインスタンスが不必要に作成されるのを防ぐための設定です。
// Node.js のグローバルオブジェクト (`globalThis` または `global`) を利用して、
// 既存のインスタンスをキャッシュし、再利用可能にします。
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined; // グローバルオブジェクトに 'prisma' プロパティを定義
};

// [PrismaClientインスタンスの初期化とエクスポート]
// - グローバルに既存のPrismaClientインスタンスがあればそれを再利用します。
// - なければ、新しいPrismaClientインスタンスを作成します。
// - このインスタンスは、他のファイルから `import { prisma } from "@/lib/prisma";` の形式でアクセスされます。
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // 開発中のデバッグに役立つように、Prisma クエリログを有効にすることもできます（オプション）
  // log: ['query', 'info', 'warn', 'error'],
});

// [開発環境でのグローバルキャッシュ]
// NODE_ENV が 'production' ではない場合（開発環境の場合）、
// 作成されたPrismaClientインスタンスをグローバルオブジェクトに保存します。
// これにより、ホットリロード時にも同じインスタンスが再利用され、
// "PrismaClient is already instantiated" のような警告を避けることができます。
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}