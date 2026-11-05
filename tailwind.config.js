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
        paper: '#F5F6F2',        // soft editorial canvas
        'paper-dark': '#111815',
        card: '#FFFFFF',
        'card-dark': '#1B2420',
        ink: '#202B26',
        'ink-dark': '#E8EEE9',
        'ink-muted': '#68756E',
        'ink-muted-dark': '#A6B2AA',
        stamp: '#347663',        // restrained botanical green
        archive: '#A8794D',      // warm editorial accent
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: '0.75rem',
      },
    },
  },

  // 使用するTailwind CSSプラグインを定義します。
  plugins: [],
};
