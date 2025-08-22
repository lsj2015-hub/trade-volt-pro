/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 엄격 모드
  reactStrictMode: true,

  // SWC 컴파일러 사용
  swcMinify: true,

  // 환경 변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },

  // API 리라이트 (프록시 설정)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },

  // 이미지 최적화 설정
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // TypeScript 설정
  typescript: {
    // 빌드 시 타입 에러 무시 (개발 시에만)
    ignoreBuildErrors: false,
  },

  // ESLint 설정
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
