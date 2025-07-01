
import React from 'react';
import { File, FileText, Image, FileVideo, Music, Archive, Code, Presentation } from 'lucide-react';

interface FileTypeIconProps {
  filename: string;
  mimeType: string;
  className?: string;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({ 
  filename, 
  mimeType, 
  className = "h-8 w-8" 
}) => {
  const getFileIcon = () => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    // Image files
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return <Image className={`${className} text-green-500`} />;
    }
    
    // Video files
    if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
      return <FileVideo className={`${className} text-purple-500`} />;
    }
    
    // Audio files
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(extension)) {
      return <Music className={`${className} text-orange-500`} />;
    }
    
    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
      return <FileText className={`${className} text-red-500`} />;
    }
    
    // Presentation files
    if (['ppt', 'pptx', 'odp'].includes(extension)) {
      return <Presentation className={`${className} text-blue-500`} />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <Archive className={`${className} text-yellow-500`} />;
    }
    
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php'].includes(extension)) {
      return <Code className={`${className} text-cyan-500`} />;
    }
    
    // Default file icon
    return <File className={`${className} text-gray-500`} />;
  };

  return getFileIcon();
};
