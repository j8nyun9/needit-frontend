const otherCategory = '기타';

export const problemCategories = [
  { name: '시설·이동', example: '예: 강의실 콘센트 부족, 건물 길찾기, 셔틀버스 위치', situationExample: '강의실에 콘센트가 부족해요. 월요일 3교시 수업 중에 노트북을 충전하지 못했어요.', legacy: ['시설'] },
  { name: '수업·학습', example: '예: 과제 마감일 확인, 팀플 일정 조율, 도서관 빈 좌석', situationExample: '팀 과제 마감일을 확인하기 어려워요. 어제 팀원과 일정을 맞추면서 LMS와 단체 채팅방을 모두 확인했어요.', legacy: ['도서관'] },
  { name: '학사·행정', example: '예: 수강신청 절차, 졸업 요건, 통합 로그인·LMS 오류', situationExample: '수강신청 빈자리를 확인하기 어려워요. 정정 기간에 빈자리가 생겼는지 보려고 수강신청 페이지를 계속 새로고침했어요.' },
  { name: '편의·복지', example: '예: 학식 메뉴·혼잡도, 기숙사 생활, 학생 상담', situationExample: '학식 대기 시간을 미리 알기 어려워요. 어제 점심시간에 식당에 도착하고 나서야 줄이 길다는 걸 알았어요.' },
  { name: otherCategory, example: '위 네 가지에 해당하지 않는 불편함', situationExample: '분실물을 어디에 문의할지 알기 어려워요. 지난주 동아리 행사가 끝난 뒤 학생회관에서 우산을 잃어버렸어요.', legacy: ['학교생활'] },
];

const categoryNames = new Map(problemCategories.flatMap(({ name, legacy = [] }) =>
  [name, ...legacy].map(value => [value, name])
));

export function normalizeProblemCategory(value) {
  return categoryNames.get(value) ?? otherCategory;
}
