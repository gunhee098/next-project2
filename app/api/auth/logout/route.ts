// 📂 app/api/auth/logout/route.ts

import { NextResponse } from "next/server";
import { AUTH_COOKIE_OPTIONS } from "@/lib/auth";

/**
 * POSTリクエストハンドラ: ログアウト処理
 * httpOnlyクッキーを削除してユーザーをログアウトします。
 * @returns {NextResponse} レスポンスオブジェクト
 */
export async function POST() {
  try {
    // レスポンス作成
    const response = NextResponse.json({ 
      message: "ログアウトしました。" 
    }, { status: 200 });

    // 🔒 httpOnlyクッキーを削除
    response.cookies.set(
      AUTH_COOKIE_OPTIONS.name,
      '', // 空の値を設定
      {
        httpOnly: AUTH_COOKIE_OPTIONS.httpOnly,
        secure: AUTH_COOKIE_OPTIONS.secure,
        sameSite: AUTH_COOKIE_OPTIONS.sameSite,
        maxAge: 0, // 即座に期限切れ
        path: AUTH_COOKIE_OPTIONS.path,
      }
    );

    console.log('✅ ログアウト成功');
    return response;

  } catch (error) {
    console.error("ログアウトエラー:", error);
    return NextResponse.json(
      { error: "ログアウト処理中にエラーが発生しました。" }, 
      { status: 500 }
    );
  }
}