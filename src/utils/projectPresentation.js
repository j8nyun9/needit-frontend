import {serviceUrl} from '../services/projects.js';

const seoulDate = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function projectDate() {
  return seoulDate.format();
}

export function projectDisplayStatus(project) {
 const value=project.release_status||project.status;
 return ['기획 중','개발 중','테스트 중','서비스 운영 중'].includes(value)?value:'기획 중';
}

export function isLinkedProject(project, problem) {
  return (problem.project_id != null && String(project.id) === String(problem.project_id))
    || (Array.isArray(project.problem_ids) && project.problem_ids.some(id => String(id) === String(problem.id)))
    || (project.related_problem_id != null && String(project.related_problem_id) === String(problem.id));
}

export function projectStatusClass(status) {
 return status==='서비스 운영 중'?'release-live':status==='기획 중'?'planning':'developing';
}
