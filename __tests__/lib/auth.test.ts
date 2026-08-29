import jwt from 'jsonwebtoken';
import { generateJWT, type User } from '@/lib/auth';

describe('generateJWT', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret-key-for-jest-only' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const testUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  it('生成したトークンに正しいペイロードが含まれる', () => {
    const token = generateJWT(testUser);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;

    expect(decoded.id).toBe(testUser.id);
    expect(decoded.email).toBe(testUser.email);
    expect(decoded.name).toBe(testUser.name);
  });

  it('issuer と audience が正しく設定される', () => {
    const token = generateJWT(testUser);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;

    expect(decoded.iss).toBe('blog-app');
    expect(decoded.aud).toBe('blog-users');
  });

  it('不正なシークレットで検証すると失敗する', () => {
    const token = generateJWT(testUser);

    expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
  });

  it('JWT_SECRET が未設定の場合はエラーを投げる', () => {
    delete process.env.JWT_SECRET;

    expect(() => generateJWT(testUser)).toThrow('JWT_SECRET');
  });
});
