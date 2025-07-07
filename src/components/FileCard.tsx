
import React, { useState } from 'react';
import { FileItem } from '@/types';
import { Button } from '@/components/ui/button';
import { FileTypeIcon } from './FileTypeIcon';
import { FilePreviewModal } from './FilePreviewModal';
import { Eye, Download, Trash2 } from 'lucide-react';

interface FileCardProps {
  file: FileItem;
  onDelete: (fileId: string) => void;
  isShared?: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({ file, onDelete, isShared = false }) => {
  const [showPreview, setShowPreview] = useState(false);

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
    if (file.public_url) {
      const link = document.createElement('a');
      link.href = file.public_url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  return (
    <>
      <div className="group p-4 border rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 bg-card animate-fade-in">
        <div className="flex items-start gap-3">
          <FileTypeIcon 
            filename={file.name} 
            mimeType={file.mime_type} 
            className="h-8 w-8 flex-shrink-0 mt-1" 
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate hover:text-primary transition-colors cursor-pointer" 
                onClick={handlePreview}>
              {file.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {formatFileSize(file.size)} • {formatDate(file.created_at)}
            </p>
            {isShared && (
              <p className="text-xs text-blue-600 mt-1">Shared with you</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handlePreview}
            className="text-xs hover:scale-105 transition-transform"
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleDownload}
            className="text-xs hover:scale-105 transition-transform"
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          {!isShared && (
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onDelete(file.id)}
              className="text-xs hover:scale-105 transition-transform"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <FilePreviewModal
        file={file}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={handleDownload}
      />
    </>
  );
};
