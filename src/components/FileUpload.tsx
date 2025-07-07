
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { FileItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FileUploadProps {
  onFileUploaded: (file: FileItem) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to upload files.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    for (const file of acceptedFiles) {
      try {
        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        
        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user-files')
          .getPublicUrl(fileName);

        // Save file metadata to database
        const { data: fileData, error: dbError } = await supabase
          .from('files')
          .insert({
            user_id: user.id,
            name: file.name,
            size: file.size,
            mime_type: file.type,
            storage_path: fileName,
            public_url: publicUrl,
          })
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        onFileUploaded(fileData);
        
        toast({
          title: 'File uploaded successfully',
          description: `${file.name} has been added to your vault.`,
        });
      } catch (error: any) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload failed',
          description: `Failed to upload ${file.name}: ${error.message}`,
          variant: 'destructive',
        });
      }
    }
    
    setIsUploading(false);
  }, [user, onFileUploaded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB limit
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
      {isUploading ? (
        <>
          <Loader2 className="mx-auto h-12 w-12 mb-4 text-primary animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Uploading files...</h3>
          <p className="text-muted-foreground">Please wait while your files are being uploaded</p>
        </>
      ) : (
        <>
          <Upload className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {isDragActive ? 'Drop files here' : 'Upload Files'}
          </h3>
          <p className="text-muted-foreground mb-4">
            Drag & drop files here, or click to select files
          </p>
          <Button variant="outline" disabled={isUploading}>
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Maximum file size: 50MB
          </p>
        </>
      )}
    </div>
  );
};
