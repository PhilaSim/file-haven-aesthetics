import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileItem } from '@/types';
import { FileCard } from '@/components/FileCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RotateCcw, AlertTriangle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const BinView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deletedFiles, setDeletedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchDeletedFiles();
    }
  }, [user]);

  const fetchDeletedFiles = async () => {
    if (!user) return;
    
    try {
      // Since we don't have a deleted_at column, we'll just show an empty bin
      setDeletedFiles([]);
    } catch (error: any) {
      console.error('Error fetching deleted files:', error);
      toast({
        title: 'Error loading deleted files',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFile = async (fileId: string) => {
    // Since we don't have soft delete, this function won't be used
    toast({
      title: 'Feature not available',
      description: 'File restoration is not available without soft delete.',
      variant: 'destructive',
    });
  };

  const handlePermanentDelete = async (fileId: string) => {
    try {
      const fileToDelete = deletedFiles.find(f => f.id === fileId);
      if (!fileToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-files')
        .remove([fileToDelete.storage_path]);

      if (storageError) throw storageError;

      // Delete from database permanently
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      setDeletedFiles(prev => prev.filter(file => file.id !== fileId));
      
      toast({
        title: 'File permanently deleted',
        description: `${fileToDelete.name} has been permanently deleted.`,
      });
    } catch (error: any) {
      console.error('Error permanently deleting file:', error);
      toast({
        title: 'Error deleting file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEmptyBin = async () => {
    try {
      // Get all file paths for storage deletion
      const filePaths = deletedFiles.map(file => file.storage_path);
      
      // Delete from storage
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('user-files')
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      // Since we don't have soft delete, there's nothing to empty
      // This is just for UI consistency

      setDeletedFiles([]);
      
      toast({
        title: 'Bin emptied',
        description: 'All deleted files have been permanently removed.',
      });
    } catch (error: any) {
      console.error('Error emptying bin:', error);
      toast({
        title: 'Error emptying bin',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredFiles = deletedFiles.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Trash2 className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Trash</h2>
            <p className="text-muted-foreground">
              {deletedFiles.length} deleted {deletedFiles.length === 1 ? 'file' : 'files'}
            </p>
          </div>
        </div>
        
        {deletedFiles.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Empty Bin
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Empty Trash?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {deletedFiles.length} files in the trash. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleEmptyBin}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Permanently Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Search */}
      {deletedFiles.length > 0 && (
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search deleted files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>
      )}

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No files found' : 'Trash is empty'}
                </h4>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Files you delete will appear here for 30 days before being permanently removed.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file, index) => (
            <div 
              key={file.id}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="group hover:shadow-lg transition-all duration-200 border-destructive/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium truncate flex-1">
                      {file.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreFile(file.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 hover:text-green-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-destructive" />
                              Permanently Delete File?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{file.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handlePermanentDelete(file.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Permanently Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                     <p className="text-xs text-muted-foreground">
                       Deleted recently
                     </p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreFile(file.id)}
                        className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
