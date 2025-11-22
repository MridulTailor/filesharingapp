import { Link } from '@tanstack/react-router';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <nav className="w-full max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:from-cyan-300 group-hover:to-blue-400 transition-all">
          DropLink
        </span>
      </Link>
      
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '🌞' : '🌙'}
        </button>
        <Link to="/upload">
          <button className="btn-secondary text-sm px-4 py-2">
            Upload
          </button>
        </Link>
      </div>
    </nav>
  );
};
