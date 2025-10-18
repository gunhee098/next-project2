// app/providers.tsx

"use client"; // このファイルがクライアントサイドで実行されることを宣言

import { LanguageProvider } from "@/components/LanguageProvider"; // LanguageProviderをインポート

// プロバイダーをまとめて提供するクライアントコンポーネント
// ここにLanguageProviderを含む他のクライアントサイドコンテキストを追加できます。
export default function Providers({ children }: { children: React.ReactNode }) {
  // LanguageProviderが子要素をラップし、言語コンテキストを提供します。
  return <LanguageProvider>{children}</LanguageProvider>;
}