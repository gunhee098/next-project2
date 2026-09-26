// 📂 app/layout.tsx

import { Fraunces, Lora, Courier_Prime } from "next/font/google"; // ヴィンテージテーマ用フォント
import "./styles/globals.css"; // グローバルCSSをインポートします (app/styles/globals.css パス)。

// 必要に応じて、お客様のプロジェクトに実際に存在するコンポーネントに変更してください。
// このコードでは、ThemeProviderとLanguageProviderが存在すると仮定しています。
import { LanguageProvider } from "@/components/LanguageProvider"; // LanguageProviderをインポートします。
import { ThemeProvider } from "@/components/ThemeProvider";     // ThemeProviderをインポートします。

import { AuthProvider } from '@/hooks/useAuth'; // AuthProviderをインポートします。

// 見出し用: クセのあるセリフ体（図書館のアーカイブカードのような雰囲気）
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});
// 本文用: 落ち着いた可読性の高いセリフ体
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-body",
});
// メタ情報用（日付・タグ）: タイプライター調のモノスペース
const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

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
      {/* bodyタグにヴィンテージフォント3種のCSS変数を適用します。 */}
      <body className={`${fraunces.variable} ${lora.variable} ${courierPrime.variable} font-body`}>
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