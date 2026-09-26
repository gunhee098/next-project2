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
    // 最上位のコンテナ - ヴィンテージ・アーカイブテーマ背景
    <div className={`min-h-screen transition-colors duration-300 ${
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

      {/* メインコンテンツコンテナ */}
      <div className="flex items-center justify-center min-h-screen pt-20 pb-8 px-4">
        <div className={`archive-card p-8 w-full max-w-2xl shadow-lg ${
          theme === 'dark' ? 'shadow-black/30' : 'shadow-ink/10'
        }`}>
          {/* ページタイトル (辞書から取得) */}
          <h1 className="font-display text-3xl font-semibold mb-8 text-center">
            {dict.newPostTitle}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* タイトル入力フィールド */}
            <div>
              <label htmlFor="title" className={`block font-mono text-sm mb-2 ${
                theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
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
                className={`w-full px-5 py-3 rounded-sm border transition-colors duration-200 bg-transparent focus:outline-none disabled:opacity-50 ${
                  theme === 'dark'
                    ? 'border-ink-dark/30 text-ink-dark placeholder-ink-muted-dark focus:border-stamp'
                    : 'border-ink/30 text-ink placeholder-ink-muted focus:border-stamp'
                }`}
                disabled={loading}
              />
            </div>

            {/* 内容入力テキストエリア */}
            <div>
              <label htmlFor="content" className={`block font-mono text-sm mb-2 ${
                theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
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
                className={`w-full px-5 py-3 rounded-sm border transition-colors duration-200 resize-none bg-transparent focus:outline-none disabled:opacity-50 ${
                  theme === 'dark'
                    ? 'border-ink-dark/30 text-ink-dark placeholder-ink-muted-dark focus:border-stamp'
                    : 'border-ink/30 text-ink placeholder-ink-muted focus:border-stamp'
                }`}
                disabled={loading}
              />
            </div>

            {/* 画像アップロードフィールド */}
            <div>
              <label htmlFor="image" className={`block font-mono text-sm mb-2 ${
                theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
              }`}>
                {lang === "ja" ? "画像 (オプション)" : "Image (Optional)"}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="image"
                accept="image/*"
                onChange={handleFileChange}
                className={`w-full px-5 py-3 rounded-sm border transition-colors duration-200 bg-transparent focus:outline-none disabled:opacity-50 ${
                  theme === 'dark'
                    ? 'border-ink-dark/30 text-ink-dark file:bg-stamp file:text-paper file:border-0 file:rounded-sm file:px-4 file:py-2 file:mr-4 hover:file:bg-stamp/90'
                    : 'border-ink/30 text-ink file:bg-stamp file:text-paper file:border-0 file:rounded-sm file:px-4 file:py-2 file:mr-4 hover:file:bg-stamp/90'
                }`}
                disabled={loading}
              />
              
              {/* 画像プレビュー */}
              {imagePreview && (
                <div className="mt-4">
                  <p className={`font-mono text-sm mb-2 ${
                    theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
                  }`}>
                    {lang === "ja" ? "画像プレビュー" : "Image Preview"}:
                  </p>
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt={lang === "ja" ? "画像プレビュー" : "Image Preview"} 
                      className="max-w-xs h-auto rounded-sm shadow-lg border border-dashed border-ink/30 dark:border-ink-dark/30" 
                    />
                    {/* X削除ボタン */}
                    <button
                      type="button"
                      onClick={handleImageCancel}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-stamp hover:bg-stamp/90 text-paper rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-200 shadow-lg"
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
              <div className="px-4 py-3 rounded-sm border-l-4 border-stamp bg-stamp/10 text-stamp text-center">
                {error}
              </div>
            )}

            {/* 投稿作成ボタン */}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-stamp text-paper font-display font-semibold rounded-sm hover:bg-stamp/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (lang === "ja" ? "作成中..." : "Creating...") : dict.createPost}
            </button>

            {/* キャンセルボタン */}
            <button
              type="button"
              onClick={() => router.push("/blog")}
              className={`w-full px-6 py-3 font-display font-semibold rounded-sm border transition-colors duration-200 ${
                theme === 'dark'
                  ? 'border-ink-dark/30 text-ink-muted-dark hover:bg-card-dark hover:text-ink-dark'
                  : 'border-ink/30 text-ink-muted hover:bg-card hover:text-ink'
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