# SALDA Server

미션 리워드 기반 청약 응모 플랫폼 **SALDA**의 백엔드 API 서버.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | NestJS 11 (MVC, 모듈 기반) |
| 언어 | TypeScript 5 |
| DB | PostgreSQL + Prisma 7 |
| 인증 | Passport.js · 카카오 OAuth 2.0 · JWT HttpOnly Cookie |
| 파일 스토리지 | Cloudflare R2 (S3 호환, presigned URL 방식) |
| 유효성 검사 | class-validator · ValidationPipe (전역) |

## 주요 도메인

| 모듈 | 설명 |
|------|------|
| `auth` | 카카오/애플 OAuth, JWT 발급·검증 |
| `missions` | 미션 목록·완료 처리, 포인트/응모권 지급, 10회 보너스 |
| `subscriptions` | 전세·차량 청약 응모, 점유율 계산 |
| `products` | 쇼핑 상품 목록·포인트 구매 |
| `admin` | 어드민 인증(role: ADMIN), 회원·청약·배너 관리 |
| `upload` | R2 presigned URL 발급 |

## 실행

```bash
npm install
npm run start:dev   # 개발 (http://localhost:4000)
npm run build && npm run start:prod
```

## 공통 응답 포맷

```json
{ "status": "success" | "error", "data": {}, "message": "..." }
```
