// 📂 middleware.ts (セキュリティ強化版)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

/**
 * JWT トークンを適切に検証するミドルウェア
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 静的ファイルと Next.js 内部ファイルはスキップ
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth') || // 認証 API は除外
    pathname.includes('.') // 静的ファイル (favicon.ico, 画像など)
  ) {
    return NextResponse.next();
  }

  // 保護されているルートの判定
  const protectedPaths = ['/blog', '/dashboard', '/profile'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isLoginPage = pathname === '/';

  if (!isProtected) {
    // 🔒 ログインページ保護: 既にログイン済みの場合は /blog へリダイレクト
    if (isLoginPage) {
      const token = req.cookies.get('auth-token')?.value;
      if (token) {
        try {
          const jwtSecret = process.env.JWT_SECRET;
          if (jwtSecret) {
            // トークンが有効な場合のみリダイレクト
            jwt.verify(token, jwtSecret);
            console.log(`🔄 ログイン済みユーザーを /blog へリダイレクト`);
            return NextResponse.redirect(new URL('/blog', req.url));
          }
        } catch {
          // 無効なトークンの場合はログインページを表示
          console.log(`🔐 無効なトークンのためログインページを表示`);
        }
      }
    }
    return NextResponse.next();
  }

  // 認証トークンの確認
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    console.log(`🔐 未認証アクセス: ${pathname} -> ログインページへリダイレクト`);
    const loginUrl = new URL('/', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🔒 セキュリティ強化: JWT の適切な検証
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('🚨 JWT_SECRET 環境変数が設定されていません');
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.set('auth-token', '', {
        expires: new Date(0),
        path: '/',
      });
      return response;
    }

    // JWT トークン完全検証（署名、期限を含む）
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'], // アルゴリズム指定
      maxAge: '24h', // 最大有効期間
    }) as jwt.JwtPayload & { 
      id: string; 
      email: string; 
      name: string; 
      sessionId?: string; 
      loginTime?: number;
    };

    // 必須フィールドの確認
    if (!decoded.id || !decoded.email || !decoded.name) {
      throw new Error('Invalid token payload');
    }

    // 🔒 セッション独立性: sessionId の確認
    if (!decoded.sessionId) {
      throw new Error('Missing session ID');
    }

    // トークンの有効期限を追加で確認
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error('Token expired');
    }

    console.log(`✅ 認証済みアクセス: ${pathname} (User: ${decoded.id}, Session: ${decoded.sessionId})`);
    return NextResponse.next();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`🚫 JWT 検証失敗: ${pathname} ->`, errorMessage);
    
    // 無効なトークンのクッキーを削除
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set('auth-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * 以下のパス以外すべてをマッチ:
     * - api/auth（認証 API）
     * - _next/static（静的ファイル）
     * - _next/image（画像最適化）
     * - favicon.ico
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};