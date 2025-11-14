// 📂 hooks/useAuth.tsx

"use client"; // このファイルがクライアントサイドで実行されることを宣言します。

import { useEffect, useState, createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ユーザーデータの型定義
interface User {
  id: string;
  email: string;
  name?: string; // オプションのプロパティ
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;         // ログイン中のユーザー情報、またはnull
  loading: boolean;          // 認証状態の確認中かどうか
  checkAuth: () => Promise<void>; // 認証状態を再確認する関数
  login: (userData: User) => void; // ログイン処理を行う関数（既存のAPIと互換性保持）
  logout: () => void;        // ログアウト処理を行う関数
}

// AuthContext の作成 (デフォルト値は null)
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider コンポーネント
 * アプリケーションの認証状態を管理し、子コンポーネントに認証コンテキストを提供します。
 * 🔒 既存の httpOnly クッキー実装と互換性を保ちます。
 * @param {ReactNode} children - ラップする子React要素
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);         // ユーザーの状態
  const [loading, setLoading] = useState<boolean>(true);       // ローディング状態
  const [mounted, setMounted] = useState<boolean>(false);       // クライアントでマウントされたかどうかの状態

  const router = useRouter(); // Next.js ルーターを初期化

  // クライアントサイドでマウントされたら mounted を true に設定
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * 認証状態をチェックする非同期関数。
   * 🔒 既存の /api/auth/me エンドポイントと互換性あり。
   * httpOnly クッキーに保存されたトークンを使用して認証を検証。
   */
  const checkAuth = useCallback(async () => {
    // マウントされていない場合は何もしない（SSRエラー防止）
    if (!mounted) {
      setLoading(false);
      return;
    }

    setLoading(true); // 認証チェック開始
    try {
      // httpOnly クッキーを送信
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const userData = await res.json();
        // 状態が実際に変わった場合のみ更新
        setUser(prevUser => {
          if (!prevUser || prevUser.id !== userData.id) {
            return userData;
          }
          return prevUser;
        });
      } else {
        setUser(null); // 認証失敗 → ユーザー情報クリア
      }
    } catch (error) {
      console.error('認証チェックエラー:', error);
      setUser(null);
    } finally {
      setLoading(false); // 完了
    }
  }, [mounted]);

  /**
   * ログイン処理を実行する関数。
   * 🔒 既存のAPI仕様と互換性あり。
   * 成功後はサーバーが httpOnly クッキーを設定。
   */
  const login = useCallback(async (userData: User) => {
    console.log("🔄 useAuth login 関数開始:", userData);
    setUser(userData); // ユーザー状態を設定
    
    // 状態更新後すぐにページ遷移
    try {
      console.log("🔄 /blog へリダイレクトを試行");
      await router.push('/blog'); // ブログページへ移動
      console.log("✅ ページ遷移完了");
      router.refresh(); // 最新データ取得
    } catch (error) {
      console.error("❌ ページ遷移失敗:", error);
      // 代替として window.location を使用
      window.location.href = '/blog';
    }
  }, [router]);

  /**
   * ログアウト処理。
   * 🔒 ログアウト専用 API がない場合、クライアント側で状態をクリア。
   */
  const logout = useCallback(async () => {
    try {
      // ログアウトAPI 呼び出し
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('ログアウトAPIエラー:', error);
    } finally {
      // 成否に関わらず状態をクリア
      setUser(null);
      
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 100);
    }
  }, [router]);

  // マウント後に初回認証チェックを実行
  useEffect(() => {
    if (mounted) {
      checkAuth();
    }
  }, [checkAuth, mounted]);

  // ブラウザがフォーカスされたり非表示 → 表示に戻ったとき認証を再確認
  useEffect(() => {
    if (!mounted) return;

    const handleFocus = () => {
      checkAuth();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, checkAuth]);

  // メモ化して再レンダリング最適化
  const value = useMemo(() => ({ 
    user, 
    loading, 
    checkAuth, 
    login, 
    logout 
  }), [user, loading, checkAuth, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証コンテキストを取得するカスタムフック
 * AuthProvider の外部で使われた場合はエラーをスロー
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth は AuthProvider 内で使用する必要があります。');
  }
  return context;
}