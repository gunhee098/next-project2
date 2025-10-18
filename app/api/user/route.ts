// 📂 app/api/user/route.ts
import { NextResponse, NextRequest } from "next/server"; // Next.jsのAPIルートからのレスポンスを扱うためのモジュール
import jwt from "jsonwebtoken"; // JWT (JSON Web Token) を扱うためのライブラリ
import { prisma } from "@/lib/prisma"; // ✅ Prismaクライアントをインポートします。
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'; // Prismaエラータイプをインポートします。

// GETリクエストハンドラー
// 認証トークンを検証し、トークンに紐づくユーザー情報を返します。
export async function GET(req: NextRequest) {
  try {
    // 🔹 1️⃣ Authorizationヘッダーから認証トークンを取得
    const authHeader = req.headers.get("authorization");
    // Authorizationヘッダーが存在しない、または"Bearer "で始まらない場合
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "認証トークンが必要です。" }, { status: 401 });
    }

    // 🔹 2️⃣ トークン文字列を抽出 ("Bearer " の後から)
    const token = authHeader.split(" ")[1];

    // 🔹 3️⃣ JWTトークンの検証
    // 環境変数からJWTシークレットを取得し、トークンを検証します。
    // 開発環境用の"default_secret"は、本番環境では必ず強力な秘密鍵に置き換えるべきです。
    // デコードされたIDの型はschema.prismaのUserモデルに合わせてstringとします。
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as { id: string; email: string; name: string }; // name 필드 추가

    // デコードされたトークンにユーザーIDが含まれていない場合
    if (!decoded.id) {
      return NextResponse.json({ error: "無効なトークンです。ユーザーIDが見つかりません。" }, { status: 401 });
    }

    // 🔹 4️⃣ Prismaを使用してデータベースからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true, 
        updatedAt: true, 
      },
    });

    // ユーザーが見つからない場合
    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりませんでした。" }, { status: 404 });
    }

    // 認証成功のレスポンスを返却
    return NextResponse.json({ message: "認証に成功しました！", user }, { status: 200 });

  } catch (error) {
    console.error("JWT認証またはデータベース操作中にエラーが発生しました:", error);
    if (error instanceof PrismaClientKnownRequestError) {
        return NextResponse.json({ error: `データベースエラーが発生しました: ${error.code}` }, { status: 500 });
    }
    // JWT検証失敗、またはその他の予期せぬエラーが発生した場合
    return NextResponse.json({ error: "無効なトークン、またはサーバーエラーです。" }, { status: 401 }); // JWT検証エラーの場合も401
  }
}