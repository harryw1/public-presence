/**
 * posts.js - Utility functions for loading and processing blog posts
 * 
 * This module handles:
 * - Loading markdown files from the content/posts directory
 * - Parsing frontmatter metadata (title, date, tags, etc.)
 * - Sorting posts by date
 * - Calculating reading time estimates
 * - Filtering posts by tags
 */

import matter from 'gray-matter';

/**
 * Import all markdown files from the content/posts directory
 * Vite's import.meta.glob is a special function that loads files at build time
 * The 'eager' option loads them synchronously, and 'query: ?raw' gets the raw content
 */
const postFiles = import.meta.glob('/content/posts/*.md', { eager: true, query: '?raw', import: 'default' });

/**
 * Calculate estimated reading time based on word count
 * Average reading speed: 200 words per minute
 * 
 * @param {string} content - The markdown content to analyze
 * @returns {number} Estimated reading time in minutes
 */
export function calculateReadingTime(content) {
  // Remove markdown syntax and count words
  const words = content.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}

/**
 * Process a single markdown file and extract metadata
 * 
 * @param {string} filepath - Path to the markdown file
 * @param {string} content - Raw markdown content
 * @returns {Object} Processed post object with metadata and content
 */
function processPost(filepath, content) {
  // Parse frontmatter using gray-matter
  // Frontmatter is the YAML metadata at the top of markdown files
  const { data: frontmatter, content: markdownContent } = matter(content);
  
  // Extract filename from filepath to use as slug/ID
  // Example: '/content/posts/my-first-post.md' -> 'my-first-post'
  const filename = filepath.split('/').pop().replace('.md', '');
  
  return {
    slug: filename, // URL-friendly identifier
    title: frontmatter.title || 'Untitled Post',
    date: frontmatter.date || new Date().toISOString(),
    excerpt: frontmatter.excerpt || '',
    tags: frontmatter.tags || [],
    author: frontmatter.author || 'Public Presence',
    content: markdownContent,
    readingTime: calculateReadingTime(markdownContent)
  };
}

/**
 * Load all blog posts from the content directory
 * Posts are sorted by date (newest first)
 * 
 * @returns {Array} Array of post objects sorted by date
 */
export function getAllPosts() {
  const posts = Object.entries(postFiles).map(([filepath, content]) => {
    return processPost(filepath, content);
  });
  
  // Sort posts by date, newest first
  // This ensures the blog always shows recent content first
  return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Get a single post by its slug
 * 
 * @param {string} slug - The post identifier (filename without extension)
 * @returns {Object|null} The post object or null if not found
 */
export function getPostBySlug(slug) {
  const posts = getAllPosts();
  return posts.find(post => post.slug === slug) || null;
}

/**
 * Get all unique tags from all posts
 * Useful for generating tag filter lists
 * 
 * @returns {Array} Array of unique tag strings
 */
export function getAllTags() {
  const posts = getAllPosts();
  const tagSet = new Set();
  
  // Collect all tags from all posts
  posts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag));
  });
  
  // Convert Set to Array and sort alphabetically
  return Array.from(tagSet).sort();
}

/**
 * Filter posts by tag
 * 
 * @param {string} tag - The tag to filter by
 * @returns {Array} Array of posts that include the specified tag
 */
export function getPostsByTag(tag) {
  const posts = getAllPosts();
  return posts.filter(post => post.tags.includes(tag));
}

/**
 * Get recent posts (for homepage display)
 * 
 * @param {number} count - Number of posts to return (default: 5)
 * @returns {Array} Array of most recent posts
 */
export function getRecentPosts(count = 5) {
  const posts = getAllPosts();
  return posts.slice(0, count);
}

/**
 * Search posts by keyword in title, excerpt, or content
 * Case-insensitive search
 * 
 * @param {string} keyword - Search term
 * @returns {Array} Array of posts matching the search term
 */
export function searchPosts(keyword) {
  const posts = getAllPosts();
  const searchTerm = keyword.toLowerCase();
  
  return posts.filter(post => {
    return (
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.content.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  });
}

/**
 * Get navigation links for a post (previous/next)
 * Used to navigate between posts on individual post pages
 * 
 * @param {string} currentSlug - The current post's slug
 * @returns {Object} Object with previous and next post references
 */
export function getPostNavigation(currentSlug) {
  const posts = getAllPosts();
  const currentIndex = posts.findIndex(post => post.slug === currentSlug);
  
  return {
    previous: currentIndex > 0 ? posts[currentIndex - 1] : null,
    next: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
  };
}
