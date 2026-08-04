import { PUBLIC_API_URL } from '$env/static/public';

export function getAttachmentUrl(fileUrl?: string | null): string {
  if (!fileUrl) return '#';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const filename = fileUrl.split(/[/\\]/).pop() || fileUrl;
  let raw = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  if (raw.endsWith('/learn')) {
    raw = raw.slice(0, -6).replace(/\/+$/, '');
  }
  const apiBase = raw.endsWith('/api/v1') ? raw : `${raw}/api/v1`;
  return `${apiBase}/learn/attachments/file/${encodeURIComponent(filename)}`;
}
