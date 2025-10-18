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
 * 🔒 既存のhttpOnly クッキー実装と互換性を保ちます。
 * @param {ReactNode} children - ラップする子React要素
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);         // ユーザーの状態
  const [loading, setLoading] = useState<boolean>(true);       // ローディング状態
  const [mounted, setMounted] = useState<boolean>(false);       // クライアントでマウントされたかどうかの状態

  const router = useRouter(); // Next.jsルーターフックを初期化

  // コンポーネントがクライアントサイドでマウントされたときに mounted を true に設定
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * 認証状態をチェックする非同期関数。
   * 🔒 既存の /api/auth/me エンドポイントと互換性を保ちます。
   * httpOnly クッキーに保存されたトークンを使用して認証を検証します。
   */
  const checkAuth = useCallback(async () => {
    // コンポーネントがマウントされていない場合は何もしない (SSR時のエラー防止)
    if (!mounted) {
      setLoading(false);
      return;
    }

    setLoading(true); // 認証チェック開始時にローディング状態を設定
    try {
      // 🔒 既存のAPI構造に合わせてcredentials: 'include' でhttpOnlyクッキーを送信
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // httpOnly クッキーを含めて送信
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const userData = await res.json(); // ユーザーデータをJSONとしてパース
        // ユーザーデータが実際に変更された場合のみ状態を更新し、不要な再レンダリングを防ぎます。
        setUser(prevUser => {
          if (!prevUser || prevUser.id !== userData.id) {
            return userData;
          }
          return prevUser;
        });
      } else {
        setUser(null); // 認証失敗時はユーザーをnullに設定
      }
    } catch (error) {
      console.error('認証チェックエラー:', error);
      setUser(null); // ユーザーをnullに設定
    } finally {
      setLoading(false); // 認証チェック完了時にローディング状態を解除
    }
  }, [mounted]); // mounted が変更された場合にのみ関数を再生成

  /**
   * ログイン処理を行う関数。
   * 🔒 既存のAPIレスポンス構造と互換性を保ちます。
   * ログイン成功後にサーバーがhttpOnlyクッキーを設定します。
   * @param {User} userData - ログインユーザーのデータ
   */
  const login = useCallback(async (userData: User) => {
    console.log("🔄 useAuth login 함수 시작:", userData);
    setUser(userData); // ユーザー状態を設定
    
    // 상태 업데이트 후 즉시 페이지 이동
    try {
      console.log("🔄 /blog로 리다이렉트 시도");
      await router.push('/blog');    // ブログページへリダイレクト
      console.log("✅ 페이지 이동 완료");
      router.refresh();       // ページのデータを再フェッチして最新の状態にする
    } catch (error) {
      console.error("❌ 페이지 이동 실패:", error);
      // 대안: window.location 사용
      window.location.href = '/blog';
    }
  }, [router]);

  /**
   * ログアウト処理を行う関数。
   * 🔒 専用のログアウトエンドポイントがない場合、クライアントサイドで状態をクリアします。
   * サーバーサイドでクッキーが期限切れになるまで待つか、専用エンドポイントを作成することを推奨。
   */
  const logout = useCallback(async () => {
    try {
      // 로그아웃 API 호출
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('ログアウトAPIエラー:', error);
    } finally {
      // API 성공/실패와 관계없이 상태 클리어
      setUser(null);
      
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 100);
    }
  }, [router]);

  // コンポーネントがマウントされた後、初回認証チェックを実行します。
  useEffect(() => {
    if (mounted) {
      checkAuth();
    }
  }, [checkAuth, mounted]);

  // ブラウザのフォーカスイベントや visibility 変更時に認証状態を再確認します。
  useEffect(() => {
    if (!mounted) return; // クライアントでマウントされていない場合は何もしない

    const handleFocus = () => {
      checkAuth(); // ウィンドウがフォーカスされたときに認証チェック
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) { // ページが再び表示状態になったときに
        checkAuth();         // 認証チェック
      }
    };

    window.addEventListener('focus', handleFocus);                 // focus イベントリスナーを追加
    document.addEventListener('visibilitychange', handleVisibilityChange); // visibilitychange イベントリスナーを追加

    // クリーンアップ関数: コンポーネントのアンマウント時にイベントリスナーを削除
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, checkAuth]); // 依存配列に mounted と checkAuth を含める

  // AuthContext に提供する値を useMemo でメモ化し、不要な再計算を防ぎます。
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
 * AuthContext から認証コンテキストを取得するためのカスタムフック。
 * AuthProvider の内部で使用されない場合、エラーをスローします。
 * @returns {AuthContextType} 認証コンテキストの値
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    // AuthProvider の外部で useAuth が呼び出された場合のエラーハンドリング
    throw new Error('useAuth は AuthProvider 内で使用する必要があります。');
  }
  return context;
}