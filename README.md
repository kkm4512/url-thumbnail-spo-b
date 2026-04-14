# url-thumbnail-spo-b (백엔드 API 서버)

인스타그램 URL을 받아 OG 태그가 포함된 썸네일 HTML을 생성하고 Cloudflare R2에 업로드하는 **순수 API 서버**입니다.  
프론트엔드 없이 API 엔드포인트만 제공하며, `url-thumbnail-spo-f` (프론트엔드)와 함께 동작합니다.

---

## 역할 및 특징

- **API 전용 서버** — UI 없음, `ssr: false` + `pages: false` 설정으로 순수 백엔드로 동작
- **CORS 허용** — 외부 프론트엔드(모바일 앱 포함)에서 호출 가능하도록 전체 오리진 허용
- **Capacitor 포함** — 모바일 앱(Android) 빌드를 위한 의존성 추가됨
- **DB 없음** — spo-f와 달리 MySQL 없이 매 요청마다 크롤링 후 R2에 업로드

---

## API 엔드포인트

### `POST /api/convert`

인스타그램 URL을 받아 OG 태그가 심긴 HTML을 생성하고 R2에 업로드 후 URL을 반환합니다.

**요청**
```json
{ "url": "https://www.instagram.com/p/xxxxxx/" }
```

**응답 (성공)**
```json
{ "previewUrl": "https://pub-xxx.r2.dev/htmls/insta_xxx.html" }
```

**응답 (실패)**
```json
{ "error": "올바른 Instagram URL을 입력해주세요." }
```

---

### `POST /api/info`

인스타그램 URL을 받아 제목, 작성자, 해시태그만 파싱해서 반환합니다. (R2 업로드 없음)

**요청**
```json
{ "url": "https://www.instagram.com/p/xxxxxx/" }
```

**응답**
```json
{
  "title": "컴공이 잠을 못 잤을 때",
  "author": "ssongsogong",
  "tags": ["#대학생", "#동아대", "#개발"]
}
```

---

## 동작 원리 (`/api/convert`)

```
POST /api/convert { url }
  → 인스타그램 HTML 크롤링 (모바일 UA 사용)
  → OG 이미지, 제목, 작성자, 해시태그 파싱
  → 이미지 다운로드 → Cloudflare R2 업로드
  → OG 태그 포함 리다이렉트 HTML 생성 → R2 업로드
  → previewUrl 반환
```

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Nuxt 4 (API 서버 모드) |
| 스토리지 | Cloudflare R2 (AWS S3 호환) |
| HTML 파싱 | cheerio |
| 모바일 빌드 | Capacitor (Android) |
| 배포 | Vercel |

---

## 프로젝트 구조

```
├── server/
│   ├── api/
│   │   ├── convert.post.js   # 메인 변환 API (크롤링 → R2 업로드 → URL 반환)
│   │   └── info.post.js      # 정보만 파싱하는 경량 API
│   └── middleware/
│       └── cors.ts           # 전체 오리진 CORS 허용
├── app/
│   └── app.vue               # (비어있음 - API 서버 전용)
├── nuxt.config.ts            # ssr: false, pages: false 설정
└── package.json
```

---

## 환경변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 아래 값을 입력하세요.

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_DOMAIN=your_r2_public_domain
R2_ENDPOINT=your_r2_endpoint
```

> Vercel 배포 시에는 프로젝트 설정의 Environment Variables에 동일한 값을 등록하세요.

---

## 로컬 개발 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build
```

---

## spo-f 프로젝트와의 차이점

| 항목 | spo-b (이 프로젝트) | spo-f (프론트엔드) |
|------|---------------------|--------------------|
| 역할 | API 서버 전용 | 프론트엔드 + API |
| UI | 없음 | Vue 컴포넌트 있음 |
| DB | 없음 | MySQL 캐싱 있음 |
| CORS | 전체 허용 | 해당 없음 |
| 모바일 | Capacitor 포함 | 없음 |
| 추가 API | `/api/info` (파싱 전용) | 없음 |
