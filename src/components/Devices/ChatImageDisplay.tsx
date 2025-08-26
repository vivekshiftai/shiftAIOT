import React, { useState } from 'react';
import { Download, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { PDFImage } from '../../services/chatService';
import { logInfo, logError } from '../../utils/logger';

interface ChatImageDisplayProps {
  images: PDFImage[];
  className?: string;
}

export const ChatImageDisplay: React.FC<ChatImageDisplayProps> = ({ images, className = '' }) => {
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Debug logging
  React.useEffect(() => {
    if (images && images.length > 0) {
      logInfo('ChatImageDisplay', 'Rendering images', { 
        imageCount: images.length,
        imageNames: images.map(img => img.filename)
      });
    }
  }, [images]);

  const toggleImageExpansion = (filename: string) => {
    const newExpanded = new Set(expandedImages);
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename);
    } else {
      newExpanded.add(filename);
    }
    setExpandedImages(newExpanded);
  };

  const handleImageError = (filename: string) => {
    logError('ChatImageDisplay', `Image failed to load: ${filename}`, new Error(`Image load failed for ${filename}`));
    setImageErrors(prev => new Set(prev).add(filename));
  };

  const downloadImage = (image: PDFImage) => {
    try {
      const link = document.createElement('a');
      link.href = `data:${image.mime_type};base64,${image.data}`;
      link.download = image.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      logInfo('ChatImageDisplay', 'Image downloaded successfully', { filename: image.filename });
    } catch (error) {
      logError('ChatImageDisplay', 'Failed to download image', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span className="font-medium">Images ({images.length}):</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {images.map((image, index) => {
          const isExpanded = expandedImages.has(image.filename);
          const hasError = imageErrors.has(image.filename);
          
          return (
            <div
              key={`${image.filename}-${index}`}
              className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Image Header */}
              <div className="px-3 py-2 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {image.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(image.size)} • {image.mime_type}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleImageExpansion(image.filename)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title={isExpanded ? 'Collapse image' : 'Expand image'}
                  >
                    {isExpanded ? (
                      <EyeOff className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => downloadImage(image)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Download image"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Image Content */}
              <div className="p-3">
                {hasError ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    <span className="text-sm">Failed to load image</span>
                  </div>
                ) : (
                  <div className={`transition-all duration-300 ${
                    isExpanded ? 'max-h-96' : 'max-h-32'
                  } overflow-hidden`}>
                    <img
                      src={`data:${image.mime_type};base64,${image.data}`}
                      alt={image.filename}
                      className={`w-full h-auto object-contain rounded ${
                        isExpanded ? 'max-h-80' : 'max-h-24'
                      }`}
                      onError={() => handleImageError(image.filename)}
                      onLoad={() => logInfo('ChatImageDisplay', 'Image loaded successfully', { filename: image.filename })}
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChatImageDisplay;
