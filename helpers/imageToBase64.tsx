/**
 * Convert a File object to a base64 data URL string
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Convert multiple File objects to base64 data URL strings
 */
export const imagesToBase64 = async (files: File[]): Promise<string[]> => {
  return Promise.all(files.map(file => imageToBase64(file)));
};