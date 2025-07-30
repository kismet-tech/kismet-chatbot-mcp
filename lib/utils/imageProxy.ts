/**
 * Transforms external image URLs to use our proxy to avoid CORS issues
 */
export function proxyImageUrl(originalUrl: string): string {
  if (!originalUrl) return originalUrl;
  
  // If it's already a relative URL or our own domain, return as-is
  if (originalUrl.startsWith('/') || originalUrl.startsWith('http://localhost') || originalUrl.startsWith('https://localhost')) {
    return originalUrl;
  }
  
  // Encode the URL and return our proxy endpoint
  const encodedUrl = encodeURIComponent(originalUrl);
  return `/api/proxy-image?url=${encodedUrl}`;
}

/**
 * Transforms an array of image URLs to use our proxy
 */
export function proxyImageUrls(urls: string[]): string[] {
  return urls.map(url => proxyImageUrl(url));
} 