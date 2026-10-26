# 🍜 Hururuk

> The digital manhwabang for completed Korean webtoons.

완결된 한국 웹툰을 영어로 정주행하는 구독 서비스(월 $4.99)의 출시 전 검증용 사이트야.
지금은 fake door 단계라 실제 결제는 없고, 대기자 이메일과 익명 행동 데이터만 모아.

- 서비스 주소: https://hururuk.app
- 호스팅: Cloudflare Workers + 정적 자산 (GitHub 연동 자동 배포)
- 저장소: Cloudflare D1 (대기자 이메일, 익명 퍼널 이벤트)

## 폴더 구조

```
wrangler.jsonc     Worker 설정 (이름, 정적 파일 폴더, D1 연결)
src/index.js       Worker 진입점. /api/* 요청을 아래 핸들러로 보내고, 나머지는 public/ 파일을 그대로 보여줌
public/            정적 사이트
  index.html       독자용 사이트 (카탈로그, 작품 페이지, 대기자 등록)
  partner.html     CP 파트너 콘솔 데모
  privacy.html     개인정보 안내
  stats.html       실시간 지표 (STATS_KEY 필요, 검색 노출 안 됨)
  covers/          작품 표지 54장
functions/api/     API 핸들러
  waitlist.js      POST /api/waitlist  대기자 이메일, 선호 장르, 아이디어 저장
  event.js         POST /api/event     익명 퍼널 이벤트 저장
  stats.js         GET  /api/stats     지표 집계 (x-stats-key 헤더 필요)
lib/db.js          D1 테이블 자동 생성 (새 칸은 기존 데이터 그대로 두고 자동 추가), 공통 함수
```

## 측정하는 퍼널

방문 → 작품 페이지 → 1화 보기 클릭 → 대기자 등록

"Read Ep.1 free"나 무료 회차를 누르면 뷰어 대신 대기자 창이 떠 (출시 때 Ep.1~3 무료 + 첫 달 무료 안내).
대기자 창에는 선택 질문 두 개가 있어. 안 골라도 가입돼.

- 선호 장르 (11개 중 여러 개): 지표 페이지에 순위표로 나와 ("대기자 N명 중 M명 응답")
- 아이디어·요청 (자유 입력, 500자): 지표 페이지에 이메일 없이 최신순으로 나와

쿠키는 쓰지 않아. 페이지를 열 때마다 새 익명 세션 ID를 만들어서 세션 단위로만 집계해.
유입 경로는 `?utm_source=reddit` 같은 링크 파라미터나 이전 사이트 주소로 기록돼.

## 배포 구성 (이미 완료)

1. **D1**: `hururuk` 데이터베이스 (북미 동부). ID는 wrangler.jsonc에 들어 있어. 테이블은 첫 요청 때 자동 생성돼.
2. **Worker**: GitHub `main` 브랜치에 푸시하면 Cloudflare가 `npx wrangler deploy`로 자동 배포해.
3. **STATS_KEY**: Worker → Settings → Variables and Secrets에 Secret으로 저장. 배포해도 안 지워져.
4. **도메인**: Worker → Settings → Domains & Routes → Custom domain → `hururuk.app`.

## 확인하는 법

hururuk.app에서 대기자 등록 → https://hururuk.app/stats.html 에서 STATS_KEY 입력 → 숫자가 올라가면 정상이야.

## 로컬에서 돌려보기

```bash
npm i -D wrangler
echo "STATS_KEY=testkey" > .dev.vars
npx wrangler dev
```

## 링크 공유할 때

채널별 성과를 보려면 링크 끝에 utm_source를 붙여서 공유해.

- Reddit: `https://hururuk.app/?utm_source=reddit`
- TikTok 쇼츠: `https://hururuk.app/?utm_source=tiktok`
- Instagram: `https://hururuk.app/?utm_source=instagram`

## 데이터 직접 보기

D1 콘솔에서 SQL로 바로 볼 수 있어.

```sql
SELECT * FROM waitlist ORDER BY joined_at DESC;
SELECT g.value, COUNT(*) FROM waitlist, json_each(waitlist.genres) g GROUP BY g.value;
SELECT name, COUNT(DISTINCT session) FROM events GROUP BY name;
```

## 참고

- 작품, 표지, 회차 내용은 전부 데모용 가상 콘텐츠야. 표지는 AI로 생성했어.
- 개인정보 문의: kaimjy@kaist.ac.kr
