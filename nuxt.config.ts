export default defineNuxtConfig({
  ssr: false,
  pages: false,   // 🔥 페이지 렌더링 완전히 끔 (API 서버 전용)
    nitro: {
    preset: "vercel"
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  typescript: {
    typeCheck: false
  },
  runtimeConfig: {
    r2: {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKey: process.env.R2_ACCESS_KEY_ID,
      secretKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET_NAME,
      r2PublicDomain: process.env.R2_PUBLIC_DOMAIN,
      endpoint: process.env.R2_ENDPOINT
    },
  }
});