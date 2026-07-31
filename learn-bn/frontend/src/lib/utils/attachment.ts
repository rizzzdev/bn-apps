import { PUBLIC_API_URL } from '$env/static/public';
import { browser } from '$app/environment';

export function getAttachmentUrl(fileUrl?: string | null): string {
  if (!fileUrl) return '#';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  const filename = fileUrl.split(/[/\\]/).pop() || fileUrl;
  const baseUrl = browser ? '/api/v1' : PUBLIC_API_URL;
  return `${baseUrl}/attachments/file/${encodeURIComponent(filename)}`;
}
