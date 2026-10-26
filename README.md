# 🍜 Hururuk

> The digital manhwabang for completed Korean webtoons.

완결된 한국 웹툰을 영어로 정주행하는 구독 서비스(월 $4.99)의 출시 전 검증용 사이트야.
지금은 fake door 단계라 실제 결제는 없고, 대기자 이메일과 익명 행동 데이터만 모아.

- 서비스 주소: https://hururuk.app
- 호스팅: Cloudflare Pages (GitHub 연동 자동 배포)
- 저장소: Cloudflare D1 (대기자 이메일, 익명 퍼널 이벤트)

## 폴더 구조

```
public/            정적 사이트 (Cloudflare가 그대로 배포)
  index.html       독자용 사이트 (카탈로그, 뷰어, 대기자 등록)
  partner.html     CP 파트너 콘솔 데모
  privacy.html     개인정보 안내
  stats.html       실시간 지표 (STATS_KEY 필요, 검색 노출 안 됨)
  covers/          작품 표지 54장
functions/api/     서버 코드 (Cloudflare Pages Functions)
  waitlist.js      POST /api/waitlist  대기자 이메일 저장
  event.js         POST /api/event     익명 퍼널 이벤트 저장
  stats.js         GET  /api/stats     지표 집계 (STATS_KEY 헤더 필요)
lib/db.js          D1 테이블 자동 생성, 공통 함수
```

## 측정하는 퍼널

방문 → 작품 페이지 → Ep.1 열람 → Ep.3 완독 → $4.99 클릭 → 대기자 등록

쿠키는 쓰지 않아. 페이지를 열 때마다 새 익명 세션 ID를 만들어서 세션 단위로만 집계해.
유입 경로는 `?utm_source=reddit` 같은 링크 파라미터나 이전 사이트 주소로 기록돼.

## 처음 배포하기

1. **D1 만들기**: Cloudflare 대시보드 → Storage & Databases → D1 → 데이터베이스 생성 (이름 예: hururuk). 테이블은 첫 요청 때 자동으로 만들어져.
2. **Pages 프로젝트 만들기**: Workers & Pages → Create → Pages → **Connect to Git** → 이 저장소 선택.
   - Framework preset: None
   - Build command: 비워두기
   - Build output directory: `public`
3. **바인딩 연결**: Pages 프로젝트 → Settings → Bindings → D1 추가, **변수 이름 `DB`**, 1번 데이터베이스 선택.
4. **지표 비밀번호**: Settings → Variables and Secrets → `STATS_KEY` 추가 (Secret 유형, 아무도 못 맞힐 긴 문자열).
5. **다시 배포**: 바인딩과 변수는 새 배포부터 적용돼. Deployments에서 최신 배포를 Retry 하거나 커밋을 하나 푸시해.
6. **도메인**: Custom domains → `hururuk.app` 추가. 도메인이 같은 Cloudflare 계정이라 DNS는 자동으로 잡혀.
7. **테스트**: hururuk.app에서 대기자 등록 → https://hururuk.app/stats.html 에서 STATS_KEY 입력 → 숫자가 올라가는지 확인.

이후로는 `main` 브랜치에 푸시할 때마다 자동으로 배포돼.

## 링크 공유할 때

채널별 성과를 보려면 링크 끝에 utm_source를 붙여서 공유해.

- Reddit: `https://hururuk.app/?utm_source=reddit`
- TikTok 쇼츠: `https://hururuk.app/?utm_source=tiktok`
- Instagram: `https://hururuk.app/?utm_source=instagram`

## 데이터 직접 보기

D1 콘솔에서 SQL로 바로 볼 수 있어.

```sql
SELECT * FROM waitlist ORDER BY joined_at DESC;
SELECT name, COUNT(DISTINCT session) FROM events GROUP BY name;
```

## 참고

- 작품, 표지, 회차 내용은 전부 데모용 가상 콘텐츠야. 표지는 AI로 생성했어.
- 개인정보 문의: kaimjy@kaist.ac.kr
