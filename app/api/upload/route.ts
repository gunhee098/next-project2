import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import { getCurrentUser } from '@/lib/auth';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_MULTIPART_OVERHEAD = 64 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function hasValidImageSignature(buffer: Buffer, contentType: string): boolean {
  switch (contentType) {
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case 'image/png':
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'image/webp':
      return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    case 'image/gif':
      return buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a';
    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const contentLength = Number(req.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE + MAX_MULTIPART_OVERHEAD) {
      return NextResponse.json({ error: '이미지 크기는 5MB 이하여야 합니다.' }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: '이미지 파일을 첨부해 주세요.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '이미지 크기는 5MB 이하여야 합니다.' }, { status: 413 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'JPEG, PNG, WebP, GIF 형식만 업로드할 수 있습니다.' }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasValidImageSignature(buffer, file.type)) {
      return NextResponse.json({ error: '파일 내용이 이미지 형식과 일치하지 않습니다.' }, { status: 415 });
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'nextjs-blog', resource_type: 'image' },
        (error, uploadResult) => {
          if (error) {
            reject(error);
          } else if (uploadResult) {
            resolve(uploadResult);
          } else {
            reject(new Error('Cloudinary returned no upload result'));
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({ imageUrl: result.secure_url }, { status: 200 });
  } catch (error) {
    console.error('Image upload failed:', error);
    return NextResponse.json({ error: '이미지 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
