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
      // ヴィンテージ・アーカイブカードのカラーパレット
      colors: {
        paper: '#F2E8D5',        // メイン背景（褪せた洋紙）
        'paper-dark': '#1C1712', // ダークモード背景（夜間閲覧室）
        card: '#E8DCC0',         // カード背景（ライト）
        'card-dark': '#28211A',  // カード背景（ダーク）
        ink: '#3A2E22',          // メインテキスト（古いインク）
        'ink-dark': '#E8DCC0',   // メインテキスト（ダーク）
        'ink-muted': '#6B5D4F',  // サブテキスト
        'ink-muted-dark': '#A6997F',
        stamp: '#A6402E',        // アクセント（図書館の貸出印）
        archive: '#4A5D45',      // 補助アクセント（深緑）
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
    },
  },

  // 使用するTailwind CSSプラグインを定義します。
  plugins: [],
};