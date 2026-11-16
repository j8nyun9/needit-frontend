# NEEDIT Frontend

참고 이미지 기반의 React 홈 화면입니다. 다크 테마, 반응형 레이아웃, 검색, 공감, 제보 모달, 프로젝트 상세를 제공합니다.

## 실행

이 폴더에서 아래 명령을 실행하세요.

```powershell
npm install
npm run dev
```

브라우저에서 http://127.0.0.1:5173 을 여세요.

```powershell
npm run build
npm run preview
```

## 주요 파일

- src/App.jsx: 홈 화면 및 데모 상호작용
- src/components/common/Icon.jsx: SVG 아이콘
- src/styles/global.css: 다크 테마 및 반응형 스타일
- src/main.jsx: React 진입점

## 현재 구현 범위

백엔드가 연결되지 않은 화면 데모입니다. 목록과 진행률은 예시 데이터이며 제보·공감은 메모리에서만 변경되어 새로고침하면 초기화됩니다.
로그인 및 알림은 안내 모달입니다. AI 생성·실제 프로젝트 데이터·회원 인증은 API 연결 후 구현해야 합니다.
외부 폰트·이미지를 다운로드하지 않고 시스템 폰트와 SVG로 구현했습니다.

.env.example의 VITE_API_BASE_URL은 추후 API 연결용이며 현재 화면에서는 사용하지 않습니다.
AI 비밀 키는 프론트 환경변수에 넣지 마세요.