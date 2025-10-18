/** @type {import('tailwindcss').Config} */
export default {
  // ダークモード戦略を設定: HTMLのルート要素に'dark'クラスがトグルされるとダークモードを有効にします。
  darkMode: 'class',

  // Tailwind CSSが適用されるファイルを指定します。
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // "./styles/globals.css" // CSS変数を定義するだけの場合、通常ここに含める必要はありません。
  ],

  // Tailwindのデフォルトテーマを拡張します。
  theme: {
    extend: {
      // カスタムカラーを定義し、CSS変数とマッピングします。
      colors: {
        // CSS変数名と一致させるためにケバブケースを使用します。
        'primary-bg': 'var(--color-primary-bg)',    // メインの背景色
        'secondary-bg': 'var(--color-secondary-bg)', // カードやモーダルなどのサブ背景色
        'primary-text': 'var(--color-primary-text)', // メインのテキスト色
        'secondary-text': 'var(--color-secondary-text)', // サブのテキスト色 (例: 日付、著者名)
        'accent': 'var(--color-accent)',           // アクセント色 (リンク、ボタンなど)
      },
    },
  },

  // 使用するTailwind CSSプラグインを定義します。
  plugins: [],
};