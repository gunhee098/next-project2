// 📂 app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'; // Cloudinary SDKをインポート

// Cloudinary 設定 (環境変数を使用)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // .env.local に NEXT_PUBLIC_ 接頭辞があってもサーバーサイドで利用可能
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * ⚡ [POST] 画像アップロード
 * クライアントから受け取った画像をCloudinaryにアップロードし、そのURLを返します。
 * @param req NextRequest オブジェクト
 * @returns NextResponse オブジェクト (成功時は画像URL, 失敗時はエラーメッセージ)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData(); // マルチパート/フォームデータを解析
    const file = formData.get('file'); // 'file'という名前で送信されたファイルを取得

    // ファイルが添付されていない場合のバリデーション
    if (!file) {
      return NextResponse.json({ error: 'ファイルがアップロードされていません。' }, { status: 400 });
    }

    // FormDataからファイルデータを読み込み、Bufferに変換
    // Next.jsのRequest.formData()から取得されるFileオブジェクトはBlobを継承しています。
    const arrayBuffer = await (file as Blob).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Cloudinaryに画像をアップロード
    // Promiseでラップすることで、非同期処理を待機可能にする
    const result = await new Promise<UploadApiResponse | undefined>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "nextjs-blog" }, // Cloudinaryのフォルダを指定
        (error, uploadResult) => {
          if (error) {
            reject(error);
          } else {
            resolve(uploadResult);
          }
        }
      ).end(buffer); // Bufferデータをアップロードストリームに送信
    });

    // アップロード結果の検証とURLの返却
    if (result && typeof result === 'object' && 'secure_url' in result) {
      return NextResponse.json({ imageUrl: (result as { secure_url: string }).secure_url }, { status: 200 });
    } else {
      // Cloudinaryからの応答が期待される形式でない場合のログとエラー
      console.error('Cloudinaryアップロード結果が期待通りではありません:', result);
      return NextResponse.json({ error: '画像のアップロードに失敗しました。(Cloudinary応答エラー)' }, { status: 500 });
    }

  } catch (error) {
    // サーバーエラー発生時のログとエラー応答
    console.error('画像アップロード中にサーバーエラーが発生しました:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}