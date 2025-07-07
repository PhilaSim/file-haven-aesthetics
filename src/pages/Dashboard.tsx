
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types';
import { FileUpload } from '@/components/FileUpload';
import { FileCard } from '@/components/FileCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Settings, Upload, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchSharedFiles();
      
      // Set up real-time subscription
      const subscription = supabase
        .channel('files-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'files' }, 
          (payload) => {
            console.log('Real-time update:', payload);
            if (payload.eventType === 'INSERT') {
              // Convert database format to FileItem format
              const newFile: FileItem = {
                id: payload.new.id,
                user_id: payload.new.user_id,
                name: payload.new.file_name,
                size: payload.new.size || 0,
                mime_type: payload.new.mime_type || '',
                storage_path: payload.new.path,
                public_url: payload.new.public_url,
                created_at: payload.new.uploaded_at || new Date().toISOString(),
                updated_at: payload.new.uploaded_at || new Date().toISOString(),
              };
              
              if (payload.new.user_id === user.id) {
                setFiles(prev => [newFile, ...prev]);
              }
            } else if (payload.eventType === 'DELETE') {
              setFiles(prev => prev.filter(file => file.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchFiles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      // Convert database format to FileItem format
      const convertedFiles: FileItem[] = data.map((file: any) => ({
        id: file.id,
        user_id: file.user_id,
        name: file.file_name,
        size: file.size || 0,
        mime_type: file.mime_type || '',
        storage_path: file.path,
        public_url: file.public_url,
        created_at: file.uploaded_at || new Date().toISOString(),
        updated_at: file.uploaded_at || new Date().toISOString(),
      }));
      
      setFiles(convertedFiles);
    } catch (error: any) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error loading files',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedFiles = async () => {
    if (!user) return;
    
    try {
      // For now, just set empty array since file_shares might not have data yet
      setSharedFiles([]);
    } catch (error: any) {
      console.error('Error fetching shared files:', error);
    }
  };

  const handleFileUploaded = (newFile: FileItem) => {
    setFiles(prev => [newFile, ...prev]);
    setShowUpload(false);
    toast({
      title: 'File uploaded successfully',
      description: `${newFile.name} has been uploaded.`,
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      const fileToDelete = files.find(f => f.id === fileId);
      if (!fileToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([fileToDelete.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await (supabase as any)
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      toast({
        title: 'File deleted',
        description: `${fileToDelete.name} has been deleted.`,
      });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error deleting file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Logout failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSharedFiles = sharedFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FH</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">File Haven</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Upload Section */}
        {showUpload && (
          <div className="mb-8">
            <FileUpload onFileUploaded={handleFileUploaded} />
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* File Tabs */}
        <Tabs defaultValue="my-files" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="my-files">
              My Files ({files.length})
            </TabsTrigger>
            <TabsTrigger value="shared">
              Shared with Me ({sharedFiles.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-files" className="mt-6">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Upload className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No files yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Upload your first file to get started
                </p>
                <Button onClick={() => setShowUpload(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={handleDeleteFile}
                    isShared={false}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="mt-6">
            {filteredSharedFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Upload className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No shared files
                </h3>
                <p className="text-gray-500">
                  Files shared with you will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSharedFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={() => {}} // Can't delete shared files
                    isShared={true}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
