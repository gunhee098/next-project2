// 📂 app/api/auth/route.ts (Auth Service使用版)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateJWT, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15分

// シンプルなインメモリレート制限
const loginAttempts = new Map<string, { attempts: number; lastAttempt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (!attempt) {
    loginAttempts.set(ip, { attempts: 1, lastAttempt: now });
    return true;
  }
  
  if (now - attempt.lastAttempt > LOCKOUT_TIME) {
    loginAttempts.set(ip, { attempts: 1, lastAttempt: now });
    return true;
  }
  
  if (attempt.attempts >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  attempt.attempts++;
  attempt.lastAttempt = now;
  return true;
}

function validateInput(type: string, name?: string, email?: string, password?: string) {
  const errors: string[] = [];

  if (!type || !['login', 'register'].includes(type)) {
    errors.push("有効なリクエストタイプを指定してください。");
  }

  if (!email || typeof email !== 'string') {
    errors.push("メールアドレスを入力してください。");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("有効なメールアドレスを入力してください。");
    }
  }

  if (!password || typeof password !== 'string') {
    errors.push("パスワードを入力してください。");
  } else {
    if (password.length < 8) {
      errors.push("パスワードは8文字以上である必要があります。");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("パスワードには小文字を含める必要があります。");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("パスワードには大文字を含める必要があります。");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("パスワードには数字を含める必要があります。");
    }
  }

  if (type === 'register' && (!name || typeof name !== 'string' || name.trim().length < 2)) {
    errors.push("名前は2文字以上で入力してください。");
  }

  return errors;
}

function getClientIP(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return xForwardedFor?.split(',')[0].trim() || 
         xRealIP || 
         cfConnectingIP || 
         'unknown';
}

export async function POST(req: Request) {
  try {
    const clientIP = getClientIP(req);
    
    // レート制限チェック
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "リクエスト制限に達しました。15分後に再試行してください。" }, 
        { status: 429 }
      );
    }

    const body = await req.json();
    const { type, name, email, password } = body;

    // 入力値検証
    const validationErrors = validateInput(type, name, email, password);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (type === "register") {
      try {
        // 既存ユーザーチェック
        const existingUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true }
        });

        if (existingUser) {
          return NextResponse.json(
            { error: "このメールアドレスは既に登録されています。" }, 
            { status: 409 }
          );
        }

        // パスワードハッシュ化
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // ユーザー作成
        const newUser = await prisma.user.create({
          data: {
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
          },
          select: { id: true, name: true, email: true }
        });

        return NextResponse.json({ 
          message: "ユーザー登録が成功しました。",
          user: newUser
        }, { status: 201 });

      } catch (error) {
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
          return NextResponse.json(
            { error: "このメールアドレスは既に登録されています。" }, 
            { status: 409 }
          );
        }
        
        console.error("ユーザー登録エラー:", error);
        return NextResponse.json(
          { error: "サーバーエラーが発生しました。" }, 
          { status: 500 }
        );
      }
    }

    if (type === "login") {
      try {
        // ユーザー検索
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, name: true, email: true, password: true }
        });

        if (!user) {
          return NextResponse.json(
            { error: "メールアドレスまたはパスワードが正しくありません。" }, 
            { status: 401 }
          );
        }

        // パスワード検証
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "メールアドレスまたはパスワードが正しくありません。" }, 
            { status: 401 }
          );
        }

        // 🔒 Auth Serviceを使用してJWTトークンを生成
        // nameがnullの場合は空文字列に変換してからJWT生成
        const userData = {
          id: user.id,
          name: user.name || '', // nullの場合は空文字列に変換
          email: user.email,
        };
        
        const token = generateJWT(userData);
        
        // レスポンス作成
        const response = NextResponse.json({ 
          message: "ログインに成功しました。",
          user: userData
        }, { status: 200 });

        // 🔒 統一されたクッキー設定を使用
        response.cookies.set(
          AUTH_COOKIE_OPTIONS.name,
          token,
          {
            httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
            secure: AUTH_COOKIE_OPTIONS.secure,
            sameSite: AUTH_COOKIE_OPTIONS.sameSite,
            maxAge: AUTH_COOKIE_OPTIONS.maxAge,
            path: AUTH_COOKIE_OPTIONS.path,
          }
        );

        console.log(`✅ ログイン成功: ${user.email}`);
        return response;

      } catch (error) {
        console.error("ログインエラー:", error);
        return NextResponse.json(
          { error: "サーバーエラーが発生しました。" }, 
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "無効なリクエストです。" }, { status: 400 });

  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "無効なJSON形式です。" }, { status: 400 });
    }
    
    console.error("サーバーエラー:", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました。" }, { status: 500 });
  }
}