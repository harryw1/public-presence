/**
 * posts.js - Utility functions for loading and processing blog posts
 * 
 * This module handles:
 * - Loading pre-processed posts from JSON (generated at build time)
 * - Sorting posts by date
 * - Filtering posts by tags
 * - Searching posts
 * 
 * Note: Posts are pre-processed at build time to avoid Node.js dependencies
 * like Buffer in the browser. See scripts/prebuild.js for the processing logic.
 */

// Load posts data (cached after first fetch)
let posts = null;

/**
 * Load posts data from the public JSON file
 */
async function ensurePostsLoaded() {
  if (posts === null) {
    try {
      const response = await fetch('/posts.json');
      if (!response.ok) {
        throw new Error(`Failed to load posts: ${response.status}`);
      }
      posts = await response.json();
    } catch (error) {
      console.error('Failed to load posts:', error);
      posts = [];
    }
  }
  return posts;
}

/**
 * Get all blog posts (already sorted by date, newest first)
 * 
 * @returns {Promise<Array>} Array of post objects
 */
export async function getAllPosts() {
  await ensurePostsLoaded();
  return posts;
}

/**
 * Get a single post by its slug
 * 
 * @param {string} slug - The post identifier (filename without extension)
 * @returns {Promise<Object|null>} The post object or null if not found
 */
export async function getPostBySlug(slug) {
  await ensurePostsLoaded();
  return posts.find(post => post.slug === slug) || null;
}

/**
 * Get all unique tags from all posts
 * Useful for generating tag filter lists
 * 
 * @returns {Promise<Array>} Array of unique tag strings
 */
export async function getAllTags() {
  await ensurePostsLoaded();
  const tagSet = new Set();
  
  posts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag));
  });
  
  return Array.from(tagSet).sort();
}

/**
 * Filter posts by tag
 * 
 * @param {string} tag - The tag to filter by
 * @returns {Promise<Array>} Array of posts that include the specified tag
 */
export async function getPostsByTag(tag) {
  await ensurePostsLoaded();
  return posts.filter(post => post.tags.includes(tag));
}

/**
 * Get recent posts (for homepage display)
 * 
 * @param {number} count - Number of posts to return (default: 5)
 * @returns {Promise<Array>} Array of most recent posts
 */
export async function getRecentPosts(count = 5) {
  await ensurePostsLoaded();
  return posts.slice(0, count);
}

/**
 * Search posts by keyword in title, excerpt, content, or tags
 * Case-insensitive search
 * 
 * @param {string} keyword - Search term
 * @returns {Promise<Array>} Array of posts matching the search term
 */
export async function searchPosts(keyword) {
  await ensurePostsLoaded();
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
 * @returns {Promise<Object>} Object with previous and next post references
 */
export async function getPostNavigation(currentSlug) {
  await ensurePostsLoaded();
  const currentIndex = posts.findIndex(post => post.slug === currentSlug);
  
  return {
    previous: currentIndex > 0 ? posts[currentIndex - 1] : null,
    next: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
  };
}
