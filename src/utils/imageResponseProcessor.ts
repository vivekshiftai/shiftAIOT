/**
 * Utility for processing image placeholders in response text
 * Replaces [IMAGE:filename] placeholders with actual image displays
 */

import { PDFImage } from '../services/pdfprocess';
import { logInfo, logWarn } from './logger';

/**
 * Process response text to replace image placeholders with actual images
 * @param responseText The response text containing [IMAGE:filename] placeholders
 * @param images Array of images from the response
 * @returns Object with processed text and image references
 */
export function processImagePlaceholders(responseText: string, images: PDFImage[] = []) {
  if (!responseText || !images || images.length === 0) {
    return {
      processedText: responseText,
      imageReferences: [],
      hasImagePlaceholders: false
    };
  }

  // Find all image placeholders in the format [IMAGE:filename]
  const imagePlaceholderRegex = /\[IMAGE:([^\]]+)\]/g;
  const placeholders = Array.from(responseText.matchAll(imagePlaceholderRegex));
  
  if (placeholders.length === 0) {
    return {
      processedText: responseText,
      imageReferences: [],
      hasImagePlaceholders: false
    };
  }

  logInfo('ImageProcessor', 'Found image placeholders', { 
    placeholderCount: placeholders.length,
    imageCount: images.length,
    placeholders: placeholders.map(p => p[1])
  });

  let processedText = responseText;
  const imageReferences: Array<{ filename: string; image: PDFImage | null; index: number }> = [];

  // Process each placeholder
  placeholders.forEach((match, index) => {
    const fullMatch = match[0]; // [IMAGE:image 1.jpg]
    const filename = match[1]; // image 1.jpg
    
    // Find the corresponding image
    const matchingImage = images.find(img => 
      img.filename === filename || 
      img.filename.toLowerCase() === filename.toLowerCase()
    );

    if (matchingImage) {
      // Replace the placeholder with actual inline image HTML
      const inlineImageHTML = createInlineImageHTML(matchingImage, '300px');
      processedText = processedText.replace(fullMatch, inlineImageHTML);
      
      imageReferences.push({
        filename,
        image: matchingImage,
        index: index
      });
      
      logInfo('ImageProcessor', 'Matched image placeholder', { filename, found: true });
    } else {
      // Keep the placeholder but make it more readable
      const imageReference = `📷 ${filename}`;
      processedText = processedText.replace(fullMatch, imageReference);
      
      imageReferences.push({
        filename,
        image: null,
        index: index
      });
      
      logWarn('ImageProcessor', 'Image placeholder not found in images array', { 
        filename, 
        availableImages: images.map(img => img.filename) 
      });
    }
  });

  return {
    processedText,
    imageReferences,
    hasImagePlaceholders: true
  };
}

/**
 * Create inline image HTML for embedding in text
 * @param image The image to embed
 * @param maxWidth Maximum width for the inline image
 * @returns HTML string for the image
 */
export function createInlineImageHTML(image: PDFImage, maxWidth: string = '300px'): string {
  return `<div style="margin: 16px 0; text-align: center;">
            <img src="data:${image.mime_type};base64,${image.data}" 
                 alt="${image.filename}" 
                 style="max-width: ${maxWidth}; height: auto; border-radius: 8px; border: 1px solid #d1d5db; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); display: inline-block;" 
                 class="inline-response-image" />
          </div>`;
}

/**
 * Process response text with inline images (alternative approach)
 * @param responseText The response text
 * @param images Array of images
 * @returns Processed text with inline images
 */
export function processImagePlaceholdersWithInlineImages(responseText: string, images: PDFImage[] = []): string {
  if (!responseText || !images || images.length === 0) {
    return responseText;
  }

  const imagePlaceholderRegex = /\[IMAGE:([^\]]+)\]/g;
  let processedText = responseText;

  // Replace each placeholder with inline image
  processedText = processedText.replace(imagePlaceholderRegex, (match, filename) => {
    const matchingImage = images.find(img => 
      img.filename === filename || 
      img.filename.toLowerCase() === filename.toLowerCase()
    );

    if (matchingImage) {
      return createInlineImageHTML(matchingImage);
    } else {
      // Fallback to text reference
      return `📷 ${filename}`;
    }
  });

  return processedText;
}

/**
 * Extract image references from response text for separate display
 * @param responseText The response text
 * @param images Array of images
 * @returns Object with clean text and organized image references
 */
export function extractImageReferences(responseText: string, images: PDFImage[] = []) {
  const processed = processImagePlaceholders(responseText, images);
  
  return {
    cleanText: processed.processedText,
    imageReferences: processed.imageReferences,
    hasImages: processed.hasImagePlaceholders,
    totalImages: images.length
  };
}
