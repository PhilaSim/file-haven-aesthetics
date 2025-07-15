
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types';
import { FileUpload } from '@/components/FileUpload';
import { FileCard } from '@/components/FileCard';
import { StorageQuota } from '@/components/StorageQuota';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { LogOut, Settings, Upload, Search, Files, Clock, Users, Plus, FolderOpen, Trash2, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { BinView } from '@/components/BinView';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdminCheck();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [currentView, setCurrentView] = useState<'files' | 'bin'>('files');

  useEffect(() => {
    if (user) {
      fetchFiles();
      
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
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null) // Only fetch non-deleted files
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
    // This function is kept for potential future use
    return [];
  };

  const recentFiles = files.slice(0, 6);
  const totalFileSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      // Soft delete - just set deleted_at timestamp
      const { error } = await supabase
        .from('files')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', fileId);

      if (error) throw error;

      const deletedFile = files.find(f => f.id === fileId);
      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      toast({
        title: 'File moved to trash',
        description: `${deletedFile?.name} has been moved to trash. You can restore it from the bin.`,
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

  const filteredSharedFiles = [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/95">
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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  File Haven
                </h1>
                <p className="text-sm text-muted-foreground">Your secure cloud storage</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/settings')}
                className="hover:scale-105 transition-all duration-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hover:scale-105 transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome back, {user?.user_metadata?.full_name?.split('@')[0] || 'User'}!
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your files securely in the cloud. Upload, organize, and access your documents from anywhere.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Files className="h-4 w-4 text-primary" />
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.length}</div>
              <p className="text-sm text-muted-foreground">
                {files.length === 1 ? 'file stored' : 'files stored'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-accent" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentFiles.length}</div>
              <p className="text-sm text-muted-foreground">
                files uploaded recently
              </p>
            </CardContent>
          </Card>

          <StorageQuota className="hover:shadow-lg transition-shadow" />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={() => setShowUpload(true)}
            size="lg"
            className="hover:scale-105 transition-all duration-200 px-8"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload Files
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/settings')}
            size="lg"
            className="hover:scale-105 transition-all duration-200 px-8"
          >
            <Settings className="h-5 w-5 mr-2" />
            Profile Settings
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentView(currentView === 'files' ? 'bin' : 'files')}
            size="lg"
            className="hover:scale-105 transition-all duration-200 px-8"
          >
            {currentView === 'files' ? (
              <>
                <Trash2 className="h-5 w-5 mr-2" />
                View Trash
              </>
            ) : (
              <>
                <FolderOpen className="h-5 w-5 mr-2" />
                View Files
              </>
            )}
          </Button>
          {isAdmin && (
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="hover:scale-105 transition-all duration-200 px-8"
            >
              <Link to="/admin">
                <Shield className="h-5 w-5 mr-2" />
                Admin Dashboard
              </Link>
            </Button>
          )}
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="animate-fade-in">
            <Card className="border-2 border-dashed border-primary/20">
              <CardContent className="p-6">
                <FileUpload onFileUploaded={handleFileUploaded} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content based on current view */}
        {currentView === 'bin' ? (
          <BinView />
        ) : (
          <>
            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search your files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Recent Files Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <FolderOpen className="h-6 w-6" />
                  {searchQuery ? 'Search Results' : 'Recent Files'}
                </h3>
                {files.length > 6 && !searchQuery && (
                  <Button variant="outline" size="sm">
                    View All Files
                  </Button>
                )}
              </div>

              {(searchQuery ? filteredFiles : recentFiles).length === 0 ? (
                <Card className="text-center py-16">
                  <CardContent>
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold mb-2">
                          {searchQuery ? 'No files found' : 'No files yet'}
                        </h4>
                        <p className="text-muted-foreground mb-4">
                          {searchQuery 
                            ? 'Try adjusting your search terms' 
                            : 'Start by uploading your first file'}
                        </p>
                        {!searchQuery && (
                          <Button onClick={() => setShowUpload(true)}>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload File
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(searchQuery ? filteredFiles : recentFiles).map((file, index) => (
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};
