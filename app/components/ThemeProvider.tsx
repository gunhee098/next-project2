// 📂 components/ThemeProvider.tsx
"use client"; // クライアントコンポーネントであることを宣言

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * テーマコンテキストの型定義
 * @property theme 現在のテーマ ('light', 'dark', または undefined)
 * @property toggleTheme テーマを切り替える関数
 */
interface ThemeContextType {
  theme: 'light' | 'dark' | undefined;
  toggleTheme: () => void;
}

// テーマコンテキストを作成
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * テーマプロバイダーコンポーネント
 * アプリケーション全体にテーマ状態を提供し、HTMLのルート要素に`dark`クラスを適用/削除します。
 * @param { children: ReactNode } プロバイダーの子要素
 * @returns React.FC
 */
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // テーマの状態管理。初期値はundefinedで、クライアントサイドでのみ実際のテーマを決定します。
  const [theme, setTheme] = useState<'light' | 'dark' | undefined>(undefined);

  /**
   * コンポーネントマウント時にテーマを初期化する副作用フック。
   * ローカルストレージまたはシステム設定からテーマを取得します。
   */
  useEffect(() => {
    // windowオブジェクトが存在する場合（クライアントサイド）のみ実行
    if (typeof window !== 'undefined') {
      const savedTheme = sessionStorage.getItem('theme'); // ローカルストレージから保存されたテーマを取得
      // 保存されたテーマがない場合、または不正な値の場合、システムのカラーテーマ設定を優先
      const initialTheme: 'light' | 'dark' =
        savedTheme === 'light' || savedTheme === 'dark'
          ? savedTheme
          : window.matchMedia('(prefers-color-scheme: dark)').matches // システム設定がダークモードの場合
          ? 'dark'
          : 'light'; // それ以外はライトモード
      setTheme(initialTheme); // 実際のテーマ状態を設定
    }
  }, []); // コンポーネントがマウントされた時に一度だけ実行

  /**
   * テーマの状態が変更されるたびにHTMLルート要素に`dark`クラスを適用/削除する副作用フック。
   * ローカルストレージにもテーマを保存します。
   */
  useEffect(() => {
    // themeがundefinedでない場合（初期化が完了した場合）のみ実行
    if (theme !== undefined) {
      const root = window.document.documentElement; // HTMLのルート要素を取得
      if (theme === 'dark') {
        root.classList.add('dark'); // ダークモードの場合`dark`クラスを追加
      } else {
        root.classList.remove('dark'); // ライトモードの場合`dark`クラスを削除
      }
      sessionStorage.setItem('theme', theme); // 現在のテーマをローカルストレージに保存
    }
  }, [theme]); // themeの状態が変更されるたびに実行

  /**
   * テーマをライト/ダーク間で切り替える関数。
   */
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // themeがまだ決定されていない場合（初期レンダリング時）は、何もレンダリングしないか、ローディングUIを表示
  // これにより、サーバーとクライアントの初期HTMLの不一致（Hydration Mismatch）を防ぎます。
  if (theme === undefined) {
    return null; // または、<LoadingSpinner /> などのローディングコンポーネントを返すことも可能です。
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * `ThemeContext`を使用するためのカスタムフック。
 * `ThemeProvider`内で使用されていない場合はエラーをスローします。
 * @returns ThemeContextType
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeはThemeProvider内で使用してください。');
  }
  return context;
};