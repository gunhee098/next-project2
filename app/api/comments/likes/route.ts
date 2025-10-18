// 📂 app/api/comments/like/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

/**
 * コメントのいいねを作成する (POSTリクエスト)
 */
export async function POST(request: NextRequest) {
  try {
    const authenticatedUser = await getCurrentUser();
    if (!authenticatedUser) {
      console.warn("コメントいいね作成: 認証が必要です。");
      return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
    }

    const body = await request.json();
    const commentId = body.commentId;
    if (!commentId) {
      console.warn("コメントいいね作成: commentId が不足しています。");
      return NextResponse.json({ message: 'commentId が必要です。' }, { status: 400 });
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: authenticatedUser.id,
          commentId: commentId,
        },
      },
    });

    if (existingLike) {
      console.warn(`コメントいいね作成: すでにいいね済み - commentId: ${commentId}, userId: ${authenticatedUser.id}`);
      return NextResponse.json({ message: 'すでにいいね済みです。' }, { status: 409 });
    }

    const commentLike = await prisma.commentLike.create({
      data: {
        userId: authenticatedUser.id,
        commentId: commentId,
      },
    });

    console.log(`コメントAPI: コメントにいいねしました - commentId: ${commentId}, userId: ${authenticatedUser.id}`);
    return NextResponse.json(commentLike, { status: 201 });

  } catch (error) {
    console.error('コメントいいね作成エラー:', error);
    return NextResponse.json({ message: 'コメントいいねの作成に失敗しました。' }, { status: 500 });
  }
}

/**
 * コメントのいいねを削除する (DELETEリクエスト)
 */
export async function DELETE(request: NextRequest) {
  let commentId: string | undefined; // 미리 선언

  try {
    const authenticatedUser = await getCurrentUser();
    if (!authenticatedUser) {
      console.warn("コメントいいね削除: 認証が必要です。");
      return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
    }

    const body = await request.json();
    commentId = body.commentId; // 미리 저장

    if (!commentId) {
      console.warn("コメントいいね削除: commentId が不足しています。");
      return NextResponse.json({ message: 'commentId が必要です。' }, { status: 400 });
    }

    const deletedLike = await prisma.commentLike.delete({
      where: {
        userId_commentId: {
          userId: authenticatedUser.id,
          commentId: commentId,
        },
      },
    });

    console.log(`コメントAPI: コメントいいねを削除しました - commentId: ${commentId}, userId: ${authenticatedUser.id}`);
    return NextResponse.json({ message: 'コメントいいねが削除されました。', deletedLikeId: deletedLike.id }, { status: 200 });

  } catch (error) {
    // Prisma P2025エラー: 削除対象が見つからない
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      console.warn(`コメントいいね削除: いいねが見つかりません - commentId: ${commentId}`);
      return NextResponse.json({ message: 'いいねが見つかりませんでした。' }, { status: 404 });
    }

    console.error('コメントいいね削除エラー:', error);
    return NextResponse.json({ message: 'コメントいいねの削除に失敗しました。' }, { status: 500 });
  }
}