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
  const { openMenuId, closeMenus } = useLibrary();

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-atlas-surface text-atlas-ink">
      <LibraryToolbar />

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
