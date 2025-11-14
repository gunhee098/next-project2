// 📂 lib/auth.ts (認証サービスの分離)

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// ユーザータイプ定義
export interface User {
  id: string;
  email: string;
  name: string;
}

// JWT ペイロードタイプ
export interface JWTPayload extends User {
  iat: number;
  exp: number;
}

/**
 * サーバーサイドで現在のユーザーを取得する関数
 * Server Components と Route Handlers で使用可能
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('🚨 JWT_SECRET環境変数が設定されていません');
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // 必要なフィールドの検証
    if (!decoded.id || !decoded.email || !decoded.name) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

  } catch (error) {
    // JWT検証エラーはログに記録するが、nullを返す
    if (error instanceof jwt.TokenExpiredError) {
      console.log('🕐 トークンの有効期限が切れています');
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.log('🔐 無効なJWTトークンです');
    } else {
      console.error('🚨 認証エラー:', error);
    }
    return null;
  }
}

/**
 * 認証が必要なページ用のユーザー取得関数
 * 認証されていない場合はエラーをスローする
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * JWT トークンの生成（サーバーサイドのみ）
 */
export function generateJWT(user: User): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET環境変数が設定されていません');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    {
      expiresIn: '24h', // トークンの有効期限
      issuer: 'blog-app',
      audience: 'blog-users',
    }
  );
}

/**
 * 認証クッキーの設定オプション
 */
export const AUTH_COOKIE_OPTIONS = {
  name: 'auth-token',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 60 * 24, // 24時間
  path: '/',
} as const;