# API 명세

Base URL: `http://localhost:4000`

인증이 필요한 엔드포인트는 `accessToken` httpOnly 쿠키가 자동으로 전송되어야 합니다.

---

## 인증 (Auth)

### 카카오 로그인 시작

```
GET /auth/kakao
```

카카오 로그인 페이지로 자동 리다이렉트됩니다. 브라우저에서 직접 접속합니다.

**응답**: 카카오 로그인 페이지로 302 리다이렉트

---

### 카카오 로그인 콜백

```
GET /auth/kakao/callback
```

카카오 서버에서 인가 코드를 전달하는 콜백 URL입니다. 직접 호출하지 않습니다.

**처리 흐름**
1. 카카오로부터 유저 정보 수신
2. DB에서 유저 확인 (최초 로그인 시 자동 회원가입)
3. JWT 발급 → `accessToken` 쿠키 저장
4. `CLIENT_URL`로 302 리다이렉트

**쿠키 설정**
| 이름 | 값 | 옵션 |
|------|-----|------|
| `accessToken` | JWT 토큰 | httpOnly, maxAge: 7일 |

---

### 내 정보 조회

```
GET /auth/me
```

> 인증 필요 (JWT 쿠키)

로그인한 유저의 DB 정보를 반환합니다.

**응답 예시**
```json
{
  "id": 1,
  "kakaoId": "1234567890",
  "name": "홍길동",
  "phone": null,
  "point": 150,
  "createdAt": "2026-03-01T00:00:00.000Z",
  "updatedAt": "2026-03-05T00:00:00.000Z"
}
```

**오류**
| 상태코드 | 설명 |
|---------|------|
| 401 | 쿠키 없음 또는 JWT 만료 |

---

## 미션 (Missions)

### 미션 목록 조회

```
GET /missions
```

전체 미션 목록을 최신순으로 반환합니다.

**응답 예시**
```json
[
  {
    "id": 1,
    "title": "SNS 구독하면 응모권+120P 획득",
    "description": "인스타그램 팔로우 후 완료 처리",
    "rewardPoint": 120,
    "rewardTicket": 1,
    "missionUrl": "https://instagram.com/salda",
    "isActive": true,
    "createdAt": "2026-03-01T00:00:00.000Z",
    "updatedAt": "2026-03-01T00:00:00.000Z"
  }
]
```

---

### 미션 단건 조회

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
  "id": 1,
  "title": "SNS 구독하면 응모권+120P 획득",
  "description": "인스타그램 팔로우 후 완료 처리",
  "rewardPoint": 120,
  "rewardTicket": 1,
  "missionUrl": "https://instagram.com/salda",
  "isActive": true,
  "createdAt": "2026-03-01T00:00:00.000Z",
  "updatedAt": "2026-03-01T00:00:00.000Z"
}
```

**오류**
| 상태코드 | 설명 |
|---------|------|
| 404 | 해당 ID의 미션 없음 |

---

### 미션 생성 (관리자용)

```
POST /missions
Content-Type: application/json
```

**요청 본문**
```json
{
  "title": "미션 제목",
  "description": "미션 설명",
  "rewardPoints": 100
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `title` | string | O | 미션 제목 |
| `description` | string | O | 미션 설명 |
| `rewardPoints` | number | O | 지급 포인트 |

**응답**: 생성된 미션 객체

---

### 미션 완료 처리

```
POST /missions/complete
Content-Type: application/json
```

유저가 미션을 완료했을 때 완료 기록을 저장합니다. 같은 유저가 같은 미션을 중복 완료할 수 없습니다.

**요청 본문**
```json
{
  "userId": 1,
  "missionId": 2
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `userId` | number | O | 유저 ID |
| `missionId` | number | O | 완료할 미션 ID |

**응답 예시**
```json
{
  "id": 10,
  "userId": 1,
  "missionId": 2,
  "completedAt": "2026-03-05T14:30:00.000Z"
}
```

**오류**
| 상태코드 | 설명 |
|---------|------|
| 404 | 해당 미션 없음 |
| 409 | 이미 완료한 미션 |

---

### 유저별 완료 미션 목록

```
GET /missions/user/:userId
```

특정 유저가 완료한 미션 목록을 반환합니다. 미션 상세 정보를 포함합니다.

**경로 파라미터**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `userId` | number | 유저 ID |

**응답 예시**
```json
[
  {
    "id": 10,
    "userId": 1,
    "missionId": 2,
    "completedAt": "2026-03-05T14:30:00.000Z",
    "mission": {
      "id": 2,
      "title": "SNS 구독하면 응모권+120P 획득",
      "rewardPoint": 120,
      "rewardTicket": 1
    }
  }
]
```

> **주의**: 컨트롤러에서 `GET /missions/:id`가 `GET /missions/user/:userId`보다 먼저 선언되어 있습니다.  
> `/missions/user/1` 요청 시 `:id`에 `"user"`가 매칭되어 `ParseIntPipe` 오류가 발생할 수 있습니다.  
> 라우트 순서를 `user/:userId` → `:id` 순으로 변경하는 것을 권장합니다.
