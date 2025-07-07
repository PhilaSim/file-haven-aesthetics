
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from '@/components/FileUpload';
import { FileCard } from '@/components/FileCard';
import { FileSearch } from '@/components/FileSearch';
import { StorageQuota } from '@/components/StorageQuota';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FileItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, Settings, Upload, FolderOpen, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user, profile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [sharedFiles, setSharedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadFiles();
      loadSharedFiles();
      setupRealtimeSubscription();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading files',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSharedFiles = async () => {
    try {
      // Since file_shares table might not be in the types, we'll use a simplified approach for now
      const { data, error } = await supabase
        .from('file_shares' as any)
        .select(`
          *,
          files (*)
        `)
        .eq('shared_with', user?.id);

      if (error) {
        console.error('Error loading shared files:', error);
        return;
      }
      
      const sharedFileData = data?.map((share: any) => share.files).filter(Boolean) || [];
      setSharedFiles(sharedFileData);
    } catch (error: any) {
      console.error('Error loading shared files:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('files-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setFiles(prev => [payload.new as FileItem, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setFiles(prev => prev.filter(file => file.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleFileUploaded = (newFile: FileItem) => {
    setFiles(prev => [newFile, ...prev]);
  };

  const handleFileDeleted = async (fileId: string) => {
    try {
      // Find the file to get its storage path
      const fileToDelete = files.find(f => f.id === fileId);
      if (!fileToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([fileToDelete.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      toast({
        title: 'File deleted',
        description: 'File has been permanently deleted.',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">File Haven</h1>
              <div className="text-sm text-muted-foreground">
                Welcome back, {profile?.full_name || user?.email}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="mb-8">
              <FileUpload onFileUploaded={handleFileUploaded} />
            </div>

            <div className="mb-6">
              <FileSearch
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalFiles={files.length}
              />
            </div>

            <Tabs defaultValue="my-files" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my-files" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  My Files ({filteredFiles.length})
                </TabsTrigger>
                <TabsTrigger value="shared" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Shared with Me ({filteredSharedFiles.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my-files">
                {filteredFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No files found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? 'No files match your search criteria.'
                        : 'Upload your first file to get started.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        onDelete={handleFileDeleted}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shared">
                {filteredSharedFiles.length === 0 ? (
                  <div className="text-center py-12">
                    <Share2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No shared files</h3>
                    <p className="text-muted-foreground">
                      Files shared with you will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSharedFiles.map((file) => (
                      <FileCard
                        key={file.id}
                        file={file}
                        onDelete={handleFileDeleted}
                        isShared
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <StorageQuota files={files} />
          </div>
        </div>
      </main>
    </div>
  );
};
