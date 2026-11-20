import React, { useEffect, useId, useRef, useState } from 'react';
import { deleteProblem } from '../../services/problems.js';
import './problem-delete.css';

export default function ProblemDeleteDialog({ problem, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const lock = useRef(false);
  const heading = useId();
  const description = useId();

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  async function confirm() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await deleteProblem(problem.id);
      onDeleted(problem.id);
    } catch (error) {
      setError(error.message || '불편함을 삭제하지 못했어요. 다시 시도해주세요.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function cancel() {
    if (lock.current) return;
    dialog.current?.close();
    onClose();
  }

  return <dialog ref={dialog} className="problem-delete-dialog" aria-labelledby={heading}
    aria-describedby={description}
    onCancel={event => { event.preventDefault(); cancel(); }}
    onClick={event => { if (event.target === event.currentTarget) cancel(); }}>
    <div className="problem-delete-content">
      <h2 id={heading}>이 불편함을 삭제하시겠습니까?</h2>
      <p className="problem-delete-title">{problem.title}</p>
      <p id={description}>삭제한 글은 되돌릴 수 없어요. 공감, 댓글, 개인 AI 기획안도 함께 삭제돼요. 연결된 프로젝트는 유지돼요.</p>
      {error && <p className="problem-delete-error" role="alert">{error}</p>}
      <div className="problem-delete-actions">
        <button type="button" className="button outline" disabled={busy} onClick={cancel}>취소</button>
        <button type="button" className="button problem-delete-confirm" disabled={busy} onClick={confirm}>{busy ? '삭제 중…' : '확인'}</button>
      </div>
    </div>
  </dialog>;
}
