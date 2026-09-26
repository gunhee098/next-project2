// 📂 app/page.tsx (既存のAPIと互換性のあるログインペー)
"use client"; // このファイルがクライアントコンポーネントであることを宣言します。

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageProvider"; // 言語プロバイダーをインポートします。
import { useAuth } from "@/hooks/useAuth"; // 認証フックをインポート

import { useTheme } from "@/components/ThemeProvider"; // テーマプロバイダーからuseThemeフックをインポートします。
import ThemeToggleButton from "@/components/ThemeToggleButton"; // テーマ切り替えボタンコンポーネントをインポートします。

import en from "@/locales/en.json"; // 英語ロケールデータ
import ja from "@/locales/ja.json"; // 日本語ロケールデータ

/**
 * ログインページコンポーネント
 * 🔒 既存の /api/auth エンドポイントと互換性を保つように修正されました。
 * ユーザーの認証処理と、言語・テーマ切り替え機能を提供します。
 * @returns React.FC
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // ローディング状態を追加
  const [error, setError] = useState(""); // エラー状態を追加
  const [loginAttempts, setLoginAttempts] = useState(0); // ログイン試行回数を追跡

  const { lang, setLang } = useLang(); // 言語状態と設定関数を取得します。
  const dict = lang === "ja" ? ja : en; // 現在の言語に応じた辞書データを設定します。
  const { login } = useAuth(); // 認証フックからログイン関数を取得

  const { theme } = useTheme(); // 現在のテーマ状態を取得します (light/dark/undefined)。

  // 最大ログイン試行回数の定数
  const MAX_LOGIN_ATTEMPTS = 5;

  /**
   * 入力値のバリデーション関数
   * @param email メールアドレス
   * @param password パスワード
   * @returns バリデーション結果
   */
  const validateInput = (email: string, password: string): { isValid: boolean; message: string } => {
    // メールアドレスの基本的な形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "有効なメールアドレスを入力してください。" };
    }

    // パスワードの最小長チェック（既存APIに合わせて8文字以上）
    if (password.length < 8) {
      return { isValid: false, message: "パスワードは8文字以上で入力してください。" };
    }

    return { isValid: true, message: "" };
  };

  /**
   * 🔒 既存の /api/auth エンドポイントに対応したログイン処理ハンドラー
   * CSRFトークンを使用せず、既存のAPI構造に従います
   * @param e フォームイベントオブジェクト
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // デフォルトのフォーム送信動作を防止します。
    
    // 試行回数制限チェック
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setError("ログイン試行回数の上限に達しました。しばらく待ってから再試行してください。");
      return;
    }

    setError(""); // 前回のエラーメッセージをクリア
    setIsLoading(true); // ローディング状態を有効化

    // 入力値のバリデーション
    const validation = validateInput(email, password);
    if (!validation.isValid) {
      setError(validation.message);
      setIsLoading(false);
      return;
    }

    try {
      // 🔒 既存のAPIエンドポイント /api/auth を使用（CSRFトークン不要）
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          type: "login", // 既存APIで必要なtypeパラメータ
          email: email.trim().toLowerCase(), // メールアドレスを正規化
          password: password 
        }),
        credentials: "include", // HttpOnlyクッキーなどの認証情報をリクエストに含めます。
      });

      const data = await res.json(); // サーバーからのJSONレスポンスを解析します。

      if (res.ok) {
        // 🔒 セキュリティ改善: サーバーがhttpOnlyクッキーでトークンを管理
        // フロントエンドでは直接トークンを扱いません
        
        // useAuthのlogin関数を使用してユーザー状態を更新
        login(data.user);
        
        // 成功時は試行回数をリセット
        setLoginAttempts(0);
        
        console.log("✅ ログインに成功しました");
      } else {
        // ログイン失敗時の処理
        setLoginAttempts(prev => prev + 1);
        
        // サーバーからのエラーメッセージを使用（既存APIの応答形式に対応）
        if (res.status === 401) {
          setError(data.error || "メールアドレスまたはパスワードが正しくありません。");
        } else if (res.status === 429) {
          setError(data.error || "ログイン試行回数が多すぎます。しばらく待ってから再試行してください。");
        } else if (res.status === 400) {
          setError(data.error || "入力内容に問題があります。");
        } else {
          setError(data.error || "ログインに失敗しました。再度お試しください。");
        }
        
        console.warn(`⚠️ ログイン失敗 (${res.status}):`, data.error);
      }
    } catch (error) {
      console.error("🚨 ログイン中にエラーが発生しました:", error);
      setError("ネットワークエラーが発生しました。インターネット接続を確認してください。");
      setLoginAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false); // ローディング状態を無効化
    }
  };
      
  /**
   * 入力フィールドの変更時にエラーメッセージをクリア
   */
  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) setError(""); // エラーがある場合はクリア
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
            disabled={isLoading} // ローディング中は無効化
            className={`px-4 py-2 font-mono text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
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
            disabled={isLoading} // ローディング中は無効化
            className={`px-4 py-2 font-mono text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
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

      {/* ログインフォームカード：図書館の索引カード風 */}
      <div className={`archive-card p-8 w-full max-w-md shadow-lg ${
        theme === 'dark' ? 'shadow-black/30' : 'shadow-ink/10'
      }`}>
        <h2 className="font-display text-3xl font-semibold mb-8 text-center">
          {dict.loginTitle}
        </h2>
        
        {/* エラーメッセージ表示 */}
        {error && (
          <div className="mb-6 p-4 rounded-sm border-l-4 border-stamp bg-stamp/10 text-stamp">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* ログイン試行回数の警告 */}
        {loginAttempts >= 3 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
          <div className="mb-6 p-4 rounded-sm border-l-4 border-archive bg-archive/10 text-archive dark:text-archive">
            <p className="text-sm font-medium font-mono">
              ログイン失敗が{loginAttempts}回続いています。残り{MAX_LOGIN_ATTEMPTS - loginAttempts}回です。
            </p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6" noValidate>
          <div>
            <input
              type="email"
              placeholder={dict.emailPlaceholder}
              value={email}
              onChange={handleInputChange(setEmail)}
              disabled={isLoading || loginAttempts >= MAX_LOGIN_ATTEMPTS} // ローディング중または試行回数超過時は無効化
              className={`w-full px-5 py-3 rounded-sm border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent focus:outline-none ${
                theme === 'dark'
                  ? 'border-ink-dark/30 text-ink-dark placeholder-ink-muted-dark focus:border-stamp'
                  : 'border-ink/30 text-ink placeholder-ink-muted focus:border-stamp'
              }`}
              required
              autoComplete="email" // オートコンプリート属性を追加
              maxLength={254} // メールアドレスの最大長を制限
            />
          </div>
          <div>
            <input
              type="password"
              placeholder={dict.passwordPlaceholder}
              value={password}
              onChange={handleInputChange(setPassword)}
              disabled={isLoading || loginAttempts >= MAX_LOGIN_ATTEMPTS} // ローディング중または試行回数超過時は無効化
              className={`w-full px-5 py-3 rounded-sm border transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent focus:outline-none ${
                theme === 'dark'
                  ? 'border-ink-dark/30 text-ink-dark placeholder-ink-muted-dark focus:border-stamp'
                  : 'border-ink/30 text-ink placeholder-ink-muted focus:border-stamp'
              }`}
              required
              autoComplete="current-password" // オートコンプリート속성を追가
              maxLength={128} // パスワードの최대長을制限
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || loginAttempts >= MAX_LOGIN_ATTEMPTS || !email.trim() || !password.trim()} // 조건에応じて無효化
            className={`w-full px-6 py-3 font-display font-semibold rounded-sm transition-colors duration-200 ${
              isLoading || loginAttempts >= MAX_LOGIN_ATTEMPTS || !email.trim() || !password.trim()
                ? 'bg-ink-muted/30 text-ink-muted cursor-not-allowed'
                : 'bg-stamp text-paper hover:bg-stamp/90'
            }`}
          >
            {isLoading ? "ログイン中..." : dict.loginButton}
          </button>
        </form>
        
        <p className={`text-center mt-6 text-sm ${
          theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
        }`}>
          {dict.noAccountPrompt}{" "}
          <Link
            href="/register" 
            className="font-bold hover:underline transition-colors duration-200 text-stamp hover:text-stamp/80"
          >
            {dict.registerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}