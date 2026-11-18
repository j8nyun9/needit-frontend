const otherCategory = '기타';

export const problemCategories = [
  { name: '시설·이동', example: '예: 강의실 콘센트 부족, 건물 길찾기, 셔틀버스 위치', legacy: ['시설'] },
  { name: '수업·학습', example: '예: 과제 마감일 확인, 팀플 일정 조율, 도서관 빈 좌석', legacy: ['도서관'] },
  { name: '학사·행정', example: '예: 수강신청 절차, 졸업 요건, 통합 로그인·LMS 오류' },
  { name: '편의·복지', example: '예: 학식 메뉴·혼잡도, 기숙사 생활, 학생 상담' },
  { name: otherCategory, example: '위 네 가지에 해당하지 않는 불편함', legacy: ['학교생활'] },
];

const categoryNames = new Map(problemCategories.flatMap(({ name, legacy = [] }) =>
  [name, ...legacy].map(value => [value, name])
));

export function normalizeProblemCategory(value) {
  return categoryNames.get(value) ?? otherCategory;
}
