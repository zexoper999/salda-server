# salda-server

살다 서비스의 백엔드 API 서버입니다.  
카카오 소셜 로그인, JWT 인증, 미션 시스템(포인트·응모권 지급)을 제공합니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | NestJS 11 |
| 언어 | TypeScript 5 |
| 데이터베이스 | PostgreSQL |
| ORM | Prisma 7 |
| 인증 | Passport.js (카카오 OAuth 2.0 + JWT) |
| 쿠키 파싱 | cookie-parser |

## 프로젝트 구조

```
src/
├── auth/
│   ├── strategies/
│   │   ├── kakao.strategy.ts   # 카카오 OAuth 전략
│   │   └── jwt.strategy.ts     # JWT 쿠키 검증 전략
│   ├── auth.controller.ts      # /auth 라우트
│   ├── auth.service.ts         # 유저 검증·JWT 발급
│   └── auth.module.ts
├── users/
│   ├── users.service.ts        # 유저 DB 조회·생성
│   └── users.module.ts
├── missions/
│   ├── dto/
│   │   ├── create-mission.dto.ts
│   │   └── complete-mission.dto.ts
│   ├── missions.controller.ts  # /missions 라우트
│   ├── missions.service.ts     # 미션 비즈니스 로직
│   └── missions.module.ts
├── prisma.service.ts           # PrismaClient 래퍼
├── app.module.ts
└── main.ts
prisma/
└── schema.prisma               # DB 스키마 정의
```

## 시작하기

### 사전 요구사항

- Node.js 20+
- PostgreSQL 15+
- [카카오 개발자 앱](https://developers.kakao.com) 등록

### 설치

```bash
npm install
```

### 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다.

```env
# 데이터베이스
DATABASE_URL="postgresql://유저:비밀번호@localhost:5432/DB명?schema=public"

# 카카오 OAuth
KAKAO_CLIENT_ID="카카오_REST_API_키"
KAKAO_CALLBACK_URL="http://localhost:4000/auth/kakao/callback"

# JWT
JWT_SECRET="안전한_비밀키"
JWT_EXPIRES_IN="7d"

# 프론트엔드 주소 (로그인 완료 후 리다이렉트)
CLIENT_URL="http://localhost:3000"
```

> `KAKAO_CLIENT_ID`는 카카오 개발자 콘솔 → 앱 키 → **REST API 키**를 사용합니다.

### 카카오 개발자 콘솔 설정

1. [카카오 개발자](https://developers.kakao.com) → 내 애플리케이션 선택
2. **앱 설정 → 플랫폼**: Web 플랫폼에 `http://localhost:4000` 추가
3. **제품 설정 → 카카오 로그인**: 활성화 ON
4. **제품 설정 → 카카오 로그인 → Redirect URI**: `http://localhost:4000/auth/kakao/callback` 추가

### 데이터베이스 마이그레이션

```bash
# 마이그레이션 실행
npx prisma migrate dev

# Prisma 클라이언트 생성
npx prisma generate
```

### 서버 실행

```bash
# 개발 모드 (파일 변경 감지)
npm run start:dev

# 프로덕션 빌드 및 실행
npm run build
npm run start:prod
```

서버는 **http://localhost:4000** 에서 실행됩니다.

## API 개요

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/auth/kakao` | 카카오 로그인 시작 | - |
| GET | `/auth/kakao/callback` | 카카오 콜백 처리 | - |
| GET | `/auth/me` | 내 정보 조회 | JWT 필요 |
| GET | `/missions` | 미션 목록 조회 | - |
| GET | `/missions/:id` | 미션 단건 조회 | - |
| POST | `/missions` | 미션 생성 | - |
| POST | `/missions/complete` | 미션 완료 처리 | - |
| GET | `/missions/user/:userId` | 유저별 완료 미션 목록 | - |

자세한 API 명세는 [docs/api.md](./docs/api.md)를 참고하세요.

## 데이터베이스 스키마

자세한 스키마 설명은 [docs/schema.md](./docs/schema.md)를 참고하세요.

## 인증 흐름

```
1. 클라이언트 → GET /auth/kakao
2. 서버 → 카카오 로그인 페이지로 리다이렉트
3. 사용자가 카카오 로그인 완료
4. 카카오 → GET /auth/kakao/callback?code=...
5. 서버: 카카오에서 유저 정보 수신
6. 서버: DB에서 유저 확인 (없으면 자동 회원가입)
7. 서버: JWT 발급 → accessToken 쿠키 저장 (httpOnly, 7일)
8. 서버 → CLIENT_URL 로 리다이렉트
9. 이후 API 요청 시 쿠키의 accessToken 자동 전송
```

## 스크립트

```bash
npm run start:dev    # 개발 서버 (watch 모드)
npm run start:debug  # 디버그 모드
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사 및 자동 수정
npm run test         # 유닛 테스트
npm run test:e2e     # E2E 테스트
npm run test:cov     # 커버리지 리포트
```
