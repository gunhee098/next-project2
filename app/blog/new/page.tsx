// 📂 app/blog/new/page.tsx
"use client"; // このファイルがクライアントサイドで実行されることを宣言

import { useState, useRef } from "react";
import { useRouter } from "next/navigation"; // ルーティング管理のためのuseRouterをインポート
import { useLang } from "@/components/LanguageProvider"; // LanguageProviderから言語コンテキストフックをインポート
import { useTheme } from "@/components/ThemeProvider"; // ThemeProviderからテーマコンテキストフックをインポート
import ThemeToggleButton from "@/components/ThemeToggleButton"; // テーマ切り替えボタンコンポーネントをインポート
import en from "@/locales/en.json"; // 英語の辞書ファイルをインポート
import ja from "@/locales/ja.json"; // 日本語の辞書ファイルをインポート

/**
 * 新規投稿ページコンポーネント
 * ユーザーが新しいブログ投稿を作成するためのインターフェースを提供します。
 * 画像アップロード機能と多言語対応、テーマ切り替えに対応します。
 */
export default function NewPostPage() {
  const router = useRouter(); // Next.jsのルーターフックを初期化
  const fileInputRef = useRef<HTMLInputElement>(null); // ファイル入力参照を追加

  // 投稿タイトルを管理するstate
  const [title, setTitle] = useState("");
  // 投稿内容を管理するstate
  const [content, setContent] = useState("");
  // 選択されたファイルと画像プレビュー用state
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // ローディング状態を管理するstate
  const [loading, setLoading] = useState(false);
  // エラーメッセージを管理するstate
  const [error, setError] = useState<string | null>(null);

  // 言語コンテキストから現在の言語 (lang) と設定関数 (setLang) を取得
  const { lang, setLang } = useLang();
  // 現在の言語に基づいて使用する辞書オブジェクトを選択
  const dict = lang === "ja" ? ja : en;

  // テーマコンテキストから現在のテーマ (theme) を取得
  const { theme } = useTheme();

  /**
   * ファイルが選択された時のハンドラー
   * 選択されたファイルをstateに保存し、画像プレビューを生成します。
   * @param {React.ChangeEvent<HTMLInputElement>} e - ファイル入力イベント
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  /**
   * 画像選択をキャンセルする関数 - 編集ページと同じロジックで修正
   * 選択されたファイルとプレビューをクリアします。
   */
  const handleImageCancel = () => {
    console.log("🗑️ 画像削除開始");
    
    // 全ての画像関連状態をリセット
    setFile(null);
    setImagePreview(null);
    
    // ファイル入力フィールドをリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    console.log("✅ 画像削除完了");
  };

  /**
   * 投稿作成処理を行うフォーム送信ハンドラー
   * 画像のアップロードと投稿データの送信を非同期で行います。
   * @param {React.FormEvent} e - フォーム送信イベント
   */
// 🚩 変更ポイント: token処理を削除
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("🔧 新規投稿作成リクエスト開始");

  setLoading(true);
  setError(null);

  let imageUrl: string | undefined;

  try {
    // (1) 画像アップロード
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "画像のアップロードに失敗しました。");
      }

      const uploadResult = await uploadRes.json();
      imageUrl = uploadResult.imageUrl;
    }

    // (2) 投稿データ送信
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // 認証は Cookie を通して自動的に送信される
      body: JSON.stringify({ title, content, image_url: imageUrl }),
      credentials: "include", 
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || dict.postFail);
    }

    alert(dict.postSuccess || "投稿が正常に作成されました！");

    setTitle("");
    setContent("");
    setFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    router.push("/blog");
    console.log("✅ 投稿作成完了 - ブログ一覧ページへリダイレクト");
  } catch (err) {
    console.error("🚨 投稿作成または画像アップロード中にエラー:", err);
    setError(err instanceof Error ? err.message : dict.postFail);
  } finally {
    setLoading(false);
  }
};
  return (
    // 最上位のコンテナ - グラデーション背景
    <div className={`min-h-screen transition-all duration-300 ${
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

      {/* メインコンテンツコンテナ */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-8 px-4">
        <div className={`p-8 rounded-2xl shadow-2xl w-full max-w-2xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-800/60 border border-gray-700/50'
            : 'bg-white/80 border border-gray-200/50'
        }`}>
          {/* ページタイトル (辞書から取得) */}
          <h1 className={`text-3xl font-bold mb-8 text-center bg-gradient-to-r ${
            theme === 'dark'
              ? 'from-blue-400 to-purple-400'
              : 'from-blue-600 to-purple-600'
          } bg-clip-text text-transparent`}>
            {dict.newPostTitle}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* タイトル入力フィールド */}
            <div>
              <label htmlFor="title" className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {dict.titlePlaceholder}
              </label>
              <input
                type="text"
                id="title"
                placeholder={dict.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                    : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } focus:outline-none disabled:opacity-50`}
                disabled={loading}
              />
            </div>

            {/* 内容入力テキストエリア */}
            <div>
              <label htmlFor="content" className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {dict.contentPlaceholder}
              </label>
              <textarea
                id="content"
                placeholder={dict.contentPlaceholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 resize-none ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                    : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } focus:outline-none disabled:opacity-50`}
                disabled={loading}
              />
            </div>

            {/* 画像アップロードフィールド */}
            <div>
              <label htmlFor="image" className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {lang === "ja" ? "画像 (オプション)" : "Image (Optional)"}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
                className={`w-full px-5 py-3 rounded-xl border transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700/50 border-gray-600 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 hover:file:bg-blue-700'
                    : 'bg-white/80 border-gray-300 text-gray-900 file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-lg file:px-4 file:py-2 file:mr-4 hover:file:bg-blue-100'
                } focus:outline-none disabled:opacity-50`}
                disabled={loading}
              />
              
              {/* 画像プレビュー */}
              {imagePreview && (
                <div className="mt-4">
                  <p className={`text-sm mb-2 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {lang === "ja" ? "画像プレビュー" : "Image Preview"}:
                  </p>
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt={lang === "ja" ? "画像プレビュー" : "Image Preview"} 
                      className="max-w-xs h-auto rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-600" 
                    />
                    {/* X削除ボタン */}
                    <button
                      type="button"
                      onClick={handleImageCancel}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200 shadow-lg"
                      title={lang === "ja" ? "画像削除" : "Remove Image"}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* エラーメッセージ表示 */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-100 border border-red-200 text-red-700 text-center">
                {error}
              </div>
            )}

            {/* 投稿作成ボタン */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (lang === "ja" ? "作成中..." : "Creating...") : dict.createPost}
            </button>

            {/* キャンセルボタン */}
            <button
              type="button"
              onClick={() => router.push("/blog")}
              className={`w-full px-6 py-3 font-semibold rounded-xl border-2 transition-all duration-200 ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100/50 hover:text-gray-900'
              }`}
            >
              {dict.cancel}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}