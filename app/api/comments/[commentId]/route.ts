// 📂 app/api/comments/[commentId]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * PUTハンドラー: コメント修正
 * @param {NextRequest} request - 受信したNext.jsのリクエストオブジェクト
 * @param {{ params: { commentId: string } }} - URLパラメータからcommentIdを取得
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const authenticatedUser = await getCurrentUser();
    if (!authenticatedUser) {
      console.warn("コメント更新: 認証が必要です。");
      return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
    }

    const { commentId } = params;
    const { content } = await request.json();

    if (!commentId || !content) {
      console.warn("コメント更新: commentId または content が不足しています。");
      return NextResponse.json({ message: 'commentId と content は必須です。' }, { status: 400 });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, postId: true },
    });

    if (!existingComment) {
      console.warn(`コメント更新: コメントが見つかりません - commentId: ${commentId}`);
      return NextResponse.json({ message: 'コメントが見つかりませんでした。' }, { status: 404 });
    }

    if (existingComment.userId !== authenticatedUser.id) {
      console.warn(`コメント更新: 権限なし - commentId: ${commentId}, userId: ${authenticatedUser.id}`);
      return NextResponse.json({ message: 'このコメントを編集する権限がありません。' }, { status: 403 });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: { content, updatedAt: new Date() },
    });

    revalidatePath(`/blog/${existingComment.postId}`);
    console.log(`✔ コメント更新後にキャッシュ無効化 /blog/${existingComment.postId}`);

    console.log(`コメントAPI: コメントを更新しました - commentId: ${commentId}, userId: ${authenticatedUser.id}`);
    return NextResponse.json({ message: 'コメントが更新されました。', comment: updatedComment }, { status: 200 });

  } catch (error) {
    console.error('コメント更新エラー (PUT):', error);
    return NextResponse.json({ message: 'コメントの更新に失敗しました。' }, { status: 500 });
  }
}

/**
 * DELETEハンドラー: コメント削除
 * @param {NextRequest} request - 受信したNext.jsのリクエストオブジェクト
 * @param {{ params: { commentId: string } }} - URLパラメータからcommentIdを取得
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const authenticatedUser = await getCurrentUser();
    if (!authenticatedUser) {
      console.warn("コメント削除: 認証が必要です。");
      return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
    }

    const { commentId } = params;
    if (!commentId) {
      console.warn("コメント削除: commentId が不足しています。");
      return NextResponse.json({ message: 'commentId は必須です。' }, { status: 400 });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, postId: true },
    });

    if (!existingComment) {
      console.warn(`コメント削除: コメントが見つかりません - commentId: ${commentId}`);
      return NextResponse.json({ message: 'コメントが見つかりませんでした。' }, { status: 404 });
    }

    if (existingComment.userId !== authenticatedUser.id) {
      console.warn(`コメント削除: 権限なし - commentId: ${commentId}, userId: ${authenticatedUser.id}`);
      return NextResponse.json({ message: 'このコメントを削除する権限がありません。' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    revalidatePath(`/blog/${existingComment.postId}`);
    console.log(`✔ コメント削除後にキャッシュ無効化 /blog/${existingComment.postId}`);

    console.log(`コメントAPI: コメントを削除しました - commentId: ${commentId}, userId: ${authenticatedUser.id}`);
    return NextResponse.json({ message: 'コメントが削除されました。' }, { status: 200 });

  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      console.warn(`コメント削除: 削除対象が見つかりません - commentId: ${params.commentId}`);
      return NextResponse.json({ message: '削除するコメントが見つかりませんでした。' }, { status: 404 });
    }
    console.error('コメント削除エラー (DELETE):', error);
    return NextResponse.json({ message: 'コメントの削除に失敗しました。' }, { status: 500 });
  }
}