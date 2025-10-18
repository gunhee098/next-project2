// 📂 app/api/comments/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * POSTハンドラー: 新しいコメントを作成
 * @param {NextRequest} req - 受信したNext.jsのリクエストオブジェクト
 * @returns {NextResponse} 作成されたコメントのレスポンス
 */
export async function POST(req: NextRequest) {
  try {
    // 認証済みユーザー情報を取得
    const authenticatedUser = await getCurrentUser();
    if (!authenticatedUser) {
      console.warn("コメント作成: 認証が必要です。");
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const { content, postId } = await req.json();

    if (!content || !postId) {
      console.warn("コメント作成: コメント内容または投稿IDが不足しています。");
      return NextResponse.json({ error: 'コメント内容と投稿IDは必須です。' }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        content,
        userId: authenticatedUser.id,
        postId,
      },
    });

    console.log("✔ 新しいコメントが作成されました:", newComment);
    return NextResponse.json(newComment, { status: 201 });

  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error(`🚨 コメント作成中にデータベースエラーが発生 [${error.code}]:`, error.message);
      return NextResponse.json({ error: `データベースエラー: ${error.code}` }, { status: 500 });
    }
    console.error("🚨 コメント作成中に予期せぬエラーが発生:", error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}

/**
 * GETハンドラー: 投稿に紐づくコメント取得
 * @param {NextRequest} req - 受信したNext.jsのリクエストオブジェクト
 * @returns {NextResponse} コメント一覧のレスポンス
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      console.warn("コメント取得: 投稿IDが不足しています。");
      return NextResponse.json({ error: '投稿IDは必須です。' }, { status: 400 });
    }

    // 認証済みユーザー情報を取得（API一貫性のため）
    const authenticatedUser = await getCurrentUser();
    if (!authenticatedUser) {
      console.warn("コメント取得: 認証が必要です。");
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✔ 投稿ID ${postId} のコメント取得成功 件数: ${comments.length}`);
    return NextResponse.json(comments);

  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      console.error(`🚨 コメント取得中にデータベースエラー [${error.code}]:`, error.message);
      return NextResponse.json({ error: `データベースエラー: ${error.code}` }, { status: 500 });
    }
    console.error("🚨 コメント取得中に予期せぬエラーが発生:", error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}