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
    // 最上位のコンテナ。テーマ状態に応じて背景グラデーションとテキスト色を調整
    <div className={`flex items-center justify-center min-h-screen transition-all duration-300 ${
      theme === 'dark'
        ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* 言語切り替えとテーマトグルボタンのコンテナ */}
      <div className="absolute top-6 right-6 flex items-center space-x-4">
        {/* 言語選択ボタン */}
        <div className={`inline-flex rounded-xl overflow-hidden shadow-lg ${
          theme === 'dark'
            ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50'
            : 'bg-white/80 backdrop-blur-sm border border-gray-200/50'
        }`}>
          <button
            onClick={() => setLang("en")}
            className={`px-4 py-2 font-medium transition-all duration-200 ${
              lang === "en"
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                : theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("ja")}
            className={`px-4 py-2 font-medium transition-all duration-200 ${
              lang === "ja"
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                : theme === 'dark'
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            JP
          </button>
        </div>
        {/* ダークモード切り替えボタンコンポーネント */}
        <ThemeToggleButton />
      </div>

      {/* フォームカード */}
      <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-gray-800/60 border border-gray-700/50'
          : 'bg-white/80 border border-gray-200/50'
      }`}>
        <h2 className={`text-3xl font-bold mb-8 text-center bg-gradient-to-r ${
          theme === 'dark'
            ? 'from-blue-400 to-purple-400'
            : 'from-blue-600 to-purple-600'
        } bg-clip-text text-transparent`}>
          {dict.registerTitle}
        </h2>

        {/* メッセージ表示領域 (message stateに基づいて条件的に表示) */}
        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl text-center transition-all duration-200 ${
              message.type === "success" 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
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
              className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                  : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              } focus:outline-none`}
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder={dict.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                  : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              } focus:outline-none`}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder={dict.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                  : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              } focus:outline-none`}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {dict.registerButton}
          </button>
        </form>
        <p className={`text-center mt-6 text-sm ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {dict.alreadyAccountPrompt}{" "}
          <Link
            href="/"
            className={`font-bold hover:underline ${
              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            {dict.loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}