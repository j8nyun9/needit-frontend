export function issueShareUrl(id) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('issue', String(id));
  return url.href;
}

export function copyIssueLink(id) {
  return navigator.clipboard.writeText(issueShareUrl(id));
}
