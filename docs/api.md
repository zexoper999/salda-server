# SALDA API 명세

- **Base URL (개발):** `http://localhost:4000`
- **인증 방식:** JWT — `accessToken` httpOnly 쿠키 자동 전송
- **공통 응답 포맷:**
  ```json
  { "status": "success" | "error", "data": {}, "message": "..." }
  ```

---

## 목차

1. [인증 (Auth)](#1-인증-auth)
2. [미션 (Missions)](#2-미션-missions)
3. [청약 (Subscriptions)](#3-청약-subscriptions) — 예정
4. [쇼핑 (Products)](#4-쇼핑-products) — 예정
5. [어드민 (Admin)](#5-어드민-admin) — 예정

---

## 1. 인증 (Auth)

### 1-1. 카카오 로그인 시작

```
GET /auth/kakao
```

브라우저에서 직접 접속 시 카카오 로그인 페이지로 자동 리다이렉트됩니다.

| 항목 | 내용 |
|------|------|
| 인증 | 불필요 |
| 응답 | 302 → 카카오 로그인 페이지 |

---

### 1-2. 카카오 로그인 콜백

```
GET /auth/kakao/callback
```

카카오 인가 코드를 수신하는 콜백입니다. 직접 호출하지 않습니다.

**처리 흐름**
1. 카카오로부터 유저 정보 수신
2. DB 유저 확인 (최초 로그인 → 자동 회원가입)
3. JWT 발급 → `accessToken` httpOnly 쿠키 저장 (7일)
4. `CLIENT_URL` 로 302 리다이렉트

---

### 1-3. 내 정보 조회

```
GET /auth/me
```

| 항목 | 내용 |
|------|------|
| 인증 | 필요 🔐 |

**응답 예시**
```json
{
  "id": 1,
  "kakaoId": "1234567890",
  "appleId": null,
  "name": "홍길동",
  "phone": null,
  "birthYear": 1995,
  "point": 300,
  "ticket": 5,
  "role": "USER",
  "createdAt": "2026-03-01T00:00:00.000Z",
  "updatedAt": "2026-04-01T00:00:00.000Z"
}
```

**오류**

| 코드 | 설명 |
|------|------|
| 401 | 쿠키 없음 또는 JWT 만료 |

---

## 2. 미션 (Missions)

> 모든 미션 API는 JWT 인증이 필요합니다 🔐

### 2-1. 전체 미션 목록

```
GET /missions
```

활성화(`ACTIVE`) 미션 전체를 **랜덤 순서**로 반환합니다.  
각 미션에 오늘 이미 완료했는지 여부(`completedToday`)를 포함합니다.

**응답 예시**
```json
{
  "status": "success",
  "data": [
    {
      "id": 3,
      "category": "SNS_SUBSCRIBE",
      "status": "ACTIVE",
      "title": "인스타그램 팔로우하고 응모권 획득",
      "oneLineDesc": "팔로우 후 스크린샷 인증",
      "rewardPoint": 120,
      "rewardTicket": 1,
      "ageRestriction": false,
      "isFirstCome": false,
      "completedToday": false
    }
  ]
}
```

---

### 2-2. 선착순 미션 목록

```
GET /missions/first-come
```

선착순(`isFirstCome: true`) 미션 목록을 반환합니다.  
남은 자리 수(`remainCount`)와 오늘 완료 여부를 포함합니다.

**응답 예시**
```json
{
  "status": "success",
  "data": [
    {
      "id": 7,
      "title": "오늘의 선착순 미션",
      "limitCount": 100,
      "completedCount": 42,
      "remainCount": 58,
      "completedToday": false
    }
  ]
}
```

---

### 2-3. 미션 단건 조회

```
GET /missions/:id
```

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 미션 ID |

**응답 예시**
```json
{
  "status": "success",
  "data": {
    "id": 3,
    "category": "PAGE_VISIT",
    "status": "ACTIVE",
    "title": "살다 홈페이지 방문하기",
    "description": "살다 홈페이지를 방문하고 완료 처리하세요.",
    "missionUrl": "https://salda.kr",
    "rewardPoint": 50,
    "rewardTicket": 0,
    "ageRestriction": false,
    "completedToday": true
  }
}
```

**오류**

| 코드 | 설명 |
|------|------|
| 404 | 미션 없음 |

---

### 2-4. 미션 완료 처리

```
POST /missions/:id/complete
```

미션 완료를 기록하고 포인트·응모권을 지급합니다.

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `id` | number | 미션 ID |

**요청 본문** — 없음 (userId는 JWT에서 추출)

**응답 예시**
```json
{
  "status": "success",
  "data": {
    "pointEarned": 120,
    "ticketEarned": 1,
    "bonusTicket": 0,
    "totalPoint": 420,
    "totalTicket": 6
  },
  "message": "미션을 완료했습니다."
}
```

**10회 달성 보너스 응답 예시**
```json
{
  "status": "success",
  "data": {
    "pointEarned": 120,
    "ticketEarned": 1,
    "bonusTicket": 3,
    "totalPoint": 540,
    "totalTicket": 14
  },
  "message": "미션 완료! 10회 달성 보너스 응모권 3장이 추가 지급되었습니다."
}
```

**오류**

| 코드 | 설명 |
|------|------|
| 400 | 진행 중인 미션 아님 / 기간 외 |
| 403 | 만 19세 미만 / 생년 미등록 |
| 404 | 미션 없음 |
| 409 | 오늘 이미 완료 / 선착순 마감 |

---

### 2-5. 내 미션 완료 내역

```
GET /missions/my/completed
```

로그인한 유저의 전체 미션 완료 내역을 최신순으로 반환합니다.

**응답 예시**
```json
{
  "status": "success",
  "data": [
    {
      "id": 10,
      "missionId": 3,
      "completedAt": "2026-04-03T14:30:00.000Z",
      "mission": {
        "id": 3,
        "title": "인스타그램 팔로우하고 응모권 획득",
        "category": "SNS_SUBSCRIBE",
        "rewardPoint": 120,
        "rewardTicket": 1
      }
    }
  ]
}
```

---

### 2-6. 미션 생성 (어드민 임시)

```
POST /missions
Content-Type: application/json
```

> ⚠️ Phase 6 어드민 구현 전 임시 엔드포인트입니다. AdminGuard로 교체 예정.

**요청 본문**

| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| `category` | `SNS_SUBSCRIBE \| PAGE_VISIT \| TAG_FIND` | O | 미션 카테고리 |
| `title` | string | O | 미션 제목 |
| `oneLineDesc` | string | — | 한 줄 설명 |
| `description` | string | — | 상세 설명 |
| `imageUrl` | string | — | 썸네일 이미지 URL (R2) |
| `publisher` | string | — | 발주처 |
| `missionUrl` | string | — | 미션 수행 링크 |
| `rewardPoint` | number | — | 지급 포인트 (기본 0) |
| `rewardTicket` | number | — | 지급 응모권 조각 (기본 0) |
| `ageRestriction` | boolean | — | 만 19세 미만 제한 (기본 false) |
| `isFirstCome` | boolean | — | 선착순 여부 (기본 false) |
| `limitCount` | number | — | 선착순 최대 수 |
| `startAt` | ISO8601 | — | 시작일 |
| `endAt` | ISO8601 | — | 종료일 |

**응답 예시**
```json
{
  "status": "success",
  "data": {
    "id": 5,
    "category": "SNS_SUBSCRIBE",
    "title": "유튜브 구독하고 응모권 획득",
    "rewardPoint": 80,
    "rewardTicket": 1
  }
}
```

---

## 3. 청약 (Subscriptions)

> 🚧 Phase 3 구현 예정

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /subscriptions` | 청약 목록 (전세/차량 필터) |
| `GET /subscriptions/:id` | 청약 상세 + 내 점유율 |
| `POST /subscriptions/:id/enter` | 청약 응모 (응모권 차감) |
| `GET /subscriptions/my/entries` | 내 응모 내역 |

---

## 4. 쇼핑 (Products)

> 🚧 Phase 4 구현 예정

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /products` | 상품 목록 (카테고리 필터) |
| `GET /products/:id` | 상품 상세 |
| `POST /products/:id/purchase` | 포인트로 구매 (환불 불가) |
| `GET /products/my/purchases` | 내 구매 내역 |

---

## 5. 어드민 (Admin)

> 🚧 Phase 6 구현 예정 — AdminGuard 적용

| 엔드포인트 | 설명 |
|-----------|------|
| `GET /admin/users` | 회원 목록 |
| `PATCH /admin/users/:id/point` | 포인트 수동 조정 |
| `GET /admin/missions` | 미션 목록 |
| `PATCH /admin/missions/:id/status` | 미션 상태 변경 |
| `GET /admin/subscriptions` | 청약 목록 |
| `POST /admin/subscriptions` | 청약 등록 |
| `GET /admin/products` | 상품 목록 |
| `GET /admin/products/purchases` | 전체 구매 내역 |
| `GET /admin/notices` | 공지사항 CRUD |
| `GET /admin/faqs` | FAQ CRUD |
| `GET /admin/inquiries` | 문의 목록/답변 |
