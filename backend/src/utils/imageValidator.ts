import sharp from 'sharp';

/**
 * Validate image format using sharp (no face-api dependency)
 */
export async function validateImageFormat(imageBuffer: Buffer): Promise<{
  valid: boolean;
  error?: string;
  metadata?: {
    format: string;
    width: number;
    height: number;
    size: number;
  };
}> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    // Check if format is supported
    const supportedFormats = ['jpeg', 'jpg', 'png', 'webp'];
    if (!metadata.format || !supportedFormats.includes(metadata.format.toLowerCase())) {
      return {
        valid: false,
        error: `Unsupported image format: ${metadata.format}. Please use JPEG, PNG, or WebP.`,
      };
    }
    
    // Check minimum dimensions
    const minDimension = 200;
    if (!metadata.width || !metadata.height || metadata.width < minDimension || metadata.height < minDimension) {
      return {
        valid: false,
        error: `Image must be at least ${minDimension}x${minDimension} pixels.`,
      };
    }
    
    return {
      valid: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        size: imageBuffer.length,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Error validating image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
