
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
    console.log('🚀 Upload started:', { acceptedFiles: acceptedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })) });
    
    if (!user) {
      console.error('❌ No user found - authentication required');
      toast({
        title: 'Authentication required',
        description: 'Please log in to upload files.',
        variant: 'destructive',
      });
      return;
    }

    console.log('✅ User authenticated:', { userId: user.id, email: user.email });
    setUploading(true);

    try {
      for (const file of acceptedFiles) {
        console.log(`📁 Processing file: ${file.name} (${file.size} bytes, ${file.type})`);
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Max size is 10MB.`);
        }

        // Validate file type
        const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/msword', 'application/vnd.openxmlformats'];
        if (!allowedTypes.some(type => file.type.startsWith(type))) {
          throw new Error(`File ${file.name} has unsupported format: ${file.type}`);
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        console.log(`🔄 Uploading to storage:`, { filePath, bucket: 'user-files' });

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('❌ Storage upload failed:', uploadError);
          throw uploadError;
        }

        console.log('✅ Storage upload successful:', uploadData);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('user-files')
          .getPublicUrl(filePath);

        console.log('🔗 Generated public URL:', publicUrl);

        // Insert file metadata into database
        console.log('💾 Inserting file metadata to database...');
        const { data: fileData, error: dbError } = await supabase
          .from('files')
          .insert({
            file_name: file.name,
            storage_path: filePath,
            user_id: user.id,
            size: file.size,
            mime_type: file.type,
            public_url: publicUrl,
          })
          .select()
          .single();

        if (dbError) {
          console.error('❌ Database insert failed:', dbError);
          // Try to clean up the uploaded file
          await supabase.storage.from('user-files').remove([filePath]);
          throw dbError;
        }

        console.log('✅ Database insert successful:', fileData);

        // Convert to FileItem format
        const newFile: FileItem = {
          id: fileData.id,
          user_id: fileData.user_id,
          name: fileData.file_name,
          size: fileData.size || file.size,
          mime_type: fileData.mime_type || file.type,
          storage_path: fileData.storage_path,
          public_url: fileData.public_url || publicUrl,
          created_at: fileData.created_at || new Date().toISOString(),
          updated_at: fileData.updated_at || new Date().toISOString(),
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
