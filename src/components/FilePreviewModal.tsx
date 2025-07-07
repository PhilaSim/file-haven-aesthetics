
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileItem } from '@/types';
import { Download, X } from 'lucide-react';

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload,
}) => {
  if (!file) return null;

  const isImage = file.mime_type.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';
  const isText = file.mime_type.startsWith('text/') || file.name.endsWith('.txt');

  const renderPreview = () => {
    if (isImage && file.public_url) {
      return (
        <div className="flex justify-center">
          <img
            src={file.public_url}
            alt={file.name}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📄</div>
          <p className="text-muted-foreground">PDF preview not available</p>
          <p className="text-sm text-muted-foreground mt-2">Click download to view the file</p>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📄</div>
        <p className="text-muted-foreground">Preview not available for this file type</p>
        <p className="text-sm text-muted-foreground mt-2">Click download to view the file</p>
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{file.name}</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Size:</span>
                <p className="text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <p className="text-muted-foreground">{file.mime_type}</p>
              </div>
              <div>
                <span className="font-medium">Uploaded:</span>
                <p className="text-muted-foreground">
                  {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={onDownload} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card rounded-lg p-6 border">
            {renderPreview()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
