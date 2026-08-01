import { LibraryWindow } from '@/components/library/LibraryWindow';
import { LibraryProvider } from '@/context/LibraryContext';
import { ThemeProvider } from '@/context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <LibraryProvider>
        <LibraryWindow />
      </LibraryProvider>
    </ThemeProvider>
  );
}

export default App;
