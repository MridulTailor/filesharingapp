import { useTheme } from '../context/useTheme';
import { ArrowUpRight, Moon, Sun } from 'lucide-react';

export const Navbar = ({ showNewTransfer = false }: { showNewTransfer?: boolean }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <a href="/" className="group flex items-center gap-3" aria-label="DropLink home">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#67d8cc]/30 bg-[#67d8cc]/10 text-[#67d8cc] light:border-[#147c72]/30 light:bg-[#147c72]/10 light:text-[#147c72]">
          <ArrowUpRight size={18} strokeWidth={1.5} />
        </span>
        <span className="text-primary text-base font-semibold tracking-tight">DropLink</span>
      </a>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="text-secondary hover:text-primary grid h-10 w-10 place-items-center rounded-lg transition-colors light:hover:bg-[#e9ece5]"
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
