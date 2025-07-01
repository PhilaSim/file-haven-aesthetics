
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FileSearchProps {
  onSearch: (query: string) => void;
  onFilter: (filter: string) => void;
  currentFilter: string;
}

export const FileSearch: React.FC<FileSearchProps> = ({ 
  onSearch, 
  onFilter, 
  currentFilter 
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const filterOptions = [
    { value: 'all', label: 'All Files' },
    { value: 'images', label: 'Images' },
    { value: 'documents', label: 'Documents' },
    { value: 'videos', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'archives', label: 'Archives' },
    { value: 'code', label: 'Code Files' },
  ];

  const getCurrentFilterLabel = () => {
    return filterOptions.find(option => option.value === currentFilter)?.label || 'All Files';
  };

  return (
    <div className="flex gap-3 items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {getCurrentFilterLabel()}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {filterOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onFilter(option.value)}
              className={currentFilter === option.value ? 'bg-accent' : ''}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
