import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { HardDrive, Users, FileText, TrendingUp } from 'lucide-react';

interface StorageStats {
  totalFiles: number;
  totalUsers: number;
  totalStorageBytes: number;
  filesThisMonth: number;
}

export const StorageOverview = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorageStats = async () => {
      try {
        // Get total files and storage size
        const { data: filesData } = await supabase
          .from('files')
          .select('size, created_at');

        // Get total users
        const { data: usersData } = await supabase
          .from('users')
          .select('id');

        const totalFiles = filesData?.length || 0;
        const totalUsers = usersData?.length || 0;
        const totalStorageBytes = filesData?.reduce((acc, file) => acc + file.size, 0) || 0;
        
        // Files uploaded this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const filesThisMonth = filesData?.filter(file => 
          new Date(file.created_at) >= startOfMonth
        ).length || 0;

        setStats({
          totalFiles,
          totalUsers,
          totalStorageBytes,
          filesThisMonth,
        });
      } catch (error) {
        console.error('Error fetching storage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Total Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatBytes(stats?.totalStorageBytes || 0)}
          </div>
          <p className="text-sm text-muted-foreground">Across all users</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Total Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats?.totalFiles || 0}
          </div>
          <p className="text-sm text-muted-foreground">Files uploaded</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats?.totalUsers || 0}
          </div>
          <p className="text-sm text-muted-foreground">Registered users</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats?.filesThisMonth || 0}
          </div>
          <p className="text-sm text-muted-foreground">New uploads</p>
        </CardContent>
      </Card>
    </div>
  );
};
