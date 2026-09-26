// 📂 app/register/page.tsx
"use client"; // このファイルがクライアントサイドで実行されることを宣言します。

import { useState } from "react";
import { useRouter } from "next/navigation"; // ルーティング管理のためのuseRouterをインポートします。
import Link from "next/link"; // Next.jsのLinkコンポーネントをインポートします。
import { useLang } from "@/components/LanguageProvider"; // LanguageProviderから言語コンテキストフックをインポートします。
import en from "@/locales/en.json"; // 英語の辞書ファイルをインポートします。
import ja from "@/locales/ja.json"; // 日本語の辞書ファイルをインポートします。

import { useTheme } from "@/components/ThemeProvider"; // useTheme フックをインポートします。
import ThemeToggleButton from "@/components/ThemeToggleButton"; // テーマ切り替えボタンコンポーネントをインポートします。

/**
 * ユーザー登録ページコンポーネント
 * ユーザーが新しいアカウントを登録するためのフォームを提供します。
 */
export default function RegisterPage() {
  // 名前を管理するstate
  const [name, setName] = useState("");
  // メールアドレスを管理するstate
  const [email, setEmail] = useState("");
  // パスワードを管理するstate
  const [password, setPassword] = useState("");
  // ユーザーへのメッセージ（成功/エラー）とそのタイプを管理するstate
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter(); // Next.jsのルーターフックを初期化します。

  // 言語コンテキストから現在の言語 (lang) と設定関数 (setLang) を取得します。
  const { lang, setLang } = useLang();
  // 現在の言語に基づいて使用する辞書オブジェクトを選択します。
  const dict = lang === "ja" ? ja : en;

  const { theme } = useTheme(); // useTheme フックで現在のテーマ状態を取得します。

  /**
   * ユーザー登録処理を行う非同期ハンドラー関数。
   * フォーム送信時に呼び出されます。
   * @param {React.FormEvent} e - フォームイベントオブジェクト
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // デフォルトのフォーム送信動作を防止します。
    setMessage(null); // 新しい登録試行時に既存のメッセージをクリアします。

    try {
      // APIエンドポイントにユーザー登録リクエストを送信します。
      const res = await fetch("/api/auth/", {
        method: "POST", // HTTPメソッドはPOST
        headers: { "Content-Type": "application/json" }, // リクエストボディの形式はJSON
        body: JSON.stringify({ type: "register", name, email, password }), // 登録タイプ、名前、メール、パスワードをJSON形式で送信
      });

      // サーバーからの応答をJSON形式で解析します。
      const data = await res.json();

      // レスポンスが成功ステータス (res.ok) の場合
      if (res.ok) {
        // 成功メッセージを表示 (辞書から取得)
        setMessage({ text: dict.registerSuccess, type: "success" });
        // UX向上のため、メッセージ表示後に2秒待ってからログインページへリダイレクトします。
        setTimeout(() => router.push("/"), 2000);
      } else {
        // レスポンスがエラーの場合、サーバーからのエラーメッセージまたはデフォルトの登録失敗メッセージを表示します。
        setMessage({ text: data.error || dict.registerFail, type: "error" });
      }
    } catch (error) {
      // ネットワークエラーなど、リクエスト自体が失敗した場合
      console.error("ユーザー登録中にサーバーエラーが発生しました:", error);
      setMessage({ text: dict.serverError, type: "error" }); // サーバーエラーメッセージを表示します。
    }
  };

  return (
    // 最上位のコンテナ。ヴィンテージ・アーカイブテーマの背景色を適用
    <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'dark bg-paper-dark' : 'bg-paper'
    }`}>
      {/* 言語切り替えとテーマトグルボタンのコンテナ */}
      <div className="absolute top-6 right-6 flex items-center space-x-4">
        {/* 言語選択ボタン */}
        <div className={`inline-flex rounded-sm overflow-hidden border border-dashed ${
          theme === 'dark' ? 'border-ink-dark/30 bg-card-dark/60' : 'border-ink/30 bg-card/60'
        }`}>
          <button
            onClick={() => setLang("en")}
            className={`px-4 py-2 font-mono text-sm transition-colors duration-200 ${
              lang === "en"
                ? 'bg-stamp text-paper'
                : theme === 'dark'
                  ? 'text-ink-muted-dark hover:text-ink-dark hover:bg-card-dark'
                  : 'text-ink-muted hover:text-ink hover:bg-card'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("ja")}
            className={`px-4 py-2 font-mono text-sm transition-colors duration-200 ${
              lang === "ja"
                ? 'bg-stamp text-paper'
                : theme === 'dark'
                  ? 'text-ink-muted-dark hover:text-ink-dark hover:bg-card-dark'
                  : 'text-ink-muted hover:text-ink hover:bg-card'
            }`}
          >
            JP
          </button>
        </div>
        {/* ダークモード切り替えボタンコンポーネント */}
        <ThemeToggleButton />
      </div>

      {/* フォームカード：図書館の索引カード風 */}
      <div className={`archive-card p-8 w-full max-w-md shadow-lg ${
        theme === 'dark' ? 'shadow-black/30' : 'shadow-ink/10'
      }`}>
        <h2 className="font-display text-3xl font-semibold mb-8 text-center">
          {dict.registerTitle}
        </h2>

        {/* メッセージ表示領域 (message stateに基づいて条件的に表示) */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-sm text-center border-l-4 transition-colors duration-200 ${
              message.type === "success"
                ? 'border-archive bg-archive/10 text-archive'
                : 'border-stamp bg-stamp/10 text-stamp'
            }`}
            role="alert" // スクリーンリーダーのためのロール
          >
            {message.text} {/* 表示するメッセージテキスト */}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder={dict.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-5 py-3 rounded-sm border transition-colors duration-200 bg-transparent focus:outline-none ${
                theme === 'dark'
                  ? 'border-ink-dark/30 text-ink-dark placeholder-ink-muted-dark focus:border-stamp'
                  : 'border-ink/30 text-ink placeholder-ink-muted focus:border-stamp'
              }`}
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder={dict.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-3 rounded-sm border transition-colors duration-200 bg-transparent focus:outline-none ${
                theme === 'dark'
                  ? 'border-ink-dark/30 text-ink-dark placeholder-ink-muted-dark focus:border-stamp'
                  : 'border-ink/30 text-ink placeholder-ink-muted focus:border-stamp'
              }`}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder={dict.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-3 rounded-sm border transition-colors duration-200 bg-transparent focus:outline-none ${
                theme === 'dark'
                  ? 'border-ink-dark/30 text-ink-dark placeholder-ink-muted-dark focus:border-stamp'
                  : 'border-ink/30 text-ink placeholder-ink-muted focus:border-stamp'
              }`}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-stamp text-paper font-display font-semibold rounded-sm hover:bg-stamp/90 transition-colors duration-200"
          >
            {dict.registerButton}
          </button>
        </form>
        <p className={`text-center mt-6 text-sm ${
          theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
        }`}>
          {dict.alreadyAccountPrompt}{" "}
          <Link
            href="/"
            className="font-bold hover:underline transition-colors duration-200 text-stamp hover:text-stamp/80"
          >
            {dict.loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}