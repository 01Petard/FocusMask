export function normalizeOrigin(value: string): string {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol)
    || ['chromewebstore.google.com', 'chrome.google.com', 'microsoftedge.microsoft.com'].includes(url.hostname)) {
    throw new Error('unsupported');
  }
  return url.origin;
}
export function originPattern(origin: string): string {
  const url = new URL(normalizeOrigin(origin));
  return `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}/*`;
}
export function permissionPattern(origin: string): string { return originPattern(origin); }
