import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import * as crypto from "crypto-js";

/**
 * Combine class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string into a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Create a SHA-256 hash from a string
 */
export function createHash(content: string): string {
  return crypto.SHA256(content).toString(crypto.enc.Hex);
}

/**
 * Generate a hash from a file
 */
export async function generateFileHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const hash = createHash(content);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Truncate a string if it's longer than the specified length
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Get file type category from MIME type
 */
export function getFileTypeFromMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  return 'file';
}

/**
 * Convert license type to human-readable format
 */
export function getLicenseTypeLabel(licenseType: string): string {
  switch (licenseType) {
    case 'free':
      return 'Free License';
    case 'paid':
      return 'Paid License';
    case 'permission':
      return 'Permission Required';
    case 'none':
      return 'No Usage';
    default:
      return 'Unknown License';
  }
}
