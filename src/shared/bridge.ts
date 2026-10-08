import type { Request, Response, Snapshot } from './types';
import { errorText, t, setLanguage } from './i18n';
import { VERSION } from './version';
export async function send<T>(message: Request): Promise<T> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) throw new Error(t('unavailable'));
  const response: Response<T> = await chrome.runtime.sendMessage(message);
  if (!response?.ok) throw new Error(errorText(response?.error ?? 'page-unavailable'));
  if (message.type === 'snapshot' && (response.data as { version?: string })?.version !== VERSION) throw new Error(t('reloadExtension'));
  if (message.type === 'snapshot') setLanguage((response.data as Snapshot).global.language ?? 'auto');
  return response.data;
}
export function setupLanguage() {
  setLanguage();
}
