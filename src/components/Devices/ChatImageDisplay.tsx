import React, { useState } from 'react';
import { Download, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { PDFImage } from '../../services/chatService';
import { logInfo, logError } from '../../utils/logger';
import { getDisplayImageName } from '../../utils/imageUtils';
import { ImageViewer } from '../UI/ImageViewer';

interface ChatImageDisplayProps {
  images: PDFImage[];
  className?: string;
}

export const ChatImageDisplay: React.FC<ChatImageDisplayProps> = ({ images, className = '' }) => {
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<PDFImage[]>([]);
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  // Debug logging
  React.useEffect(() => {
    if (images && images.length > 0) {
      logInfo('ChatImageDisplay', 'Rendering images', { 
        imageCount: images.length,
        imageNames: images.map(img => img.filename),
        imageData: images.map(img => ({
          filename: img.filename,
          hasData: !!img.data,
          dataLength: img.data?.length || 0,
          mimeType: img.mime_type,
          size: img.size,
          isValid: img.data && img.data.trim() !== '' && img.mime_type && img.size > 0
        }))
      });
      
      // Log any invalid images
      const invalidImages = images.filter(img => !img.data || img.data.trim() === '' || !img.mime_type || img.size <= 0);
      if (invalidImages.length > 0) {
        logError('ChatImageDisplay', 'Found invalid images', new Error(`Invalid images: ${invalidImages.map(img => img.filename).join(', ')}`));
      }
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

  // Image viewer functions
  const openImageViewer = (images: PDFImage[], initialIndex: number = 0) => {
    logInfo('ChatImageDisplay', 'Opening image viewer', { 
      imageCount: images.length, 
      initialIndex 
    });
    setImageViewerImages(images);
    setImageViewerInitialIndex(initialIndex);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageViewerImages([]);
    setImageViewerInitialIndex(0);
  };

  const downloadImage = (image: PDFImage, index: number) => {
    try {
      // Validate image data before download
      if (!image.data || image.data.trim() === '') {
        logError('ChatImageDisplay', 'Cannot download image with no data', new Error('No image data available'));
        return;
      }
      
      const link = document.createElement('a');
      // Use default MIME type if none provided
      const mimeType = image.mime_type || 'image/png';
      link.href = `data:${mimeType};base64,${image.data}`;
      
      // Use a cleaner filename for download
      const cleanFilename = getDisplayImageName(image.filename, index).replace(/\s+/g, '_').toLowerCase();
      const extension = mimeType.split('/')[1] || 'png';
      link.download = `${cleanFilename}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      logInfo('ChatImageDisplay', 'Image downloaded successfully', { filename: cleanFilename });
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

  // Filter out invalid images
  const validImages = images.filter(img => 
    img.data && 
    img.data.trim() !== '' && 
    img.mime_type && 
    img.size > 0
  );

  if (validImages.length === 0) {
    return (
      <div className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">
            Found {images.length} image(s) but they appear to be corrupted or incomplete. 
            Please try asking a different question or contact support if this persists.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <span className="font-medium">Images ({images.length}):</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {validImages.map((image, index) => {
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
                    onClick={() => openImageViewer(validImages, index)}
                    className="px-2 py-1 text-xs bg-primary-100 text-primary-700 hover:bg-primary-200 rounded transition-colors"
                    title="View full size with navigation"
                  >
                    Full Size
                  </button>
                  <button
                    onClick={() => downloadImage(image, index)}
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
                ) : !image.data || image.data.trim() === '' ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    <span className="text-sm">No image data available</span>
                  </div>
                ) : (
                  <div 
                    className={`transition-all duration-300 cursor-pointer ${
                      isExpanded ? 'max-h-96' : 'max-h-32'
                    } overflow-hidden`}
                    onClick={() => openImageViewer(validImages, index)}
                    title="Click to view full size"
                  >
                    <img
                      src={`data:${image.mime_type || 'image/png'};base64,${image.data}`}
                      alt={image.filename}
                      className={`w-full h-auto object-contain rounded transition-opacity hover:opacity-90 ${
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
      
      {/* Image Viewer Modal */}
      <ImageViewer
        images={imageViewerImages}
        isOpen={imageViewerOpen}
        onClose={closeImageViewer}
        initialIndex={imageViewerInitialIndex}
      />
    </div>
  );
};

export default ChatImageDisplay;
