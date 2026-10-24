// 📂 app/api/auth/route.ts (Auth Service使用版)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateJWT, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15分

/**
 * 🔒 ユーザーレベルのレート制限を DB (User モデル) で管理します。
 * インメモリ実装ではサーバー再起動で状態がリセットされ、
 * DB 实装では再起動後もロックアウト状態が継続します。
 */
async function checkRateLimit(userId: string): Promise<boolean> {
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      loginAttempts: true,
      lastFailedLogin: true,
      lockoutUntil: true,
    },
  });

  if (!user) {
    return true;
  }

  // ロックアウト期間中の場合はブロック
  if (user.lockoutUntil && user.lockoutUntil > now) {
    return false;
  }

  // ロックアウト期間が切れた、または初回の場合はカウントをリセット
  const isWindowExpired =
    !user.lastFailedLogin ||
    now.getTime() - user.lastFailedLogin.getTime() > LOCKOUT_MS;

  if (isWindowExpired) {
    await prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: 0, lastFailedLogin: null, lockoutUntil: null },
    });
    return true;
  }

  return (user.loginAttempts ?? 0) < MAX_LOGIN_ATTEMPTS;
}

/**
 * ログイン失敗時のカウントを DB に記録します。
 */
async function recordFailedLogin(userId: string): Promise<void> {
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginAttempts: true },
  });

  if (!user) return;

  const nextAttempts = (user.loginAttempts ?? 0) + 1;
  const shouldLockout = nextAttempts >= MAX_LOGIN_ATTEMPTS;

  await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: nextAttempts,
      lastFailedLogin: now,
      ...(shouldLockout
        ? { lockoutUntil: new Date(now.getTime() + LOCKOUT_MS) }
        : { lockoutUntil: null }),
    },
  });
}

/**
 * ログイン成功時のカウントをリセットします。
 */
async function resetLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { loginAttempts: 0, lastFailedLogin: null, lockoutUntil: null },
  });
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

export async function POST(req: Request) {
  try {
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

                // 🔒 ユーザー特定後に DB レベルのレート制限をチェック
        // (インメモリ Map ではサーバー再起動で状態がリセットされた)
        // 🔒 ユーザー特定後に DB レベルのレート制限をチェック
        // (インメモリ Map ではサーバー再起動で状態がリセットされた)
        if (user) {
          const allowed = await checkRateLimit(user.id);
          if (!allowed) {
            return NextResponse.json(
              { error: "ログイン試行回数の上限に達しました。15分後に再試行してください。" },
              { status: 429 }
            );
          }
        }

        if (!user) {
          // 🔒 アカウント列挙を防ぐため、存在しないアカウントでも同じエラーを返す
          return NextResponse.json(
            { error: "メールア dressまたはパスワードが正しくありません。" },
            { status: 401 }
          );
        }

        // パスワード検証
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          // 🔒 失敗率为 DB に記録し、ブルートフォースを防止
          await recordFailedLogin(user.id);
          return NextResponse.json(
            { error: "メールア dressまたはパスワードが正しくありません。" },
            { status: 401 }
          );
        }

        // 🔒 ログイン成功率为カウントをリセット
        await resetLoginAttempts(user.id);

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