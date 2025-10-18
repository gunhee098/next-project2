// 📂 app/layout.tsx

import { Inter } from "next/font/google"; // Google FontsのInterをインポートします。
import "./styles/globals.css"; // グローバルCSSをインポートします (app/styles/globals.css パス)。

// 必要に応じて、お客様のプロジェクトに実際に存在するコンポーネントに変更してください。
// このコードでは、ThemeProviderとLanguageProviderが存在すると仮定しています。
import { LanguageProvider } from "@/components/LanguageProvider"; // LanguageProviderをインポートします。
import { ThemeProvider } from "@/components/ThemeProvider";     // ThemeProviderをインポートします。

import { AuthProvider } from '@/hooks/useAuth'; // AuthProviderをインポートします。

const inter = Inter({ subsets: ["latin"] }); // Interフォントのサブセットを設定します。

/**
 * メタデータ定義
 * Next.jsのドキュメントヘッド情報（タイトル、ディスクリプションなど）を設定します。
 */
export const metadata = {
  title: "My Blog App", // ページのタイトル
  description: "A simple blog application built with Next.js", // ページの説明
};

/**
 * ルートレイアウトコンポーネント
 * アプリケーションの全てのページをラップし、共通の構造とプロバイダーを提供します。
 * @param { children: React.ReactNode } { children } - 子要素 (ページコンポーネントなど)
 * @returns {React.FC}
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // HTMLのルート要素。言語を日本語に設定します。
    <html lang="ja">
      {/* bodyタグにInterフォントのクラスを適用します。 */}
      <body className={inter.className}>
        {/* テーマプロバイダーでアプリケーション全体をラップします。 */}
        <ThemeProvider>
          {/* 言語プロバイダーでアプリケーション全体をラップします。 */}
          <LanguageProvider>
            {/* AuthProvider で children を囲みます。これにより、認証コンテキストがアプリケーション全体で利用可能になります。 */}
            <AuthProvider>
              {children} {/* 各ページコンポーネントがここにレンダリングされます */}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}