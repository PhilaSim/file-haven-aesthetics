
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';

interface StorageQuotaProps {
  usedStorage: number;
  totalStorage?: number;
}

export const StorageQuota: React.FC<StorageQuotaProps> = ({ 
  usedStorage, 
  totalStorage = 1024 * 1024 * 1024 // 1GB default
}) => {
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

  return (
    <Card>
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
