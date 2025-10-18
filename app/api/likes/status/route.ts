// 📂 app/api/likes/status/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 認証されたユーザー情報を取得します。
    const authenticatedUser = await getCurrentUser();
    if (!authenticatedUser) {
      return NextResponse.json({ message: '認証が必要です。' }, { status: 401 });
    }

    // リクエストURLからpostIdを取得します。
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');

    // postIdが提供されていない場合、エラーレスポンスを返します。
    if (!postId) {
      return NextResponse.json({ message: 'postIdは必須です。' }, { status: 400 });
    }

    // 認証されたユーザーとpostIdで「いいね」状態を検索します。
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: authenticatedUser.id, // 認証されたユーザーIDを使用
          postId: postId,
        },
      },
    });

    // likeが存在すればtrue、存在しなければfalseを返します。
    return NextResponse.json({ isLiked: !!like });

  } catch (error) {
    // エラーが発生した場合、コンソールにエラーを出力し、サーバーエラーを返します。
    console.error('いいね状態の取得エラー:', error);
    return NextResponse.json({ message: 'いいね状態の取得に失敗しました。' }, { status: 500 });
  }
}