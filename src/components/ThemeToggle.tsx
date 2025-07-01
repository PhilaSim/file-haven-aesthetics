
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Toggle } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const getNextTheme = () => {
    switch (theme) {
      case 'light': return 'dark';
      case 'dark': return 'neo';
      case 'neo': return 'light';
      default: return 'light';
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'neo': return <Toggle className="h-4 w-4" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(getNextTheme())}
      className="transition-all duration-300 hover:scale-105"
    >
      {getIcon()}
    </Button>
  );
};
