
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, File, X } from 'lucide-react';
import { FileItem } from '@/types';

interface FileUploadProps {
  onFileUploaded: (file: FileItem) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to upload files.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload file to storage
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user-files')
          .getPublicUrl(filePath);

        // Insert file metadata into database
        const { data: fileData, error: dbError } = await supabase
          .from('files')
          .insert({
            file_name: file.name,
            path: filePath,
            user_id: user.id,
          })
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        // Convert to FileItem format
        const newFile: FileItem = {
          id: fileData.id,
          user_id: fileData.user_id,
          name: fileData.file_name,
          size: file.size,
          mime_type: file.type,
          storage_path: fileData.path,
          public_url: publicUrl,
          created_at: fileData.uploaded_at || new Date().toISOString(),
          updated_at: fileData.uploaded_at || new Date().toISOString(),
        };

        onFileUploaded(newFile);

        toast({
          title: 'File uploaded successfully',
          description: `${file.name} has been uploaded.`,
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }, [user, onFileUploaded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 hover:border-gray-400'
      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      {isDragActive ? (
        <p className="text-lg">Drop the files here...</p>
      ) : (
        <div>
          <p className="text-lg mb-2">
            Drag & drop files here, or click to select files
          </p>
          <p className="text-sm text-gray-500">
            Supports: PDF, Images, Documents
          </p>
        </div>
      )}
      {uploading && (
        <div className="mt-4">
          <p className="text-sm text-gray-600">Uploading...</p>
        </div>
      )}
    </div>
  );
};
