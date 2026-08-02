import { useLibrary } from '@/context/LibraryContext';
import { AssetGrid } from './AssetGrid';
import { LibraryHeader } from './LibraryHeader';
import { LibrarySidebar } from './LibrarySidebar';
import { LibraryToolbar } from './LibraryToolbar';

/**
 * LibraryWindow
 * ---------------------------------------------------------
 * Collections & Tags — fills the Tauri window edge to edge. The design mock
 * framed the UI inside a drawn macOS window on a desk background; that framing
 * is dropped here because the OS window already provides it.
 */
export const LibraryWindow = () => {
  const { openMenuId, closeMenus, error, dismissError } = useLibrary();

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-atlas-surface text-atlas-ink">
      <LibraryToolbar />

      {/* A failed write has already been rolled back in the cache by the time
          this shows — the banner explains why the change reverted. */}
      {error && (
        <div className="flex flex-none items-center gap-3 border-b border-atlas-line-soft bg-destructive/10 px-6 py-2 text-[12.5px] text-atlas-ink">
          <span className="font-medium">Could not save</span>
          <span className="min-w-0 flex-1 truncate text-atlas-ink-3">{error}</span>
          <button
            type="button"
            onClick={dismissError}
            aria-label="Dismiss error"
            className="flex size-[18px] flex-none cursor-pointer items-center justify-center rounded-full bg-atlas-overlay text-[11px] leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <LibrarySidebar />

        <main className="flex min-w-0 flex-1 flex-col">
          <LibraryHeader />
          <AssetGrid />
        </main>
      </div>

      {/* Click-away backdrop for the open card menu */}
      {openMenuId !== null && <div className="absolute inset-0 z-10" onClick={closeMenus} />}
    </div>
  );
};
