# DetailForge

AI 기반 상품 상세페이지 생성 SaaS MVP. Next.js(App Router) + Supabase + Playwright PNG 익스포트.

## 요구 사항

- Node.js 20+
- Supabase 프로젝트
- 로컬 PNG 익스포트: Chromium (`npx playwright install chromium`)

## 빠른 시작

```bash
cp .env.example .env.local
# .env.local 에 Supabase 키 등 입력

npm install
npx playwright install chromium

npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## Supabase 설정

1. SQL Editor에서 `supabase/migrations/001_initial.sql` 후 **`002_consume_credit_metadata.sql`** 를 순서대로 실행합니다. (`consume_credit`에 `p_metadata` 인자가 필요합니다.)
2. **Authentication → URL configuration** 에 Site URL을 `APP_URL`(예: `http://localhost:3000`)과 맞춥니다.
3. 이메일 확인을 끄면(개발용) 가입 직후 세션이 열려 바로 `/create` 로 이동합니다. 켜 두면 `/auth/callback` 으로 복귀합니다.
4. Storage에 버킷 `uploads`, `exports` 가 마이그레이션으로 생성됩니다. 없다면 스토리지에서 동일 이름으로 생성한 뒤, 마이그레이션의 RLS 정책이 적용되었는지 확인합니다.

### RLS 요약

- `profiles`: 본인 행만 `SELECT`. 크레딧 변경은 `consume_credit` / `refund_credit` RPC만 사용합니다.
- `generations` 테이블은 스키마에 남아 있으나 MVP 앱은 **결과 JSON을 저장하지 않습니다**(크레딧·로그만 사용).
- `credit_logs`, `payment_orders`: 본인 데이터만 읽기/쓰기.
- Storage `uploads` / `exports`: 객체 경로의 첫 폴더가 `auth.uid()` 와 일치할 때만 접근(서비스 롤은 RLS 우회).

### 가입 크레딧

`auth.users` INSERT 시 트리거 `handle_new_user` 가 `profiles` 에 3크레딧과 `credit_logs` 기록을 남깁니다.

## 환경 변수

`.env.example` 참고. 최소로는 다음이 필요합니다.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (이미지 안정화 시 `uploads` 업로드·서명 URL)
- `APP_URL` (로컬/배포 URL)

텍스트/이미지 AI를 쓰려면 `OPENAI_API_KEY` 및 `TEXT_GEN_PROVIDER=openai`, `IMAGE_GEN_PROVIDER=openai` 를 설정합니다. 기본은 mock입니다.

## PNG 익스포트

- **로컬**: `playwright`로 Chromium 실행(`npx playwright install chromium`).
- **Vercel**: `puppeteer-core` + `@sparticuz/chromium`이 **원격 Chromium 팩 tar URL**에서 바이너리를 풀어 실행합니다(패키지에 `bin`이 없어 기본 `executablePath()`만 쓰면 brotli 오류가 납니다). 선택 환경변수 `CHROMIUM_PACK_URL`(미설정 시 x64 기본 GitHub 릴리스 URL). ARM 러너면 해당 아키텍처용 tar로 교체하세요.
- `POST /api/export/png` — 요청 본문에 현재 세션의 `payload`를 담아 PNG 바이너리를 내려받습니다(DB에 결과 저장 없음). `maxDuration` 120초(플랜에 맞게 조정).

## 배포 전 체크리스트

- [ ] Supabase 마이그레이션 및 Storage 버킷·RLS 적용
- [ ] Auth URL / Redirect URLs에 배포 도메인과 `/auth/callback` 등록
- [ ] Vercel 환경 변수에 `NEXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL` 설정
- [ ] 크레딧 RPC(`consume_credit`, `refund_credit`) 동작 확인
- [ ] 프로덕션에서 PNG 다운로드 한 번 실행(콜드 스타트·Chromium 팩 다운로드·타임아웃 확인)
- [ ] 결제 연동 시 `PAYMENT_PROVIDER`, LemonSqueezy 관련 키 및 웹훅에서 크레딧 지급 구현

## 프로젝트 구조 (요약)

```
src/app/
  page.tsx                 # 랜딩
  login/, signup/          # 인증 UI
  (dashboard)/layout.tsx   # 헤더 + 크레딧
  (dashboard)/create/      # 생성 작업대
  (dashboard)/billing/     # 크레딧 패키지 + Mock 결제
  auth/callback/           # Supabase 이메일/ PKCE 콜백
  api/export/png
src/lib/
  supabase/                # browser / server / service / middleware
  providers/text-gen|image-gen
  billing/                 # mock + LemonSqueezy 스켈레톤
  generation/              # 섹션 빌드, HTML, PNG
supabase/migrations/001_initial.sql, 002_consume_credit_metadata.sql
```

## 라이선스

Private / MIT 등 프로젝트에 맞게 지정하세요.
