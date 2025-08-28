/**
 * Utility functions for handling image display and formatting
 */

/**
 * Clean up image filename for display
 * If the filename is a long hex string, return a cleaner name
 */
export const getDisplayImageName = (filename: string, index: number): string => {
  // Check if filename is a long hex string (more than 20 characters)
  if (filename.length > 20) {
    // Check if it looks like a hex string (contains only hex characters)
    const hexPattern = /^[0-9a-fA-F]+$/;
    if (hexPattern.test(filename)) {
      return `Image ${index + 1}`;
    }
  }
  
  // If it's a reasonable filename, return it as is
  return filename;
};

/**
 * Generate a clean filename for images
 */
export const generateImageFilename = (originalName: string, index: number): string => {
  const cleanName = getDisplayImageName(originalName, index);
  
  // If it's a hex string, generate a proper filename
  if (cleanName.startsWith('Image ')) {
    return `image_${index + 1}.png`;
  }
  
  return originalName;
};

/**
 * Check if a filename is a hex string
 */
export const isHexString = (filename: string): boolean => {
  return filename.length > 20 && /^[0-9a-fA-F]+$/.test(filename);
};
