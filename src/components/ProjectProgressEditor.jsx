import React, {useRef, useState} from 'react';
import {saveProjectProgress} from '../services/projects.js';
import {displayedProgress, projectDate} from '../utils/projectPresentation.js';

export default function ProjectProgressEditor({project, onSaved, today = projectDate()}) {
  const [draft, setDraft] = useState(null);
  const [date, setDate] = useState(project.expected_completion_date ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);

  const current = displayedProgress(project, today);
  const value = draft ?? String(current);
  const progress = Number(value);
  const dateChanged = date !== (project.expected_completion_date ?? '');
  const changed = dateChanged || progress !== current;
  const valid = value.trim() !== '' && Number.isInteger(progress) && progress >= 0 && progress <= 100
    && (!date || date >= today);

  async function save(event) {
    event.preventDefault();
    if (lock.current || !valid || !changed) return;
    lock.current = true;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await saveProjectProgress(project.id, {
        progress, expected_completion_date: date || null, progress_started_on: date ? today : null,
      });
      onSaved(updated);
      setDraft(null);
      setDate(updated.expected_completion_date ?? '');
      setMessage('진행 현황을 저장했어요.');
    } catch (error) {
      setError(error.message);
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  return <form className="release-progress-editor" onSubmit={save} aria-busy={saving}>
    <fieldset disabled={saving}>
      <label>진행률 (%)<input type="number" min={0} max={100} step={1} required value={value}
        onChange={event => setDraft(event.target.value)} /></label>
      <label>개발 완료 예정일<input type="date" min={date && !dateChanged && date < today ? date : today}
        value={date} onChange={event => setDate(event.target.value)} /></label>
      <p className="wp-demo">현재 진행률부터 매일 예상 진행률이 올라가고, 한국 시간 기준 완료 예정일에 100%가 돼요.</p>
      <button className="button outline" type="submit" disabled={!valid || !changed || saving}>
        {saving ? '저장 중…' : '진행 현황 저장'}
      </button>
    </fieldset>
    {message && <p role="status">{message}</p>}
    {error && <p className="release-error" role="alert">{error}</p>}
  </form>;
}
