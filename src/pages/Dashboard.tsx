
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileUpload } from '@/components/FileUpload';
import { FileCard } from '@/components/FileCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { StorageQuota } from '@/components/StorageQuota';
import { FileSearch } from '@/components/FileSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, File, Settings, Plus, FolderPlus, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Motivational quotes
  const quotes = [
    "Organize your files, organize your life! 🌟",
    "Every file has its place, every place has its file! 📁",
    "Stay productive, stay organized! 💪",
    "Your digital vault awaits! 🔐",
    "File management made simple! ✨"
  ];

  const dailyQuote = quotes[new Date().getDate() % quotes.length];

  useEffect(() => {
    if (user) {
      const userFiles = JSON.parse(localStorage.getItem(`files_${user.id}`) || '[]');
      setFiles(userFiles);
      setFilteredFiles(userFiles);
    }
  }, [user]);

  useEffect(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const mimeType = file.type;

        switch (filterType) {
          case 'images':
            return mimeType.startsWith('image/');
          case 'documents':
            return ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension);
          case 'videos':
            return mimeType.startsWith('video/');
          case 'audio':
            return mimeType.startsWith('audio/');
          case 'archives':
            return ['zip', 'rar', '7z', 'tar', 'gz'].includes(extension);
          case 'code':
            return ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java'].includes(extension);
          default:
            return true;
        }
      });
    }

    setFilteredFiles(filtered);
  }, [files, searchQuery, filterType]);

  const handleFileUploaded = (newFile: FileItem) => {
    setFiles(prev => [...prev, newFile]);
    toast({
      title: "File uploaded successfully! 🎉",
      description: `${newFile.name} has been added to your vault.`,
    });
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

  const totalStorage = files.reduce((sum, file) => sum + file.size, 0);
  const fileStats = {
    total: files.length,
    lastUploaded: files.length > 0 ? new Date(Math.max(...files.map(f => new Date(f.uploadDate).getTime()))) : null
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">FileVault</h1>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/settings">
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-3xl font-bold">
                {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-muted-foreground">{dailyQuote}</p>
            </div>
          </div>
        </div>

        {/* Stats and Storage */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <File className="h-4 w-4" />
                Total Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fileStats.total}</div>
              <p className="text-xs text-muted-foreground">files stored</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Last Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {fileStats.lastUploaded 
                  ? fileStats.lastUploaded.toLocaleDateString() 
                  : 'No uploads yet'
                }
              </div>
              <p className="text-xs text-muted-foreground">most recent</p>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <StorageQuota usedStorage={totalStorage} />
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your files efficiently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button className="hover:scale-105 transition-transform">
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
              <Button variant="outline" className="hover:scale-105 transition-transform">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button variant="outline" className="hover:scale-105 transition-transform">
                <Clock className="h-4 w-4 mr-2" />
                Recent Activity
              </Button>
              <Button variant="outline" className="hover:scale-105 transition-transform">
                <Star className="h-4 w-4 mr-2" />
                Starred Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Section */}
        <div className="mb-8 animate-fade-in">
          <FileUpload onFileUploaded={handleFileUploaded} />
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <FileSearch
            onSearch={setSearchQuery}
            onFilter={setFilterType}
            currentFilter={filterType}
          />
        </div>

        {/* Files Grid */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Your Files</h3>
            <span className="text-sm text-muted-foreground">
              {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} 
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="mx-auto h-16 w-16 mb-4 opacity-50" />
              {searchQuery ? (
                <>
                  <h4 className="text-lg font-medium mb-2">No files found</h4>
                  <p>Try adjusting your search or filter criteria</p>
                </>
              ) : (
                <>
                  <h4 className="text-lg font-medium mb-2">No files yet – Let's get productive! 🚀</h4>
                  <p>Upload your first file to get started organizing your digital life</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
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
