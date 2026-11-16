# Frontend — React

- public: 정적 파일
- src/assets: 이미지·아이콘
- src/components/common: 공통 버튼·입력창 등
- src/layouts: 공통 레이아웃
- src/pages: 라우트별 페이지
- src/features/problems: 불편함 등록·목록·공감·댓글
- src/features/ideas: AI 아이디어 결과
- src/features/projects: 프로젝트 선택·상태·베타 링크
- src/features/feedback: 사용자 피드백
- 기능별 components: 전용 UI / api: 서버 요청 함수
- src/services: 공통 HTTP 클라이언트
- src/hooks, styles, utils: 공통 훅·스타일·유틸리티

## 초기 설정

Vite React 프로젝트를 별도 임시 폴더에서 생성한 뒤 이 폴더에 합치세요. JavaScript/TypeScript는 팀에서 결정하세요.
기존 폴더와 문서를 보존하고 package.json 등의 실행 파일을 추가하세요.
설정 완료 후 이 폴더에서 npm install, npm run dev로 실행합니다.
현재는 package.json이 없어 실행되지 않습니다.

.env.example을 .env.local로 복사하세요. VITE_ 변수는 브라우저에 공개됩니다. AI 비밀 키를 넣지 마세요.
백엔드 완성 전에는 노션의 공통 API 명세의 예시 응답으로 화면을 개발하세요.