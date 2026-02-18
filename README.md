# SUB.TRACK - 구독 관리 서비스 배포 가이드

## 📁 프로젝트 구조

```
subscription-manager/
├── public/
│   └── index.html          # 프론트엔드 (싱글 페이지)
├── functions/
│   └── api/
│       ├── subscriptions.js          # GET(목록), POST(추가)
│       └── subscriptions/
│           └── [id].js               # GET/PUT/DELETE (개별 관리)
├── wrangler.toml                     # Cloudflare 설정
└── README.md
```

## 🚀 배포 방법

### 1단계: KV Namespace 생성

```bash
# Wrangler CLI 설치 (없으면)
npm install -g wrangler

# Cloudflare 로그인
wrangler login

# KV namespace 생성
wrangler kv namespace create "SUBSCRIPTIONS"
# 출력된 id를 복사해둡니다
```

### 2단계: wrangler.toml 수정

`wrangler.toml` 파일에서 `YOUR_KV_NAMESPACE_ID`를 실제 ID로 교체:

```toml
[[kv_namespaces]]
binding = "SUBSCRIPTIONS"
id = "실제_KV_NAMESPACE_ID"
```

### 3단계: 로컬 테스트

```bash
# 프로젝트 폴더에서
wrangler pages dev ./public --kv SUBSCRIPTIONS
```

브라우저에서 `http://localhost:8788` 접속

### 4단계: Cloudflare Pages 배포

**방법 A: CLI로 직접 배포**
```bash
wrangler pages deploy ./public --project-name subscription-manager
```

**방법 B: GitHub 연동 (권장)**
1. GitHub 저장소에 푸시
2. Cloudflare Dashboard > Pages > Create a project
3. GitHub 저장소 연결
4. Build 설정:
   - Framework preset: None
   - Build command: (비워두기)
   - Build output directory: `public`

### 5단계: KV 바인딩 설정 (Dashboard)

Pages 배포 후 Dashboard에서:
1. Pages 프로젝트 > Settings > Functions
2. KV namespace bindings에서:
   - Variable name: `SUBSCRIPTIONS`
   - KV namespace: 위에서 생성한 namespace 선택
3. Save

## 🌐 커스텀 도메인 연결 (추후)

1. Cloudflare Dashboard > Pages > 프로젝트 선택
2. Custom domains > Set up a custom domain
3. 도메인 입력 (예: `subs.yourdomain.com`)
4. Cloudflare가 자동으로 DNS 레코드 추가
5. SSL 인증서 자동 발급 (몇 분 소요)

> 💡 도메인 구매 후 Cloudflare에 네임서버를 연결하면 가장 간편합니다.
> Cloudflare Registrar에서 직접 도메인을 구매할 수도 있습니다.

## 🔧 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/subscriptions` | 전체 구독 목록 |
| POST | `/api/subscriptions` | 구독 추가 |
| GET | `/api/subscriptions/:id` | 구독 상세 |
| PUT | `/api/subscriptions/:id` | 구독 수정 |
| DELETE | `/api/subscriptions/:id` | 구독 삭제 |

### 요청 바디 예시 (POST/PUT)

```json
{
  "name": "Netflix",
  "price": 17000,
  "cycle": "monthly",
  "category": "entertainment",
  "billingDay": 15,
  "emoji": "🎬",
  "color": "#e17055",
  "memo": "프리미엄 요금제"
}
```

## 📝 참고사항

- **무료 티어**: Cloudflare Pages 무료, KV 무료 (하루 10만 읽기, 1천 쓰기)
- **인증 없음**: 현재 공개 API이므로, 필요시 Cloudflare Access로 인증 추가 가능
- **데이터**: 모든 구독 데이터는 KV의 `subs` 키 하나에 JSON 배열로 저장
- **제한**: 단일 KV 값 최대 25MB (구독 수천 개까지 충분)
