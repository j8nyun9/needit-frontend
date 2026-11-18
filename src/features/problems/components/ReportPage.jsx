import React, { useId, useRef, useState } from 'react';
import Icon from '../../../components/common/Icon.jsx';
import { normalizeProblemCategory, problemCategories } from '../../../services/problemCategories.js';
import './report-form.css';

const draftKey = 'needit-draft';
const titleLimit = 100;
const bodyLimit = 1000;
const sentences = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('ko', { granularity: 'sentence' })
  : null;

function getTitle(description) {
  const text = description.trim();
  const firstLine = text.split(/\r?\n/u, 1)[0];
  const firstSentence = sentences?.segment(text).containing(0)?.segment ??
    firstLine.match(/^.+?[.!?。！？](?=\s|$)/u)?.[0] ?? firstLine;
  return firstSentence.trim().replace(/(?<![.。])[.。]$/u, '')
    .slice(0, titleLimit).replace(/[\uD800-\uDBFF]$/u, '').trimEnd();
}

function hasText(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

function loadDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey));
    // Previous drafts stored the finished body or separate answers.
    const answers = [saved?.situation, saved?.desiredChange].filter(hasText).join('\n\n');
    return {
      description: [saved?.customBody, saved?.description, answers, saved?.title].find(hasText) ?? '',
      category: hasText(saved?.category) ? normalizeProblemCategory(saved.category) : '',
    };
  } catch {
    return { description: '', category: '' };
  }
}

export default function ReportPage({ onBack, onSubmit }) {
  const [draft, setDraft] = useState(loadDraft);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const id = useId();

  const { description, category } = draft;
  const title = getTitle(description);
  const tooLong = description.length > bodyLimit;
  const canSubmit = Boolean(category && title && !tooLong);

  function change(field, value) {
    setDraft(previous => ({ ...previous, [field]: value }));
    setMessage('');
    setError('');
  }

  function saveDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ ...draft, title }));
      setMessage('이 브라우저에 임시저장했어요.');
    } catch {
      setMessage('임시저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.');
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!canSubmit || submitting.current) return;

    submitting.current = true;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await onSubmit({ title, description, category });
      try { localStorage.removeItem(draftKey); } catch { /* The report was already saved. */ }
    } catch (error) {
      if (error.status === 401) saveDraft();
      setError(error.message || '제보 등록에 실패했어요. 다시 시도해주세요.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="wp-page report-page" aria-labelledby={id + '-heading'}>
      <button type="button" className="wp-back" disabled={saving} onClick={onBack}>← 불편함 탐색으로 돌아가기</button>
      <h1 id={id + '-heading'}>불편함 제보하기</h1>
      <div className="report-page__layout">
        <aside className="report-intro" aria-labelledby={id + '-intro'}>
          <p className="code-comment">// 새로운 불편함 제보하기</p>
          <h2 id={id + '-intro'}>일상 속 불편함을<br/><span>NEEDIT</span>에 알려주세요.</h2>
          <p className="report-intro__description">학교생활에서 겪는 작은 불편함도 좋은 아이디어의 시작이 될 수 있어요. 복잡하게 생각하지 말고, 편하게 알려주세요!</p>
          <section className="report-tips" aria-labelledby={id + '-tips'}>
            <h3 id={id + '-tips'}><Icon name="sparkles"/>이렇게 등록하면 더 좋아요!</h3>
            {[
              ['pencil', '무엇이 불편한가요?', '언제, 어떤 상황에서 불편했는지 알려주세요.'],
              ['users', '누구에게 필요한가요?', '나뿐만 아니라 다른 학생들도 겪는 문제인지 생각해보세요.'],
              ['sparkles', '어떤 변화가 있으면 좋을까요?', '꼭 해결 방법이 아니어도, 바라는 방향을 적어주면 더 도움이 돼요.'],
            ].map(([icon, heading, text]) => (
              <div className="report-tips__item" key={icon}>
                <span className="report-tips__icon"><Icon name={icon}/></span>
                <div><h4>{heading}</h4><p>{text}</p></div>
              </div>
            ))}
          </section>
        </aside>
      <form className="report-form" onSubmit={submit}>
        <div className="report-form__body">
          <label htmlFor={id + '-description'}>어떤 점이 불편했나요?</label>
          <p className="report-form__hint" id={id + '-hint'}>
            첫 문장이 제목이 돼요. 자세한 상황이나 바라는 변화가 있다면 이어서 적어주세요.
          </p>
          <textarea id={id + '-description'} name="description" rows={3} required maxLength={bodyLimit}
            value={description} disabled={saving} aria-invalid={tooLong}
            aria-describedby={id + '-hint ' + id + '-body-length'}
            onChange={event => change('description', event.target.value)}/>
          <div className="report-form__preview">
            <span>게시될 제목</span>
            <strong title={title}>{title || '첫 문장이 여기에 표시돼요.'}</strong>
          </div>
          <p className={'report-form__length' + (tooLong ? ' report-form__error' : '')}
            id={id + '-body-length'} role="status">
            {tooLong && '등록하려면 본문을 1,000자 이하로 줄여주세요. '}
            {description.length.toLocaleString('ko-KR')} / 1,000자
          </p>
        </div>

        <fieldset className="report-form__categories" disabled={saving}>
          <legend>카테고리</legend>
          <div className="report-form__chips">
            {problemCategories.map(({ name }) => (
              <label key={name} className="report-form__chip">
                <input type="radio" name="category" value={name} checked={category === name} required
                  onChange={() => change('category', name)}/>
                {name}<span aria-hidden="true" className="report-form__check">✓</span>
              </label>
            ))}
          </div>
        </fieldset>

        {message && <p className="report-form__hint" role="status">{message}</p>}
        {error && <p className="report-form__error" role="alert">{error}</p>}
        <div className="report-form__actions">
          <button type="button" className="button outline" disabled={saving} onClick={saveDraft}>임시저장</button>
          <button type="submit" className="button primary" disabled={!canSubmit || saving}>
            {saving ? '등록 중…' : '제보 등록하기'}
          </button>
        </div>
      </form>
      </div>
    </section>
  );
}
