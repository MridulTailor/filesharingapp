import { useTheme } from '../context/useTheme';
import { Moon, Sun } from 'lucide-react';

export const Navbar = ({ showNewTransfer = false }: { showNewTransfer?: boolean }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <a href="/" className="brand-wordmark text-primary text-xl font-bold" aria-label="DropLink home">
        DropLink
      </a>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="text-secondary hover:text-primary grid h-10 w-10 place-items-center rounded-lg transition-colors hover:bg-[var(--bg-subtle)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </button>
        {showNewTransfer && (
          <a href="/" className="btn-secondary">
            New transfer
          </a>
        )}
      </div>
    </nav>
  );
};
