# FE 팀원 협업 세팅 가이드

날짜: 2026년 5월 15일

대상: 팀원

기술 스택: Vue 3 · Pinia · Vue Router · Axios · ECharts · Vite · Tailwind CSS v4
IDE: IntelliJ IDEA

---

## 사전 준비

아래 항목이 모두 설치되어 있어야 합니다.

| 항목 | 권장 버전 | 확인 방법 |
|---|---|---|
| Node.js | v20 이상 | `node -v` |
| Git | 최신 | `git -v` |
| IntelliJ IDEA | 최신 | — |

---

## 1. GitHub Collaborator 수락

팀장에게 GitHub 초대를 요청하거나, 이메일로 받은 초대 링크를 수락합니다.

`https://github.com/SF-KONA/SCADA-frontend` 에 접근 가능한지 확인하세요.

---

## 2. 레포지토리 클론

IntelliJ 내장 터미널 또는 외부 터미널에서 실행합니다.

```bash
git clone https://github.com/SF-KONA/SCADA-frontend.git
cd scada-frontend
```

---

## 3. IntelliJ에서 프로젝트 열기

1. `File → Open`
2. 클론한 `scada-frontend` 폴더 선택
3. **Trust Project** 선택 후 열기

---

## 4. IntelliJ 플러그인 설치

`Settings → Plugins → Marketplace`에서 아래 2개를 설치합니다.

| 플러그인 | 용도 |
|---|---|
| Vue.js | Vue SFC 문법 지원 |
| Tailwind CSS | 클래스 자동완성 |

설치 후 IntelliJ를 재시작합니다.

---

## 5. Node.js 인터프리터 설정

`Settings → Languages & Frameworks → Node.js`에서 Node 경로가 잡혀 있는지 확인합니다.

---

## 6. 의존성 설치

```bash
npm install
```

---

## 7. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다. (`.env.example` 참고)

```bash
cp .env.example .env
```

`.env` 파일을 열어 서버 주소를 확인 및 수정합니다.

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_BASE_URL=ws://localhost:8080
```

> `.env` 파일은 Git에 올라가지 않습니다. 팀원 각자 설정해야 합니다.

---

## 8. 개발 서버 실행 확인

```bash
npm run dev
```

브라우저에서 `http://localhost:xxxx` 접속 후 정상 동작을 확인합니다.

---

## 9. 작업 브랜치 생성

**작업 시작 전 반드시 dev 브랜치를 최신화한 후 분기합니다.**

```bash
git checkout dev
git pull origin dev
git checkout -b feat/fe-{작업내용}
```

브랜치 이름 예시:

```
feat/fe-dashboard-kpi
feat/fe-user-management
fix/fe-login-redirect
```

---

## 10. 작업 → 커밋 → PR

```bash
# 작업 후 커밋
git add .
git commit -m "feat: 대시보드 KPI 카드 구현"

# push
git push origin feat/fe-{작업내용}
```

GitHub에서 **Pull Request 생성** — 대상 브랜치는 반드시 `dev`

**PR 제목 형식:** `[FE] feat: 대시보드 KPI 카드 구현`

**PR 본문 필수 항목:**
1. 작업 내용
2. 관련 화면 / API
3. 테스트 방법 또는 실행 결과
4. 주의할 점 (있다면)

---

## 커밋 메시지 규칙

| 타입 | 용도 | 예시 |
|---|---|---|
| `feat` | 새 기능 | `feat: 사용자 목록 테이블 구현` |
| `fix` | 버그 수정 | `fix: 로그인 후 리다이렉트 오류 수정` |
| `style` | 포맷팅 (기능 무관) | `style: 들여쓰기 통일` |
| `refactor` | 구조 개선 | `refactor: API 호출 composable로 분리` |
| `chore` | 설정, 패키지 | `chore: axios 버전 업데이트` |
| `docs` | 문서 | `docs: 컴포넌트 주석 추가` |

---

## 주의사항

- `main`, `dev` 브랜치에 **직접 push 금지** — PR을 통해서만 반영
- 작업 전 항상 `git pull origin dev`로 최신 상태 유지
- 브랜치는 **반나절~1일 단위**로 짧게 유지, 2일 이상 끌지 않기
- PR 머지 후 작업 브랜치 즉시 삭제

---

## 코드 컨벤션 (Code Conventnion)

### 1. 네이밍 규칙 (Naming Convention)

- 클래스 명
    - PascalCase `UserProcessor`, `CalculateVision`
- 변수/ 함수 명
    - camelCase `userName`, `imageData`
- 상수(Constant)
    - SCREAMING_SNAKE_CASE `MAX_BUFFER_SIZE`, `PI`
- 폴더
    - kebab-case controllers, services
- 파일
    - frontEnd .js 파일은 camelCase `userApi.js`
    - frontEnd .vue 파일은 PascalCase `StatusBadge.vue`
    - BackEnd는 PascalCase  UserController.java
- DB 테이블/ 컬럼
    - snake_case inspection_results
- API 경로명
    - 소문자 + kebab_case /api/posts

### 2. 들여쓰기 및 공백 (Indentation & Spacing)

- **들여쓰기 단위**: 보통 **Space 4칸**을 표준으로 설정.
- **중괄호(`{ }`) 위치**:
    - **K&R 스타일**: 줄 끝에 시작 괄호.

---
