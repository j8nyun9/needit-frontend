import React, { useState } from 'react';

export function issueShareUrl(id) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('issue', String(id));
  return url.href;
}

export default function IssueShare({ id }) {
  const [status, setStatus] = useState('');
  const url = issueShareUrl(id);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setStatus('복사됨');
    } catch {
      setStatus('manual');
    }
  }

  return (
    <>
      <button type="button" className="button outline wp-share" onClick={copyLink}>
        링크 복사
      </button>
      <span role="status" className="wp-share-status">
        {status === '복사됨' && '제보 링크를 복사했어요.'}
      </span>
      {status === 'manual' && (
        <label className="wp-share-manual">
          제보 링크를 선택해서 복사하세요.
          <input readOnly value={url} onFocus={event => event.target.select()} />
        </label>
      )}
    </>
  );
}
