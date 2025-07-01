
import React from 'react';
import { FileItem } from '@/types';
import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';

interface FileCardProps {
  file: FileItem;
  onDelete: (fileId: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onDelete }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="group p-4 border rounded-lg hover:shadow-md transition-all duration-300 hover:scale-[1.02] bg-card">
      <div className="flex items-start gap-3">
        <File className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{file.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {formatFileSize(file.size)} • {formatDate(file.uploadDate)}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleDownload}
          className="text-xs"
        >
          Download
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={() => onDelete(file.id)}
          className="text-xs"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
