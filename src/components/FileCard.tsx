
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
      <div className="group relative p-6 rounded-xl border border-border/50 card-gradient hover-lift animate-fade-in backdrop-blur-sm">
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
        
        <div className="relative">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <FileTypeIcon 
                filename={file.name} 
                mimeType={file.mime_type} 
                className="h-10 w-10 flex-shrink-0 transition-transform group-hover:scale-110 duration-300" 
              />
              {/* Icon glow effect */}
              <div className="absolute inset-0 rounded-full bg-current opacity-20 blur-lg scale-150 group-hover:opacity-30 transition-opacity duration-300" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate hover:text-primary transition-colors cursor-pointer group-hover:translate-x-1 duration-300" 
                  onClick={handlePreview}>
                {file.name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(file.created_at)}
                </span>
              </div>
              {isShared && (
                <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Shared with you
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons with staggered animation */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handlePreview}
              className="text-xs hover:scale-105 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:shadow-lg"
              style={{ transitionDelay: '50ms' }}
            >
              <Eye className="h-3 w-3 mr-1.5" />
              Preview
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDownload}
              className="text-xs hover:scale-105 hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:shadow-lg"
              style={{ transitionDelay: '100ms' }}
            >
              <Download className="h-3 w-3 mr-1.5" />
              Download
            </Button>
            {!isShared && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onDelete(file.id)}
                className="text-xs hover:scale-105 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 hover:shadow-lg"
                style={{ transitionDelay: '150ms' }}
              >
                <Trash2 className="h-3 w-3 mr-1.5" />
                Delete
              </Button>
            )}
          </div>
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
