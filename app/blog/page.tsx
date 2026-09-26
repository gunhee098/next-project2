// 📂 app/blog/page.tsx
"use client";

// Next.jsのフックとコンポーネントをインポート
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// 認証・日時関連のライブラリと関数をインポート
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";

// ローカライゼーション(多言語化)関連のフックと辞書データをインポート
import { useLang } from "@/components/LanguageProvider";
import en from "@/locales/en.json";
import jaDict from "@/locales/ja.json";

// テーマ関連のフックとコンポーネントをインポート
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggleButton from "@/components/ThemeToggleButton";

// 🔒 新しい認証システムを使用
import { useAuth } from "@/hooks/useAuth";

// 投稿データの型定義
interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
  username: string;
  imageUrl?: string | null;
  _count: {
    comments: number;
    likes: number;
  };
}

/**
 * BlogPage コンポーネント
 * 投稿リストを表示し、認証、検索、ソート機能を提供します。
 * モバイル対応のレスポンシブデザインを実装
 */
export default function BlogPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [search, setSearch] = useState("");
  // モバイル用サイドバーの表示状態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🔒 新しい認証システム使用
  const { user, loading, logout } = useAuth();

  // 言語とテーマ設定のフックを使用
  const { lang, setLang } = useLang();
  const dict = lang === "ja" ? jaDict : en;
  const { theme } = useTheme();

  // 🔒 認証されていない場合 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && !user) {
      console.log("🔒 未認証のため、ログインページにリダイレクトします");
      router.push("/");
    }
  }, [user, loading, router]);

  // 投稿データを取得する関数
  const fetchPosts = useCallback(async (keyword = "", order = sortOrder) => {
    try {
      const queryParams = new URLSearchParams();
      if (keyword) {
        queryParams.append("search", encodeURIComponent(keyword));
      }
      if (order) {
        queryParams.append("orderBy", order);
      }

      const url = `/api/posts?${queryParams.toString()}`;

      // 🔒 httpOnlyクッキーを使用するため、credentials: 'include'を設定
      const res = await fetch(url, {
        cache: "no-store",
        credentials: 'include', // httpOnlyクッキーを送信
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // 認証エラー処理
      if (res.status === 401 || res.status === 403) {
        console.warn("🔒 認証エラー、ログインページにリダイレクトします");
        router.push("/");
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: '不明なエラー' }));
        throw new Error(errorData.error || "サーバーからの応答が正しくありません。");
      }

      const data: Post[] = await res.json();
      setPosts(data);
    } catch (error) {
      console.error("投稿の読み込みに失敗しました:", error);
    }
  }, [sortOrder, router]);

  // 投稿データを取得するエフェクト（認証完了後に実行）
  useEffect(() => {
    if (!loading && user) {
      console.log("✅ 認証済みユーザー、投稿データを取得します:", user);
      fetchPosts(search, sortOrder);
    }
  }, [user, loading, search, sortOrder, fetchPosts]);

  // 検索入力の変更を処理
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // 検索を実行
  const handleSearch = () => {
    fetchPosts(search, sortOrder);
  };

  // ソート順の変更を処理
  const handleSortChange = (newOrder: "latest" | "oldest") => {
    setSortOrder(newOrder);
  };

  // 全て表示を処理
  const handleShowAll = () => {
    setSearch("");
  };

  // 投稿を削除
  const handleDeletePost = async (id: string) => {
    if (!confirm(dict.confirmDelete)) return;

    try {
      // 🔒 httpOnlyクッキーを使用
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        credentials: 'include', // httpOnlyクッキーを送信
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/");
          return;
        }
        const errorData = await res.json().catch(() => ({ error: '不明なエラー' }));
        throw new Error(errorData.error || dict.deleteFail);
      }

      fetchPosts(search, sortOrder);
    } catch (error) {
      console.error("投稿の削除に失敗しました:", error);
    }
  };

  // 🔒 新しい認証システムのlogout関数を使用
  const handleLogout = () => {
    logout();
  };

  // 作成日時をフォーマット
  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.error("🚨 無効な日付が渡されました:", dateString);
      return "日付情報なし";
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 1000 * 60 * 60 * 24) {
      const locale = lang === 'ja' ? ja : undefined; 
    return formatDistanceToNow(date, { addSuffix: true, locale });
    }

    return format(date, "yyyy.MM.dd");
  };

  // いいねの切り替えを処理

  // モバイルメニューの切り替え
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 🔒 ローディング中は表示を待機
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">認証を確認中...</p>
        </div>
      </div>
    );
  }

  // 🔒 未認証の場合は何も表示しない（useEffectでリダイレクト処理済み）
  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' ? 'dark bg-paper-dark' : 'bg-paper'
    }`}>
      
      {/* モバイル用ハンバーガーボタン */}
      <button
        onClick={toggleMobileMenu}
        className={`md:hidden fixed top-4 left-4 z-50 p-3 rounded-sm border border-dashed transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-card-dark/90 text-ink-dark border-ink-dark/30'
            : 'bg-card/90 text-ink border-ink/30'
        } shadow-lg`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* モバイル用オーバーレイ */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

        {/* サイドバー - モバイル対応 */}
        <aside className={`fixed left-0 top-0 h-full transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-paper-dark border-r border-dashed border-ink-dark/20'
            : 'bg-paper border-r border-dashed border-ink/20'
        } ${
          // モバイルでは条件付き表示、デスクトップでは常時表示 + z-index修正
          isMobileMenuOpen 
            ? 'w-64 transform translate-x-0 z-50' 
            : 'w-64 transform -translate-x-full md:translate-x-0 z-30'
        }`}>
          <div className="p-4 md:p-6 h-full flex flex-col">
            
            {/* タイトル */}
            <div className="mb-6 md:mb-8 mt-12 md:mt-0">
              <h1 className="font-display text-xl md:text-2xl font-semibold">
                Blog Posts
              </h1>
            </div>

            {/* ユーザー情報 */}
            {user && (
              <div className="mb-4 md:mb-6 archive-card p-3 md:p-4">
                <p className={`font-mono text-xs md:text-sm ${
                  theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
                }`}>
                  {dict.welcome}
                </p>
                <p className="font-display text-base md:text-lg font-semibold">
                  {user.name}さん！
                </p>
              </div>
            )}

            {/* ログアウトボタン - タッチ問題解決 */}
            <button
              onClick={handleLogout}
              className="relative w-full px-3 md:px-4 py-2 md:py-3 rounded-sm border border-stamp text-stamp text-sm md:text-base font-medium hover:bg-stamp hover:text-paper transition-colors duration-200 touch-manipulation z-10"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
            >
              {dict.logout}
            </button>
          </div>
        </aside>      
        
        {/* メインコンテンツ領域 - モバイル対応 */}
      <div className="md:ml-64 min-h-screen">
        
        {/* ヘッダー: 言語選択とテーマトグル - モバイル対応 */}
        <header className="sticky top-0 z-20 p-4 md:p-6">
          <div className="flex justify-end items-center space-x-2 md:space-x-4">
            
            {/* 言語切り替えボタン */}
            <div className={`inline-flex rounded-sm overflow-hidden border border-dashed ${
              theme === 'dark' ? 'border-ink-dark/30 bg-card-dark/60' : 'border-ink/30 bg-card/60'
            }`}>
              <button
                onClick={() => setLang("en")}
                className={`px-2 md:px-4 py-1 md:py-2 text-sm md:text-base font-mono transition-colors duration-200 ${
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
                className={`px-2 md:px-4 py-1 md:py-2 text-sm md:text-base font-mono transition-colors duration-200 ${
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

            <ThemeToggleButton />
          </div>
        </header>

        {/* メインコンテンツ - モバイル対応 */}
        <main className="px-4 md:px-8 pb-8">
          
          {/* 新規投稿ボタン */}
          <div className="mb-6 md:mb-8 text-center">
            <button
              onClick={() => router.push("/blog/new")}
              className="inline-flex items-center px-4 md:px-8 py-3 md:py-4 bg-stamp text-paper text-sm md:text-base font-display font-semibold rounded-sm hover:bg-stamp/90 transition-colors duration-200 shadow-lg"
            >
              <svg className="w-4 md:w-5 h-4 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {dict.create}
            </button>
          </div>

          {/* 検索・フィルター部分（モバイル対応） */}
          <div className="mb-6 md:mb-8 archive-card p-4 md:p-6">
            
            {/* 検索フィールド */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center justify-center mb-4">
              <div className="flex-1 max-w-md relative">
                <input
                  type="text"
                  placeholder={dict.searchPlaceholder}
                  className={`w-full px-3 md:px-4 py-2 md:py-3 pl-10 md:pl-12 text-sm md:text-base rounded-sm border transition-colors duration-200 bg-transparent focus:outline-none ${
                    theme === 'dark'
                      ? 'border-ink-dark/30 text-ink-dark placeholder-ink-muted-dark focus:border-stamp'
                      : 'border-ink/30 text-ink placeholder-ink-muted focus:border-stamp'
                  }`}
                  value={search}
                  onChange={handleSearchChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <svg className={`absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 ${
                  theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <button
                onClick={handleSearch}
                className="px-4 md:px-6 py-2 md:py-3 bg-archive text-paper text-sm md:text-base font-medium rounded-sm hover:bg-archive/90 transition-colors duration-200 shadow-lg"
              >
                {dict.search}
              </button>
            </div>

            {/* フィルターボタン */}
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
              {search && (
                <button
                  onClick={handleShowAll}
                  className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-sm font-medium border transition-colors duration-200 ${
                    theme === 'dark'
                      ? 'border-ink-dark/30 text-ink-muted-dark hover:bg-card-dark hover:text-ink-dark'
                      : 'border-ink/30 text-ink-muted hover:bg-card hover:text-ink'
                  }`}
                >
                  {dict.showAll}
                </button>
              )}
              
              <button
                onClick={() => handleSortChange("latest")}
                className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-sm font-medium border transition-colors duration-200 ${
                  sortOrder === "latest"
                    ? 'bg-stamp text-paper border-stamp'
                    : theme === 'dark'
                      ? 'border-ink-dark/30 text-ink-muted-dark hover:bg-card-dark'
                      : 'border-ink/30 text-ink-muted hover:bg-card'
                }`}
              >
                {dict.latest}
              </button>
              
              <button
                onClick={() => handleSortChange("oldest")}
                className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-sm font-medium border transition-colors duration-200 ${
                  sortOrder === "oldest"
                    ? 'bg-stamp text-paper border-stamp'
                    : theme === 'dark'
                      ? 'border-ink-dark/30 text-ink-muted-dark hover:bg-card-dark'
                      : 'border-ink/30 text-ink-muted hover:bg-card'
                }`}
              >
                {dict.oldest}
              </button>
            </div>
          </div>

          {/* 投稿リスト（モバイル対応） */}
          <div className="grid gap-4 md:gap-6">
            {posts.length === 0 ? (
              <div className={`text-center py-8 md:py-12 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <svg className="mx-auto w-12 md:w-16 h-12 md:h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-base md:text-lg font-medium mb-2">{dict.noPosts}</p>
                <p className="text-xs md:text-sm opacity-75">{dict.createFirst}</p>
              </div>
            ) : (
              posts.map((post) => (
                <article
                  key={post.id}
                  className="archive-card group relative overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
                >
                  {/* 投稿画像 */}
                  {post.imageUrl && (
                    <div className="relative h-36 md:h-48 overflow-hidden border-b border-dashed border-ink/20 dark:border-ink-dark/20">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover grayscale-[15%] transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* 投稿内容 */}
                  <div className="p-4 md:p-6">
                    
                    {/* ヘッダー部分 */}
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex-1 min-w-0">
                        {/* タイトル */}
                        <h2 className="font-display text-lg md:text-xl font-semibold mb-2 line-clamp-2">
                          <Link 
                            href={`/blog/${post.id}`}
                            className="hover:text-stamp transition-colors duration-200"
                          >
                            {post.title}
                          </Link>
                        </h2>
                        
                        {/* ユーザー情報：スタンプ風の日付ラベル */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center border border-ink/30 dark:border-ink-dark/30">
                            <span className="font-mono text-xs md:text-sm font-bold">
                              {post.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs md:text-sm font-medium truncate ${
                              theme === 'dark' ? 'text-ink-dark' : 'text-ink'
                            }`}>
                              {post.username}
                            </p>
                            <p className={`font-mono text-xs ${
                              theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'
                            }`}>
                              {formatCreatedAt(post.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 編集・削除ボタン */}
                      {user && user.id === post.userId && (
                        <div className="flex space-x-1 md:space-x-2 ml-2 md:ml-4 flex-shrink-0">
                          <button
                            onClick={() => router.push(`/blog/${post.id}/edit`)}
                            className={`p-1.5 md:p-2 rounded-sm transition-colors duration-200 ${
                              theme === 'dark'
                                ? 'text-ink-muted-dark hover:text-archive hover:bg-card-dark'
                                : 'text-ink-muted hover:text-archive hover:bg-card'
                            }`}
                            title={dict.edit}
                          >
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className={`p-1.5 md:p-2 rounded-sm transition-colors duration-200 ${
                              theme === 'dark'
                                ? 'text-ink-muted-dark hover:text-stamp hover:bg-card-dark'
                                : 'text-ink-muted hover:text-stamp hover:bg-card'
                            }`}
                            title={dict.delete}
                          >
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 投稿内容プレビュー */}
                    <div className={theme === 'dark' ? 'text-ink-muted-dark' : 'text-ink-muted'}>
                      <p className="line-clamp-3 text-xs md:text-sm leading-relaxed">
                        {post.content.length > 100 
                          ? `${post.content.substring(0, 100)}...`
                          : post.content
                        }
                      </p>
                    </div>

                    {/* フッター：いいね・コメント数・詳細リンク */}
                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-dashed border-ink/20 dark:border-ink-dark/20 mt-3 md:mt-4">
                      
                      {/* いいね・コメント数：貸出印風バッジ */}
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 md:w-4 h-3 md:h-4 text-stamp" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="font-mono text-xs md:text-sm font-medium">
                            {post._count.likes}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 md:w-4 h-3 md:h-4 text-archive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="font-mono text-xs md:text-sm font-medium">
                            {post._count.comments}
                          </span>
                        </div>
                      </div>

                      {/*  詳細リンク */}
                      <Link
                        href={`/blog/${post.id}`}
                        className="inline-flex items-center space-x-1 text-xs md:text-sm font-medium text-stamp hover:text-stamp/80 transition-colors duration-200"
                      >
                        <span>{dict.readMore}</span>
                        <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}