import { PUBLIC_API_URL } from '$env/static/public';

export function getAttachmentUrl(fileUrl?: string | null): string {
  if (!fileUrl) return '#';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const filename = fileUrl.split(/[/\\]/).pop() || fileUrl;
  const baseUrl = (PUBLIC_API_URL || 'http://localhost:3000/api/v1').replace(/\/+$/, '');
  const cleanBaseUrl = baseUrl.endsWith('/learn') ? baseUrl.slice(0, -6) : baseUrl;
  return `${cleanBaseUrl}/learn/attachments/file/${encodeURIComponent(filename)}`;
}
