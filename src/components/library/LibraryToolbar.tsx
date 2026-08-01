import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * LibraryToolbar
 * ---------------------------------------------------------
 * App toolbar across the top of the vault. The traffic lights and window title
 * from the design mock are intentionally absent — Tauri supplies a real OS
 * window, so drawing a fake one on top of it would double up the chrome.
 */
export const LibraryToolbar = () => {
  const { resolvedTheme, toggleTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex h-[52px] flex-none items-center justify-end gap-2 border-b border-atlas-line-soft bg-atlas-chrome px-4">
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex size-[26px] cursor-pointer items-center justify-center rounded-md border border-atlas-line bg-atlas-elevated text-atlas-ink-2 transition-colors duration-150 hover:bg-atlas-elevated-hover"
      >
        {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      </button>

      <div className="flex h-[26px] items-center rounded-md border border-atlas-line bg-atlas-elevated px-[11px] text-[12.5px] font-medium text-atlas-ink-2">
        Import
      </div>
    </div>
  );
};
