import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { GridBackground } from './components/GridBackground';
import { Navbar } from './components/Navbar';
import { DownloadPage } from './components/DownloadPage';
import { Home } from './pages/Home';
import './index.css';

const fileMatch = window.location.pathname.match(/^\/files\/([^/]+)\/?$/);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <div className="surface-page relative flex min-h-screen flex-col">
        <GridBackground />
        <div className="relative z-10 flex flex-1 flex-col">
          <Navbar showNewTransfer={Boolean(fileMatch)} />
          <main className="flex w-full flex-1 justify-center px-4 sm:px-6 lg:px-8">
            {fileMatch ? <DownloadPage uuid={decodeURIComponent(fileMatch[1])} /> : <Home />}
          </main>
        </div>
      </div>
    </ThemeProvider>
  </StrictMode>,
);
