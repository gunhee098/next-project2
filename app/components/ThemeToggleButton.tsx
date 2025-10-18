// 📂 components/ThemeToggleButton.tsx
"use client"; // クライアントコンポーネントであることを宣言

import { useTheme } from "./ThemeProvider"; // useThemeフックをインポート

/**
 * テーマ切り替えボタンコンポーネント
 * 現在のテーマ（ライト/ダーク）に応じてアイコンを表示し、クリックするとテーマを切り替えます。
 * @returns React.FC
 */
export default function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme(); // テーマの状態と切り替え関数を取得

  return (
    <button
      onClick={toggleTheme} // ボタンクリック時にテーマを切り替える
      // 現在のテーマに応じてボタンの背景色とアイコン色を動的に変更
      className="p-2 rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 transition-colors duration-200 flex items-center justify-center"
      aria-label="テーマを切り替える" // アクセシビリティのためのラベル
    >
      {theme === 'dark' ? (
        // 現在がダークモードの場合、ライトモードへの切り替えアイコン（太陽）を表示
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.325 5.825l-.707.707M6.775 6.775l-.707-.707M18.325 6.775l.707-.707M6.775 18.325l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        // 現在がライトモードの場合、ダークモードへの切り替えアイコン（月）を表示
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}