
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types';
import { FileUpload } from '@/components/FileUpload';
import { FileCard } from '@/components/FileCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Settings, Upload, Search, Users } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      {/* Header with gradient */}
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-lg">FH</span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg scale-150 opacity-50" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">File Haven</h1>
                <p className="text-sm text-muted-foreground">Your secure file storage</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={showUpload ? "default" : "outline"}
                size="sm"
                onClick={() => setShowUpload(!showUpload)}
                className="hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Upload Section with enhanced styling */}
        {showUpload && (
          <div className="animate-slide-up">
            <div className="p-1 rounded-2xl bg-gradient-to-r from-primary/20 to-accent/20">
              <div className="rounded-xl bg-background p-6">
                <FileUpload onFileUploaded={handleFileUploaded} />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search */}
        <div className="relative max-w-md">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 blur-xl opacity-50" />
          <div className="relative bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 p-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search your files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 border-0 bg-transparent focus:ring-2 focus:ring-primary/20 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Enhanced File Tabs */}
        <Tabs defaultValue="my-files" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md p-1 bg-muted/50 backdrop-blur-sm rounded-xl">
              <TabsTrigger 
                value="my-files"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
              >
                <span className="font-medium">My Files</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{files.length}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="shared"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
              >
                <span className="font-medium">Shared</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent-foreground">{sharedFiles.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="my-files" className="space-y-6">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-20">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl scale-150 opacity-50" />
                  <div className="relative bg-gradient-to-br from-muted to-accent/20 rounded-full p-8 w-32 h-32 mx-auto flex items-center justify-center">
                    <Upload className="h-12 w-12 text-muted-foreground animate-bounce-gentle" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  No files yet
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Upload your first file to get started with your secure cloud storage
                </p>
                <Button 
                  onClick={() => setShowUpload(true)}
                  className="hover:scale-105 transition-all duration-200 hover:shadow-lg px-8 py-3"
                  size="lg"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Your First File
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredFiles.map((file, index) => (
                  <div 
                    key={file.id}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <FileCard
                      file={file}
                      onDelete={handleDeleteFile}
                      isShared={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="space-y-6">
            {filteredSharedFiles.length === 0 ? (
              <div className="text-center py-20">
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-accent/10 blur-3xl scale-150 opacity-50" />
                  <div className="relative bg-gradient-to-br from-muted to-primary/20 rounded-full p-8 w-32 h-32 mx-auto flex items-center justify-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  No shared files
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Files shared with you will appear here when others invite you to collaborate
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filteredSharedFiles.map((file, index) => (
                  <div 
                    key={file.id}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <FileCard
                      file={file}
                      onDelete={() => {}} // Can't delete shared files
                      isShared={true}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
