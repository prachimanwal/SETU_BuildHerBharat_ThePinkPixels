import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleButtonProps {
  className?: string;
}

export const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';

  return (
    <button
      type="button"
      onClick={() => void toggleTheme()}
      title={label}
      aria-label={label}
      className={`p-2.5 rounded-2xl bg-[#F8FCFF] dark:bg-[#263449] hover:bg-[#EAF7FF] dark:hover:bg-[#334155] border border-[#D8ECFA] dark:border-[#334155] text-[#475569] dark:text-[#FBBF24] hover:text-[#1E3A5F] dark:hover:text-[#F1F5F9] transition-colors focus:outline-none ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </button>
  );
};
