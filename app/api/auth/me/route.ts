// 📂 app/api/auth/me/route.ts

// Next.jsのAPIルートのためのモジュールをインポートします。
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * GETリクエストハンドラ
 * 🔒 セキュリティ改善: httpOnlyクッキーからJWTトークンを検証し、ユーザー情報を返します。
 * Authorizationヘッダーの代わりにクッキーを使用することでXSS攻撃を防止します。
 * @returns {NextResponse} レスポンスオブジェクト
 */
export async function GET() {
  try {
    // 🔒 統一されたauth.tsのgetCurrentUser関数を使用
    const user = await getCurrentUser();
    
    // 認証されていない場合、認証エラーを返します。
    if (!user) {
      return NextResponse.json(
        { error: "認証トークンがありません。ログインが必要です。" }, 
        { status: 401 }
      );
    }

    // ユーザー情報をUserオブジェクトの形式で返します。
    // セキュリティのため、必要最小限の情報のみを返します。
    return NextResponse.json(user, { 
      status: 200,
      // 🔒 セキュリティヘッダーを追加
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate', // キャッシュを防止
        'Pragma': 'no-cache',
      }
    });

  } catch (error) {
    // トークンの検証中にエラーが発生した場合の詳細なエラーハンドリング
    console.error("🚨 認証確認失敗:", error);
    
    return NextResponse.json(
      { error: "認証確認中にエラーが発生しました。再ログインが必要です。" }, 
      { status: 401 }
    );
  }
}