// 📂 app/api/user/route.ts
import { NextResponse, NextRequest } from "next/server"; // Next.jsのAPIルートからのレスポンスを扱うためのモジュール
import { prisma } from "@/lib/prisma"; // ✅ Prismaクライアントをインポートします。
import { verifyJWT } from "@/lib/auth";
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
    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return NextResponse.json({ error: "認証トークンが必要です。" }, { status: 401 });
    }

    // Reject authentication requests if the server secret is not configured.
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");
      return NextResponse.json({ error: "認証サービスを利用できません。" }, { status: 500 });
    }

    const decoded = verifyJWT(token);

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
