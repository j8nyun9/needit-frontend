import {serviceUrl} from '../services/projects.js';

const seoulDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function projectDate() {
  return seoulDate.format();
}

function dayNumber(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const time = Date.parse(date);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date
    ? time / 86400000 : NaN;
}

export function displayedProgress(project, date = projectDate()) {
  const value = Number(project.progress);
  const progress = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  const start = dayNumber(project.progress_started_on);
  const end = dayNumber(project.expected_completion_date);
  const today = dayNumber(date);
  if (![start, end, today].every(Number.isFinite) || end < start || today < start) return progress;
  if (today >= end) return 100;
  return Math.floor(progress + (100 - progress) * (today - start) / (end - start));
}

export function projectDisplayStatus(project, progress = displayedProgress(project)) {
  if (project.status === '서비스 운영 중' && serviceUrl(project.deployment_url)) return project.status;
  return progress === 100 ? '배포 대기' : project.status || '기획 중';
}

export function isLinkedProject(project, problem) {
  return (problem.project_id != null && String(project.id) === String(problem.project_id))
    || (Array.isArray(project.problem_ids) && project.problem_ids.some(id => String(id) === String(problem.id)))
    || (project.related_problem_id != null && String(project.related_problem_id) === String(problem.id));
}
