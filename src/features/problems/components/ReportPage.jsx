import React, { useEffect, useId, useRef, useState } from 'react';
import { normalizeProblemCategory, problemCategories } from '../../../services/problemCategories.js';
import './report-wizard.css';

const steps = [
  { name: '분류 선택', question: '어떤 종류의 불편함인가요?' },
  { name: '상황 설명', question: '언제, 어디서, 어떤 점이 불편했나요?' },
  { name: '확인 후 등록', question: '게시할 제보를 확인해주세요' },
];
const frequencies = ['한 번', '가끔', '자주'];
const draftKey = 'needit-draft';
const titleLimit = 100;
const bodyLimit = 1000;
const sentences = typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('ko', { granularity: 'sentence' }) : null;

function loadDraft() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(draftKey));
  } catch {
    saved = null;
  }

  const text = value => typeof value === 'string' ? value : '';
  const category = text(saved?.category);
  const situation = text(saved?.situation ?? saved?.description);
  const customTitle = saved?.customTitle;
  const maxStep = category ? (situation.trim() ? 2 : 1) : 0;
  return {
    category: category ? normalizeProblemCategory(category) : '',
    situation,
    frequency: frequencies.includes(saved?.frequency) ? saved.frequency : '',
    desiredChange: text(saved?.desiredChange),
    customTitle: typeof customTitle === 'string' || customTitle === null ? customTitle : text(saved?.title) || null,
    customBody: typeof saved?.customBody === 'string' ? saved.customBody : null,
    step: Number.isInteger(saved?.step) ? Math.min(Math.max(saved.step, 0), maxStep) : 0,
  };
}

function suggestTitle(situation) {
  const text = situation.trim();
  const firstLine = text.split(/\r?\n/u, 1)[0];
  const firstSentence = sentences?.segment(text).containing(0)?.segment ??
    firstLine.match(/^.+?[.!?。！？](?=\s|$)/u)?.[0] ?? firstLine;
  return firstSentence.trim().replace(/(?<![.。])[.。]$/u, '')
    .slice(0, titleLimit).replace(/[\uD800-\uDBFF]$/u, '').trimEnd();
}

function composeBody({ situation, frequency, desiredChange }) {
  return [
    situation.trim(),
    frequency && '발생 빈도 · ' + frequency,
    desiredChange.trim() && '바라는 변화 · ' + desiredChange.trim(),
  ].filter(Boolean).join('\n\n');
}

