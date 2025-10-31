/**
 * dateUtils.js - Helper functions for formatting dates
 * 
 * Provides consistent date formatting throughout the application
 */

/**
 * Format a date string into a human-readable format
 * Example: "2024-01-15" -> "January 15, 2024"
 * 
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  
  // Use Intl.DateTimeFormat for localized, readable dates
  // This is more maintainable than manual string manipulation
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

/**
 * Format a date for RSS feeds (RFC 822 format)
 * Example: "Mon, 15 Jan 2024 00:00:00 GMT"
 * 
 * @param {string} dateString - ISO date string
 * @returns {string} RFC 822 formatted date
 */
export function formatRSSDate(dateString) {
  const date = new Date(dateString);
  return date.toUTCString();
}

/**
 * Get relative time (e.g., "2 days ago")
 * Useful for showing how recent a post is
 * 
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  // Find the appropriate interval
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'just now';
}
