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
  const { theme, toggleTheme } = useTheme();

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
  const handleLikeToggle = async (postId: string) => {
    if (!user) {
      alert("ログインが必要です。");
      router.push('/');
      return;
    }

    try {
      // 🔒 httpOnlyクッキーを使用
      const res = await fetch('/api/likes', {
        method: 'POST',
        credentials: 'include', // httpOnlyクッキーを送信
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId }),
      });

      if (res.status === 401 || res.status === 403) {
        alert("セッションが期限切れか、権限がありません。再度ログインしてください。");
        router.push('/');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: '不明なエラー' }));
        if (res.status === 409) {
          console.warn("既に「いいね」済みか、同時「いいね」試行です。");
        }
        throw new Error(errorData.error || `サーバーエラーが発生しました: ${res.status} ${res.statusText}`);
      }

      const { message, isLiked } = await res.json();

      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              _count: {
                ...post._count,
                likes: isLiked ? post._count.likes + 1 : post._count.likes - 1,
              },
            };
          }
          return post;
        })
      );
    } catch (e: any) {
      alert(`「いいね」処理に失敗しました: ${e.message}`);
      console.error("「いいね」の切り替えに失敗しました:", e);
      fetchPosts(search, sortOrder);
    }
  };

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
    <div className={`min-h-screen transition-all duration-300 ${
      theme === 'dark' 
        ? 'dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      
      {/* モバイル用ハンバーガーボタン */}
      <button
        onClick={toggleMobileMenu}
        className={`md:hidden fixed top-4 left-4 z-50 p-3 rounded-xl transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-800/90 text-white border border-gray-700/50'
            : 'bg-white/90 text-gray-900 border border-gray-200/50'
        } backdrop-blur-sm shadow-lg`}
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
        <aside className={`fixed left-0 top-0 h-full transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50'
            : 'bg-white/95 backdrop-blur-xl border-r border-gray-200/50'
        } ${
          // モバイルでは条件付き表示、デスクトップでは常時表示 + z-index修正
          isMobileMenuOpen 
            ? 'w-64 transform translate-x-0 z-50' 
            : 'w-64 transform -translate-x-full md:translate-x-0 z-30'
        }`}>
          <div className="p-4 md:p-6 h-full flex flex-col">
            
            {/* タイトル */}
            <div className="mb-6 md:mb-8 mt-12 md:mt-0">
              <h1 className={`text-xl md:text-2xl font-bold bg-gradient-to-r ${
                theme === 'dark'
                  ? 'from-blue-400 to-purple-400'
                  : 'from-blue-600 to-purple-600'
              } bg-clip-text text-transparent`}>
                Blog Posts
              </h1>
            </div>

            {/* ユーザー情報 */}
            {user && (
              <div className={`mb-4 md:mb-6 p-3 md:p-4 rounded-2xl ${
                theme === 'dark'
                  ? 'bg-gray-800/50 border border-gray-700/30'
                  : 'bg-white/60 border border-gray-200/30'
              }`}>
                <p className={`text-xs md:text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {dict.welcome}
                </p>
                <p className={`text-base md:text-lg font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.name}さん！
                </p>
              </div>
            )}

            {/* ログアウトボタン - タッチ問題解決 */}
            <button
              onClick={handleLogout}
              className="relative w-full px-3 md:px-4 py-2 md:py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm md:text-base font-medium hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl touch-manipulation z-10"
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
            <div className={`inline-flex rounded-xl overflow-hidden shadow-lg ${
              theme === 'dark'
                ? 'bg-gray-800/80 backdrop-blur-sm border border-gray-700/50'
                : 'bg-white/80 backdrop-blur-sm border border-gray-200/50'
            }`}>
              <button
                onClick={() => setLang("en")}
                className={`px-2 md:px-4 py-1 md:py-2 text-sm md:text-base font-medium transition-all duration-200 ${
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
                className={`px-2 md:px-4 py-1 md:py-2 text-sm md:text-base font-medium transition-all duration-200 ${
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

            <ThemeToggleButton />
          </div>
        </header>

        {/* メインコンテンツ - モバイル対応 */}
        <main className="px-4 md:px-8 pb-8">
          
          {/* 새로운 투고 버튼 */}
          <div className="mb-6 md:mb-8 text-center">
            <button
              onClick={() => router.push("/blog/new")}
              className="inline-flex items-center px-4 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm md:text-base font-semibold rounded-2xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              <svg className="w-4 md:w-5 h-4 md:h-5 mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {dict.create}
            </button>
          </div>

          {/* 검색・필터 부분 - 모바일 대응 */}
          <div className={`mb-6 md:mb-8 p-4 md:p-6 rounded-2xl ${
            theme === 'dark'
              ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/50'
              : 'bg-white/70 backdrop-blur-sm border border-gray-200/50'
          } shadow-xl`}>
            
            {/* 검색 필드 */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-stretch sm:items-center justify-center mb-4">
              <div className="flex-1 max-w-md relative">
                <input
                  type="text"
                  placeholder={dict.searchPlaceholder}
                  className={`w-full px-3 md:px-4 py-2 md:py-3 pl-10 md:pl-12 text-sm md:text-base rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                      : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } focus:outline-none`}
                  value={search}
                  onChange={handleSearchChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <svg className={`absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <button
                onClick={handleSearch}
                className="px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm md:text-base font-medium rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {dict.search}
              </button>
            </div>

            {/* 필터 버튼 */}
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
              {search && (
                <button
                  onClick={handleShowAll}
                  className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-xl font-medium transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-900'
                  }`}
                >
                  {dict.showAll}
                </button>
              )}
              
              <button
                onClick={() => handleSortChange("latest")}
                className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-xl font-medium transition-all duration-200 ${
                  sortOrder === "latest"
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {dict.latest}
              </button>
              
              <button
                onClick={() => handleSortChange("oldest")}
                className={`px-3 md:px-4 py-2 text-sm md:text-base rounded-xl font-medium transition-all duration-200 ${
                  sortOrder === "oldest"
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {dict.oldest}
              </button>
            </div>
          </div>

          {/* 투고 리스트 - 모바일 대응 */}
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
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:transform hover:scale-[1.01] md:hover:scale-[1.02] ${
                    theme === 'dark'
                      ? 'bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:border-gray-600/50'
                      : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white/90 hover:border-gray-300/50'
                  } shadow-lg hover:shadow-2xl`}
                >
                  {/* 투고 이미지 */}
                  {post.imageUrl && (
                    <div className="relative h-36 md:h-48 overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}

                  {/* 투고 내용 */}
                  <div className="p-4 md:p-6">
                    
                    {/* 헤더 부분 */}
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex-1 min-w-0">
                        {/* 제목 */}
                        <h2 className={`text-lg md:text-xl font-bold mb-2 line-clamp-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          <Link 
                            href={`/blog/${post.id}`}
                            className="hover:text-blue-500 transition-colors duration-200"
                          >
                            {post.title}
                          </Link>
                        </h2>
                        
                        {/* 사용자 정보 */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className={`w-6 md:w-8 h-6 md:h-8 rounded-full flex items-center justify-center ${
                            theme === 'dark'
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                              : 'bg-gradient-to-r from-blue-400 to-purple-400'
                          }`}>
                            <span className="text-white text-xs md:text-sm font-semibold">
                              {post.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs md:text-sm font-medium truncate ${
                              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                            }`}>
                              {post.username}
                            </p>
                            <p className={`text-xs ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {formatCreatedAt(post.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 편집・삭제 버튼 */}
                      {user && user.id === post.userId && (
                        <div className="flex space-x-1 md:space-x-2 ml-2 md:ml-4 flex-shrink-0">
                          <button
                            onClick={() => router.push(`/blog/${post.id}/edit`)}
                            className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 ${
                              theme === 'dark'
                                ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700/50'
                                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={dict.edit}
                          >
                            <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 ${
                              theme === 'dark'
                                ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700/50'
                                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
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

                    {/* 투고 내용 미리보기 */}
                    <div className={`mb-3 md:mb-4 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <p className="line-clamp-3 text-xs md:text-sm leading-relaxed">
                        {post.content.length > 100 
                          ? `${post.content.substring(0, 100)}...`
                          : post.content
                        }
                      </p>
                    </div>

                    {/* 푸터：좋아요・댓글 수・상세 링크 */}
                    <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-200/20">
                      
                      {/* 좋아요・댓글 수 */}
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="flex items-center space-x-1">
                          <svg className={`w-3 md:w-4 h-3 md:h-4 ${
                            theme === 'dark' ? 'text-red-400' : 'text-red-500'
                          }`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className={`text-xs md:text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {post._count.likes}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <svg className={`w-3 md:w-4 h-3 md:h-4 ${
                            theme === 'dark' ? 'text-blue-400' : 'text-blue-500'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className={`text-xs md:text-sm font-medium ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {post._count.comments}
                          </span>
                        </div>
                      </div>

                      {/* 상세 링크 */}
                      <Link
                        href={`/blog/${post.id}`}
                        className={`inline-flex items-center space-x-1 text-xs md:text-sm font-medium transition-colors duration-200 ${
                          theme === 'dark'
                            ? 'text-blue-400 hover:text-blue-300'
                            : 'text-blue-600 hover:text-blue-500'
                        }`}
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