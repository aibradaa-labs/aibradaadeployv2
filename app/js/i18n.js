// AI POD: i18n module
export const LANGS = ['en', 'ms'];
export function setLang(code) {
  if (!LANGS.includes(code)) code = 'en';
  localStorage.lang = code;
  document.documentElement.lang = code;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = window.I18N?.[code]?.[key] || el.textContent;
  });
}
window.setLang = setLang;
