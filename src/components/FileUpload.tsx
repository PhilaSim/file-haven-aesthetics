
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { FileItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUploaded: (file: FileItem) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;

    setIsUploading(true);
    
    for (const file of acceptedFiles) {
      try {
        // Create file URL for preview (in a real app, you'd upload to a server)
        const fileUrl = URL.createObjectURL(file);
        
        const newFile: FileItem = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString(),
          userId: user.id,
          url: fileUrl,
        };

        // Store file metadata in localStorage
        const userFiles = JSON.parse(localStorage.getItem(`files_${user.id}`) || '[]');
        userFiles.push(newFile);
        localStorage.setItem(`files_${user.id}`, JSON.stringify(userFiles));

        onFileUploaded(newFile);
        
        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been added to your vault.`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    setIsUploading(false);
  }, [user, onFileUploaded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-all duration-300 hover:scale-[1.02]
        ${isDragActive 
          ? 'border-primary bg-primary/10' 
          : 'border-border hover:border-primary'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">
        {isDragActive ? 'Drop files here' : 'Upload Files'}
      </h3>
      <p className="text-muted-foreground mb-4">
        Drag & drop files here, or click to select files
      </p>
      <Button variant="outline" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Choose Files'}
      </Button>
    </div>
  );
};
