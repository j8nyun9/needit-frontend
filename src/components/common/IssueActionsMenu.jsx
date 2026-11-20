import React, { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { copyIssueLink, issueShareUrl } from './IssueShare.jsx';
import ProblemDeleteDialog from './ProblemDeleteDialog.jsx';

export default function IssueActionsMenu({ problem, onEdit, canDelete, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const container = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector('button')?.focus();
    function closeOutside(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      trigger.current?.focus();
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  async function share() {
    setOpen(false);
    trigger.current?.focus();
    try {
      await copyIssueLink(problem.id);
      setShareStatus('copied');
    } catch {
      setShareStatus('manual');
    }
  }

  return <div className="wp-issue-more" ref={container}>
    <button type="button" className="wp-issue-more-trigger" ref={trigger} aria-label="더보기"
      aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => { setShareStatus(''); setOpen(previous => !previous); }}>
      <span aria-hidden="true">⋮</span>
    </button>
    {open && <div className="wp-issue-menu" id={menuId} ref={menu}>
      {onEdit && <button type="button" onClick={onEdit}>수정<Icon name="pencil" size={18}/></button>}
      {canDelete && <button type="button" className="wp-issue-menu-danger"
        onClick={() => { setOpen(false); setDeleting(true); }}>삭제<Icon name="trash" size={18}/></button>}
      <button type="button" onClick={share}>URL 공유<Icon name="link" size={18}/></button>
    </div>}
    <span className="wp-share-status" role="status">{shareStatus === 'copied' && '링크를 복사했어요.'}</span>
    {shareStatus === 'manual' && <label className="wp-share-manual">
      제보 링크를 선택해서 복사하세요.
      <input readOnly value={issueShareUrl(problem.id)} onFocus={event => event.target.select()}/>
    </label>}
    {deleting && canDelete && <ProblemDeleteDialog problem={problem} onDeleted={onDeleted}
      onClose={() => { setDeleting(false); trigger.current?.focus(); }}/>}
  </div>;
}
