import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/cn';

export function ThemeToggle() {
  const { setMode, resolved } = useTheme();

  const toggleTheme = () => {
    setMode(resolved === 'dark' ? 'light' : 'dark');
  };

  const ActiveIcon = resolved === 'dark' ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md',
        'text-muted-foreground hover:text-foreground hover:bg-surface-hover',
        'transition-colors',
      )}
    >
      <ActiveIcon className="h-5 w-5" />
    </button>
  );
}
