// 📂 middleware.ts (セキュリティ強化版)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

/**
 * JWT 토큰의 적절한 검증을 수행하는 미들웨어
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 静的ファイルとNext.js内部ファイルはスキップ
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth') || // 認証APIは除外
    pathname.includes('.') // 静的ファイル (favicon.ico, images, etc.)
  ) {
    return NextResponse.next();
  }

  // 保護されたルートの判定
  const protectedPaths = ['/blog', '/dashboard', '/profile'];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));
  const isLoginPage = pathname === '/';

  if (!isProtected) {
    // 🔒 ログインページ保護: すでにログイン済みの場合は/blogへリダイレクト
    if (isLoginPage) {
      const token = req.cookies.get('auth-token')?.value;
      if (token) {
        try {
          const jwtSecret = process.env.JWT_SECRET;
          if (jwtSecret) {
            // トークンが有効な場合のみリダイレクト
            jwt.verify(token, jwtSecret);
            console.log(`🔄 ログイン済みユーザーを/blogへリダイレクト`);
            return NextResponse.redirect(new URL('/blog', req.url));
          }
        } catch {
          // 無効なトークンの場合はそのままログインページを表示
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

  // 🔒 セキュリティ強化: 적절한 JWT 검증
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('🚨 JWT_SECRET環境変数が設定されていません');
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.set('auth-token', '', {
        expires: new Date(0),
        path: '/',
      });
      return response;
    }

    // JWT 토큰 완전 검증 (서명, 만료시간 포함)
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'], // 알고리즘 명시
      maxAge: '24h', // 최대 유효기간
    }) as jwt.JwtPayload & { 
      id: string; 
      email: string; 
      name: string; 
      sessionId?: string; 
      loginTime?: number;
    };

    // 필수 필드 검증
    if (!decoded.id || !decoded.email || !decoded.name) {
      throw new Error('Invalid token payload');
    }

    // 🔒 セッション独立性: セッションIDの確認
    if (!decoded.sessionId) {
      throw new Error('Missing session ID');
    }

    // 토큰 만료 시간 추가 확인
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error('Token expired');
    }

    console.log(`✅ 認証済みアクセス: ${pathname} (User: ${decoded.id}, Session: ${decoded.sessionId})`);
    return NextResponse.next();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`🚫 JWT検証失敗: ${pathname} ->`, errorMessage);
    
    // 무효한 토큰의 쿠키를 삭제
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
     * 以下のパス以外のすべてをマッチ:
     * - api/auth (認証API)
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化)
     * - favicon.ico
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};