export default function ReportPage({ onBack, onSubmit }) {
  const [draft, setDraft] = useState(loadDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const submitting = useRef(false);
  const heading = useRef(null);
  const id = useId();

  const { step, situation, frequency, desiredChange, customTitle, customBody } = draft;
  const category = problemCategories.find(({ name }) => name === draft.category);
  const title = customTitle ?? suggestTitle(situation);
  const description = customBody ?? composeBody(draft);
  const lastStep = step === steps.length - 1;
  const titleTooLong = title.length > titleLimit;
  const bodyTooLong = description.length > bodyLimit;
  const canAdvance = [
    Boolean(category),
    Boolean(situation.trim()),
    Boolean(category && situation.trim() && title.trim() && description.trim() && !titleTooLong && !bodyTooLong),
  ][step];

  useEffect(() => { heading.current?.focus(); }, [step]);

  function change(field, value) {
    setDraft(previous => ({ ...previous, [field]: value }));
    setDraftMessage('');
    setError('');
  }

  function saveDraft() {
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
      setDraftMessage('이 브라우저에 임시저장했어요.');
    } catch {
      setDraftMessage('임시저장하지 못했어요. 브라우저 저장 공간을 확인해주세요.');
    }
  }

  async function advance(event) {
    event.preventDefault();
    if (!canAdvance || submitting.current) return;
    if (!lastStep) {
      change('step', step + 1);
      return;
    }

    submitting.current = true;
    setSaving(true);
    setError('');
    try {
      await onSubmit({ title, description, category: category.name });
      try { localStorage.removeItem(draftKey); } catch { /* The report was already saved. */ }
    } catch (error) {
      // Session expiry returns the user to login. Keep their draft available.
      if (error.status === 401) saveDraft();
      setError(error.message || '제보 등록에 실패했어요. 다시 시도해주세요.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <section className="wp-page report-wizard" aria-labelledby={id + '-question'}>
      <header className="report-wizard__header">
        <div className="report-wizard__progress-label">
          <span>{step + 1} / {steps.length} · {steps[step].name}</span>
          <button type="button" className="report-wizard__text-button" onClick={saveDraft} disabled={saving}>임시저장</button>
        </div>
        <progress aria-label="제보 작성 진행률" value={step + 1} max={steps.length}/>
        {draftMessage && <p className="report-wizard__hint" role="status">{draftMessage}</p>}
      </header>

      <form className="report-wizard__form" onSubmit={advance}>
        <h1 id={id + '-question'} ref={heading} tabIndex={-1}>
          {step === 1 ? <>
            <label htmlFor={id + '-situation'}>{steps[step].question}</label>
            <small className="report-wizard__required">필수</small>
          </> : steps[step].question}
        </h1>

        {step === 0 && (
          <fieldset className="report-wizard__choices" aria-labelledby={id + '-question'}>
            {problemCategories.map(({ name, example }, index) => (
              <label className="report-wizard__choice" key={name}>
                <input type="radio" name="category" value={name} checked={draft.category === name} required
                  onChange={() => change('category', name)}
                  aria-labelledby={id + '-category-' + index} aria-describedby={id + '-example-' + index}/>
                <span>
                  <strong id={id + '-category-' + index}>{name}</strong>
                  <span id={id + '-example-' + index}>{example}</span>
                </span>
                <span className="report-wizard__check" aria-hidden="true">✓</span>
              </label>
            ))}
          </fieldset>
        )}

        {step === 1 && <>
          <div className="report-wizard__field">
            <p className="report-wizard__guidance" id={id + '-situation-guide'}>
              첫 문장에 무엇이 불편했는지 적어주세요. 제목으로 자동 채워져요. 언제, 어디서 겪었는지는 이어서 적으면 돼요.
            </p>
            <p className="report-wizard__hint report-wizard__example" id={id + '-situation-example'}>
              <strong>예시</strong> {category?.situationExample}
            </p>
            <textarea id={id + '-situation'} name="situation" value={situation} rows={5} required
              maxLength={bodyLimit} onChange={event => change('situation', event.target.value)}
              aria-describedby={id + '-situation-guide ' + id + '-situation-example'}/>
          </div>
          <fieldset className="report-wizard__field">
            <legend>얼마나 자주 겪나요? <small>선택</small></legend>
            <div className="report-wizard__pills">
              {frequencies.map(value => (
                <button className="button outline" type="button" aria-pressed={frequency === value} key={value}
                  onClick={() => change('frequency', frequency === value ? '' : value)}>{value}</button>
              ))}
            </div>
          </fieldset>
          <div className="report-wizard__field">
            <label htmlFor={id + '-change'}>어떻게 바뀌면 좋을까요? <small>선택</small></label>
            <input id={id + '-change'} name="desiredChange" value={desiredChange} maxLength={200}
              onChange={event => change('desiredChange', event.target.value)}/>
          </div>
        </>}

        {lastStep && <>
          <div className="report-wizard__category-summary">
            <span>카테고리 <strong>{category?.name}</strong></span>
            <button className="report-wizard__text-button" type="button" disabled={saving}
              aria-label="카테고리 수정" onClick={() => change('step', 0)}>수정</button>
          </div>
          <div className="report-wizard__field">
            <label htmlFor={id + '-title'}>제목</label>
            <input id={id + '-title'} name="title" value={title} required maxLength={titleLimit} disabled={saving}
              aria-describedby={id + '-title-count'} aria-invalid={titleTooLong}
              onChange={event => change('customTitle', event.target.value)}/>
            <p className="report-wizard__count" id={id + '-title-count'}>{title.length} / 100자</p>
          </div>
          <div className="report-wizard__field">
            <div className="report-wizard__body-label">
              <label htmlFor={id + '-body'}>본문</label>
              <button className="report-wizard__text-button" type="button" disabled={saving}
                onClick={() => change('customBody', null)}>답변으로 본문 다시 채우기</button>
            </div>
            <textarea id={id + '-body'} name="description" value={description} rows={8} required
              maxLength={bodyLimit} disabled={saving} aria-describedby={id + '-body-count'} aria-invalid={bodyTooLong}
              onChange={event => change('customBody', event.target.value)}/>
            <p className={'report-wizard__count' + (bodyTooLong ? ' report-wizard__error' : '')}
              id={id + '-body-count'} role="status">
              {bodyTooLong && '등록하려면 본문을 1,000자 이하로 줄여주세요. '}
              {description.length.toLocaleString('ko-KR')} / 1,000자
            </p>
          </div>
        </>}

        {error && <p className="report-wizard__error" role="alert">{error}</p>}
        <div className="report-wizard__actions">
          <button className="button outline" type="button" disabled={saving}
            onClick={() => step === 0 ? onBack() : change('step', step - 1)}>이전</button>
          <button className="button primary" type="submit" disabled={!canAdvance || saving}>
            {saving ? '등록 중…' : lastStep ? '제보 등록하기' : '다음'}
          </button>
        </div>
      </form>
    </section>
  );
}
