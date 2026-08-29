const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Next.js アプリのパス（next.config.ts, .envファイルを読み込むため）
  dir: './',
});

// Jest に渡すカスタム設定
const customJestConfig = {
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>'],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
};

module.exports = createJestConfig(customJestConfig);
