type ThemePreference = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'free-router-theme';
const normalizePreference = (value: string | null | undefined): ThemePreference =>
  value === 'light' || value === 'dark' ? value : 'system';

export function initThemeControls() {
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const pickers = document.querySelectorAll<HTMLDetailsElement>('[data-theme-picker]');
  let preference = normalizePreference(root.dataset.themePreference);

  const applyTheme = () => {
    const dark = preference === 'dark' || (preference === 'system' && systemTheme.matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.themePreference = preference;
    root.style.colorScheme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111116' : '#f9f9fc');

    pickers.forEach((picker) => {
      const trigger = picker.querySelector<HTMLElement>('.theme-trigger');
      picker.querySelectorAll<HTMLButtonElement>('[data-theme-choice]').forEach((button) => {
        const selected = button.dataset.themeChoice === preference;
        button.setAttribute('aria-pressed', String(selected));
        if (selected && trigger) {
          const label = button.querySelector('span')?.textContent || preference;
          const currentLabel = trigger.querySelector('.theme-current-label');
          if (currentLabel) currentLabel.textContent = label;
          trigger.setAttribute('aria-label', `${trigger.dataset.themeLabel}: ${label}`);
          trigger.title = label;
        }
      });
      picker.querySelectorAll<HTMLElement>('[data-theme-icon]').forEach((icon) => {
        icon.hidden = icon.dataset.themeIcon !== preference;
      });
    });
  };

  pickers.forEach((picker) => {
    const trigger = picker.querySelector<HTMLElement>('.theme-trigger');
    picker.querySelectorAll<HTMLButtonElement>('[data-theme-choice]').forEach((button) => {
      button.addEventListener('click', () => {
        preference = normalizePreference(button.dataset.themeChoice);
        // The choice still works in memory when browser storage is unavailable.
        try { localStorage.setItem(STORAGE_KEY, preference); } catch { /* Storage is optional. */ }
        applyTheme();
        picker.open = false;
        trigger?.focus();
      });
    });
    picker.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        picker.open = false;
        trigger?.focus();
      }
    });
  });
  document.addEventListener('click', (event) => {
    pickers.forEach((picker) => {
      if (event.target instanceof Node && !picker.contains(event.target)) picker.open = false;
    });
  });
  systemTheme.addEventListener('change', () => {
    if (preference === 'system') applyTheme();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      preference = normalizePreference(event.newValue);
      applyTheme();
    }
  });
  applyTheme();
}
