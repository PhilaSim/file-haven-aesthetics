
import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StorageQuotaProps {
  className?: string;
}

export const StorageQuota: React.FC<StorageQuotaProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [usedStorage, setUsedStorage] = useState(0);
  const [loading, setLoading] = useState(true);
  const totalStorage = 5 * 1024 * 1024 * 1024; // 5GB limit
  useEffect(() => {
    fetchStorageUsage();
  }, [user]);

  const fetchStorageUsage = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('files')
        .select('size')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const total = data?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
      setUsedStorage(total);
    } catch (error) {
      console.error('Error fetching storage usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercentage = (usedStorage / totalStorage) * 100;
  const remainingStorage = totalStorage - usedStorage;

  const getProgressColor = () => {
    if (usagePercentage < 60) return 'bg-green-500';
    if (usagePercentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 animate-pulse" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HardDrive className="h-4 w-4" />
          Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Used</span>
          <span className="font-medium">{formatFileSize(usedStorage)}</span>
        </div>
        
        <Progress 
          value={usagePercentage} 
          className="h-2"
        />
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatFileSize(remainingStorage)} remaining
          </span>
          <span className="text-muted-foreground">
            {formatFileSize(totalStorage)} total
          </span>
        </div>
        
        {usagePercentage > 90 && (
          <div className="text-xs text-red-500 font-medium">
            ⚠️ Storage almost full
          </div>
        )}
      </CardContent>
    </Card>
  );
};
