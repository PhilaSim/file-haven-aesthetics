
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from '@/components/FileUpload';
import { FileCard } from '@/components/FileCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { FileItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, File } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const userFiles = JSON.parse(localStorage.getItem(`files_${user.id}`) || '[]');
      setFiles(userFiles);
    }
  }, [user]);

  const handleFileUploaded = (newFile: FileItem) => {
    setFiles(prev => [...prev, newFile]);
  };

  const handleDeleteFile = (fileId: string) => {
    if (!user) return;
    
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    localStorage.setItem(`files_${user.id}`, JSON.stringify(updatedFiles));
    
    toast({
      title: "File deleted",
      description: "File has been removed from your vault.",
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">FileVault</h1>
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{user?.name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="transition-transform hover:scale-105"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-muted-foreground">
            Manage your files securely in your personal vault.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8 animate-fade-in">
          <FileUpload onFileUploaded={handleFileUploaded} />
        </div>

        {/* Files Grid */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Your Files</h3>
            <span className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="mx-auto h-16 w-16 mb-4 opacity-50" />
              <h4 className="text-lg font-medium mb-2">No files yet</h4>
              <p>Upload your first file to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={handleDeleteFile}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
