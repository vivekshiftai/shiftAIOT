import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PDFImage {
  data: string;
  mime_type: string;
  page?: number;
  description?: string;
}

interface ImageViewerProps {
  images: PDFImage[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  isOpen,
  onClose,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setRotation(0);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setRotation(0);
  };

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.25));
  };

  const resetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = `data:${currentImage.mime_type};base64,${currentImage.data}`;
    link.download = `image-${currentIndex + 1}.${currentImage.mime_type.split('/')[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-white">
          <span className="text-sm font-medium">
            Image {currentIndex + 1} of {images.length}
          </span>
          {currentImage.page && (
            <span className="text-sm text-gray-300">
              • Page {currentImage.page}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <button
            onClick={zoomOut}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-white text-sm font-medium min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          
          {/* Rotate */}
          <button
            onClick={rotate}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            title="Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          {/* Download */}
          <button
            onClick={downloadImage}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {/* Reset */}
          <button
            onClick={resetZoom}
            className="px-3 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all text-sm"
            title="Reset View"
          >
            Reset
          </button>
          
          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
            title="Previous Image (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all z-10"
            title="Next Image (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Main Image Container */}
      <div 
        className="flex items-center justify-center w-full h-full p-16 cursor-pointer"
        onClick={(e) => {
          // Only close if clicking the background, not the image
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="relative max-w-full max-h-full">
          <img
            src={`data:${currentImage.mime_type};base64,${currentImage.data}`}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-300 ease-in-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
            draggable={false}
          />
          
          {/* Image Description */}
          {currentImage.description && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm max-w-md text-center">
              {currentImage.description}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-50 p-3 rounded-lg">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setZoom(1);
                setRotation(0);
              }}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white shadow-lg'
                  : 'border-gray-400 hover:border-gray-200'
              }`}
            >
              <img
                src={`data:${images[index].mime_type};base64,${images[index].data}`}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 text-white text-xs bg-black bg-opacity-50 px-3 py-2 rounded-lg">
        <div className="space-y-1">
          <div>← → Navigate</div>
          <div>+ - Zoom</div>
          <div>Esc Close</div>
        </div>
      </div>
    </div>
  );
};
