import type { LanguagePreference } from './types';
const en = {
  language: 'Language', languageAuto: 'Follow browser', languageHelp: 'Chinese browser languages use simplified Chinese; all others use English.', currentPage: 'Current page', unsupportedTitle: 'This page cannot be modified', supportedHint: 'Open a website to get started', privacyNote: 'Local rules only.', cleanPopupHelp: 'Hide elements matched by saved rules.', mediaPopupHelp: 'Click or hover to reveal.', privacyPopupHelp: 'Temporarily reveal the page.',
  tagline: 'Make every page yours.', siteSettings: 'This website', clean: 'Hide elements', media: 'Blur media', privacy: 'Blur page',
  cleanHelp: 'Remove distractions with saved rules.', mediaHelp: 'Blur images and videos until you choose to view them.', privacyHelp: 'Blur the page with a temporary reveal when needed.',
  enableSite: 'Enable this website', authorized: 'Authorized', unauthorized: 'Not authorized', unsupported: 'This page is not supported. Open a regular HTTP or HTTPS webpage.',
  pick: 'Select an element', protect: 'Enable page blur', disableProtect: 'Disable page blur', unlock: 'Temporarily show page', settings: 'Settings', manage: 'Manage rules', rules: 'Saved rules',
  revealTrigger: 'Temporary reveal', triggerClick: 'Click to reveal', triggerHover: 'Hover to reveal', revealHelp: 'Choose how to view blurred content. Move away before hovering again.', revealClick: 'Click to show', revealHover: 'Hover to show',
  timing: 'Timing & feedback', timingHelp: 'Times are in milliseconds. Changes apply to your open pages.', revealDuration: 'Automatically blur again', hoverDelay: 'Hover activation delay', toastDuration: 'Notice duration', undoDuration: 'Undo availability', motionDuration: 'Switch animation', applyTiming: 'Save timing settings',
  websiteIntro: 'Choose a website to manage its visual rules.', generalIntro: 'Set your preferred interaction and timing once for all websites.', authorLink: 'Created by 01Petard', reloadExtension: 'The settings and background are different versions. Reload FocusMask in the browser extension manager, then refresh this page.', 'page-reload-required': 'This page still uses an older FocusMask script. Refresh the webpage to apply this update.',
  saved: 'Saved', loading: 'Loading…', working: 'Working…', paused: 'FocusMask is paused. Resume it in Settings.',
  websites: 'Websites', general: 'General', addSite: 'Add website', siteUrl: 'Website URL', addProtect: 'Protect on every visit', add: 'Authorize & add',
  empty: 'Your websites, your rules.', emptyHelp: 'Enable a website from the toolbar, or add one here before your next visit.',
  siteEnabled: 'Apply saved settings', restore: 'Restore website', restoreElements: 'Restore all elements', deleteSite: 'Delete website & revoke access',
  deleteConfirm: 'Delete this website and all its rules, and revoke its access?', delete: 'Delete', enabled: 'Enabled', noRules: 'No hidden elements yet. Select an element from the toolbar to create a rule.',
  global: 'Enable FocusMask', globalHelp: 'Pausing restores every page and keeps your saved rules.', shortcuts: 'Quick protection', configureShortcut: 'Configure shortcut', unassigned: 'Not assigned — configure in your browser',
  localOnly: 'Everything stays on your device.', privacyStatement: 'Rules are stored locally. No browsing logs, page uploads, accounts or third-party services.',
  version: 'Version', pickInstruction: 'Choose an element to hide', cancel: 'Cancel', back: 'Choose another', saveRule: 'Save rule', matched: 'Matching elements', unstable: 'This structural rule may stop matching if the page layout changes.',
  multi: 'This rule matches multiple elements. Confirm to hide all of them.', confirmMulti: 'Hide all matching elements', undo: 'Undo', hidden: 'Element hidden',
  reveal: 'Click to show', protected: 'This page is blurred', initFailed: 'Blur is active, but settings could not be loaded. Retry from the toolbar or temporarily show the page.',
  denied: 'Website access was declined. Try Enable this website again.', 'page-unavailable': 'The page could not be reached. Reload it and try again.',
  'registration-failed': 'Automatic protection could not be registered. Your change was reverted.', 'config-invalid': 'Saved settings are invalid. Protection remains active; restore your local configuration.',
  'request-invalid': 'This operation is no longer valid. Reload the page and try again.', 'selector-invalid': 'This selector is invalid. Choose another element.',
  'selector-unsafe': 'The page root or extension controls cannot be hidden.', 'rule-exists': 'This rule already exists.', 'rule-missing': 'This rule has already been removed.',
  unavailable: 'Extension APIs are unavailable. Load the built dist folder as an unpacked extension.', permanent: 'Site settings', active: 'Active', off: 'Off',
  resume: 'Resume FocusMask', protectedHint: 'Page content is blurred. Other modes remain active during temporary reveals.', browserSettings: 'Browser settings',
  revoked: 'Access has been revoked. Authorize this website again to apply its rules.', grant: 'Authorize again', close: 'Close',
} as const;
const zh: Record<keyof typeof en, string> = {
  language: '界面语言', languageAuto: '跟随浏览器', languageHelp: '简中、繁中统一显示简体中文，其他语言显示英语。', currentPage: '当前页面', unsupportedTitle: '这个页面暂不支持', supportedHint: '打开网页即可开始', privacyNote: '规则仅存本地。', cleanPopupHelp: '隐藏已保存规则命中的元素。', mediaPopupHelp: '点击或悬停，按需临时查看。', privacyPopupHelp: '保持整页模糊，按需临时查看。',
  tagline: '让每个网页由你掌控。', siteSettings: '当前网站设置', clean: '元素过滤', media: '媒体模糊', privacy: '整页模糊',
  cleanHelp: '用已保存的规则隐藏干扰元素。', mediaHelp: '模糊图片和视频，按需临时查看。', privacyHelp: '保持整页模糊，需要时临时显示。',
  enableSite: '启用此网站', authorized: '已授权', unauthorized: '未授权', unsupported: '此页面不支持。请打开普通 HTTP 或 HTTPS 网页。',
  pick: '选择网页元素', protect: '启用整页模糊', disableProtect: '关闭整页模糊', unlock: '临时显示页面', settings: '扩展设置', manage: '管理规则', rules: '已保存规则',
  revealTrigger: '临时显示方式', triggerClick: '点击解除模糊', triggerHover: '悬停解除模糊', revealHelp: '选择查看模糊内容的方式。再次悬停查看前，请先移开鼠标。', revealClick: '点击显示', revealHover: '悬停显示',
  timing: '时间与反馈', timingHelp: '时间单位为毫秒，保存后会应用到已打开的网页。', revealDuration: '自动恢复模糊', hoverDelay: '悬停触发延迟', toastDuration: '提示显示时长', undoDuration: '撤销操作时长', motionDuration: '开关动画时长', applyTiming: '保存时间设置',
  websiteIntro: '选择一个网站，管理它的视觉规则。', generalIntro: '统一设置查看方式和时间，让每个网站遵循你的习惯。', authorLink: '作者 01Petard', reloadExtension: '配置页与后台版本不一致。请在浏览器扩展管理页重新加载 FocusMask，再刷新本页。', 'page-reload-required': '此网页仍在运行旧版 FocusMask 脚本，请刷新网页以应用更新。',
  saved: '已保存', loading: '加载中…', working: '处理中…', paused: 'FocusMask 已暂停，请在设置中恢复启用。',
  websites: '网站管理', general: '通用设置', addSite: '添加网站', siteUrl: '网站网址', addProtect: '每次访问时保护整页', add: '授权并添加',
  empty: '你的网页，你的规则。', emptyHelp: '从工具栏启用当前网站，或在这里提前添加网站。',
  siteEnabled: '应用已保存配置', restore: '恢复网站全部视觉修改', restoreElements: '恢复全部元素', deleteSite: '删除网站并撤销授权',
  deleteConfirm: '删除此网站和全部规则，并撤销访问权限？', delete: '删除', enabled: '启用', noRules: '还没有隐藏规则。从工具栏选择网页元素即可创建。',
  global: '启用 FocusMask', globalHelp: '暂停后恢复所有页面，并保留已保存的规则。', shortcuts: '快速遮挡', configureShortcut: '配置快捷键', unassigned: '未绑定，请在浏览器中配置',
  localOnly: '所有配置都留在你的设备上。', privacyStatement: '规则仅保存在本地。不记录浏览日志，不上传页面，不需要账号或第三方服务。',
  version: '版本', pickInstruction: '选择要隐藏的元素', cancel: '取消', back: '返回选择', saveRule: '保存规则', matched: '匹配元素数量', unstable: '此规则依赖页面结构，布局变化后可能失效。',
  multi: '此规则匹配多个元素，确认后将全部隐藏。', confirmMulti: '隐藏全部匹配元素', undo: '撤销', hidden: '已隐藏',
  reveal: '点击显示', protected: '此页面已模糊', initFailed: '模糊已启用，但无法读取配置。请从工具栏重试，或主动临时显示页面。',
  denied: '网站授权被拒绝，请重新点击「启用此网站」。', 'page-unavailable': '无法连接此页面，请刷新后重试。',
  'registration-failed': '无法注册自动保护脚本，已撤回本次配置修改。', 'config-invalid': '本地配置无效，保护仍保持启用，请修复本地配置。',
  'request-invalid': '此操作已失效，请刷新后重试。', 'selector-invalid': '选择器无效，请重新选择元素。',
  'selector-unsafe': '不能隐藏页面根节点或扩展控件。', 'rule-exists': '此规则已存在。', 'rule-missing': '此规则已被删除。',
  unavailable: '扩展 API 不可用，请将构建后的 dist 目录加载为已解压扩展。', permanent: '网站配置', active: '已启用', off: '已关闭',
  resume: '恢复启用 FocusMask', protectedHint: '页面内容已模糊，临时显示期间其他模式仍然有效。', browserSettings: '浏览器设置',
  revoked: '访问权限已撤销，请重新授权此网站以应用规则。', grant: '重新授权', close: '关闭',
};
export type TextKey = keyof typeof en;
let preference: LanguagePreference = 'auto';
const listeners = new Set<(value: LanguagePreference) => void>();
function browserLanguage(): string {
  return typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage ? chrome.i18n.getUILanguage() : navigator.language;
}
export function resolveLanguage(value: LanguagePreference, browser = browserLanguage()): 'zh-CN' | 'en' {
  if (value !== 'auto') return value;
  return /^zh(?:-|$)/i.test(browser) ? 'zh-CN' : 'en';
}
export function getLanguage() { return preference; }
export function setLanguage(value: LanguagePreference = 'auto', updateDocument = true) {
  preference = value;
  if (updateDocument) {
    document.documentElement.lang = resolveLanguage(value);
    if (location.pathname.endsWith('/options/index.html')) document.title = `FocusMask · ${t('settings')}`;
  }
  listeners.forEach(listener => listener(value));
}
export function subscribeLanguage(listener: (value: LanguagePreference) => void) {
  listeners.add(listener); return () => { listeners.delete(listener); };
}
export function t(key: TextKey, language = resolveLanguage(preference)): string {
  return /^zh(?:-|$)/i.test(language) ? zh[key] : en[key];
}
export function errorText(code: string) { return code in en ? t(code as TextKey) : t('page-unavailable'); }
