import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Format date to French locale
 *
 * @param date - Date string or Date object
 * @param pattern - Date format pattern (default: 'd MMMM yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, pattern = 'd MMMM yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: fr });
}

/**
 * Format date to relative time (e.g., "il y a 2 jours")
 *
 * @param date - Date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: fr });
}

/**
 * Create slug from text
 *
 * @param text - Text to slugify
 * @returns Slugified text
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, ''); // Trim - from end
}

/**
 * Truncate text to specified length
 *
 * @param text - Text to truncate
 * @param length - Max length
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns Truncated text
 */
export function truncate(text: string, length: number, suffix = '...'): string {
  if (text.length <= length) {
    return text;
  }

  return text.substring(0, length - suffix.length).trim() + suffix;
}

/**
 * Strip HTML tags from text
 *
 * @param html - HTML string
 * @returns Plain text
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Get excerpt from HTML content
 *
 * @param html - HTML string
 * @param length - Max length
 * @returns Excerpt text
 */
export function getExcerpt(html: string, length = 160): string {
  const plain = stripHtml(html);
  return truncate(plain, length);
}

/**
 * Validate email address
 *
 * @param email - Email address
 * @returns True if valid
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Get reading time estimate
 *
 * @param text - Text content
 * @param wordsPerMinute - Reading speed (default: 200)
 * @returns Reading time in minutes
 */
export function getReadingTime(text: string, wordsPerMinute = 200): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Generate pagination data
 *
 * @param currentPage - Current page number (1-indexed)
 * @param totalItems - Total number of items
 * @param itemsPerPage - Items per page
 * @returns Pagination data
 */
export function getPaginationData(currentPage: number, totalItems: number, itemsPerPage: number) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const offset = (currentPage - 1) * itemsPerPage;

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
}

/**
 * Debounce function
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Safe JSON parse
 *
 * @param json - JSON string
 * @param fallback - Fallback value if parse fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
