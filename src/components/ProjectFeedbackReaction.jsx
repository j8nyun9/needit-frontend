import React, {useState} from 'react';

export default function ProjectFeedbackReaction({projectId, feedbackId, userId}) {
  const key = `needit:feedback-reaction:${projectId}:${feedbackId}:${userId ?? 'guest'}`;
  const [reaction, setReaction] = useState(() => {
    try { return localStorage.getItem(key); } catch { return null; }
  });
  const [error, setError] = useState(false);

  function toggle(value) {
    const next = reaction === value ? null : value;
    try {
      if (next) localStorage.setItem(key, next);
      else localStorage.removeItem(key);
      setReaction(next);
      setError(false);
    } catch {
      setError(true);
    }
  }

  return <div className="release-actions" role="group" aria-label="이용 의견 반응 (이 브라우저)">
    {[['like', '공감'], ['dislike', '싫어요']].map(([value, label]) =>
      <button key={value} type="button" className={`button ${reaction === value ? 'primary' : 'outline'}`}
        aria-pressed={reaction === value} onClick={() => toggle(value)}>{label}</button>
    )}
    <small>반응은 이 브라우저에 저장돼요.</small>
    {error && <p role="alert">반응을 저장하지 못했어요.</p>}
  </div>;
}
