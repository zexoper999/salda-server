# 데이터베이스 스키마

ORM: Prisma 7  
DB: PostgreSQL  
클라이언트 출력 경로: `generated/prisma`

---

## 모델 관계도

```
User ──────────── UserMission ──────────── Mission
 1                    N:1                    1
 └── userMissions[]               userMissions[]
```

`UserMission`은 `User`와 `Mission` 사이의 N:M 중간 테이블입니다.  
`@@unique([userId, missionId])` 제약으로 같은 유저가 같은 미션을 중복 완료할 수 없습니다.

---

## User

유저 정보를 저장하는 테이블입니다. 카카오 로그인 시 자동 생성됩니다.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, autoincrement | 내부 고유 ID |
| `kakaoId` | String | unique | 카카오 고유 식별자 |
| `name` | String | | 이름 (카카오 프로필에서 가져옴) |
| `phone` | String? | nullable | 전화번호 |
| `point` | Int | default: 0 | 보유 포인트 |
| `createdAt` | DateTime | default: now() | 가입일 |
| `updatedAt` | DateTime | @updatedAt | 최종 수정일 |

**관계**
- `userMissions`: `UserMission[]` — 완료한 미션 목록

---

## Mission

미션 정보를 저장하는 테이블입니다.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, autoincrement | 미션 고유 ID |
| `title` | String | | 미션 제목 (예: "SNS 구독하면 응모권+120P 획득") |
| `description` | String? | nullable | 미션 상세 설명 |
| `rewardPoint` | Int | default: 0 | 완료 시 지급 포인트 |
| `rewardTicket` | Int | default: 0 | 완료 시 지급 응모권 조각 수 |
| `missionUrl` | String? | nullable | 미션 수행 링크 (SNS 주소 등) |
| `isActive` | Boolean | default: true | 미션 활성화 여부 (false면 숨김 처리) |
| `createdAt` | DateTime | default: now() | 생성일 |
| `updatedAt` | DateTime | @updatedAt | 최종 수정일 |

**관계**
- `userMissions`: `UserMission[]` — 이 미션을 완료한 유저 목록

---

## UserMission

유저-미션 완료 기록을 저장하는 중간 테이블입니다.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, autoincrement | 고유 ID |
| `userId` | Int | FK → User.id | 완료한 유저 |
| `missionId` | Int | FK → Mission.id | 완료한 미션 |
| `completedAt` | DateTime | default: now() | 완료 시각 |

**유니크 제약**
```
@@unique([userId, missionId])
```
같은 유저가 같은 미션을 두 번 완료할 수 없습니다. 중복 완료 시도 시 서비스 레이어에서 `409 Conflict`를 반환합니다.

**관계**
- `user`: `User` — 완료한 유저 정보
- `mission`: `Mission` — 완료한 미션 정보

---

## Prisma 설정

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}
```

- `moduleFormat = "cjs"`: CommonJS 형식으로 클라이언트 생성
- `output`: 프로젝트 루트 기준 `generated/prisma` 경로에 클라이언트 생성

---

## 마이그레이션 명령어

```bash
# 마이그레이션 파일 생성 및 적용 (개발)
npx prisma migrate dev --name 마이그레이션명

# 프로덕션 마이그레이션 적용
npx prisma migrate deploy

# 클라이언트 재생성 (스키마 변경 후)
npx prisma generate

# DB 상태 GUI로 확인
npx prisma studio
```
