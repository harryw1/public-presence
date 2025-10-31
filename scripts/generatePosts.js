/**
 * generatePosts.js - Pre-process markdown posts at build time
 * 
 * This script runs during the build process and converts all markdown posts
 * with frontmatter into a JSON file that can be imported by the browser.
 * This avoids the Buffer/Node.js API issues in the browser.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const POSTS_DIR = path.join(__dirname, '../content/posts');
const OUTPUT_FILE = path.join(__dirname, '../src/generated-posts.json');

/**
 * Calculate reading time
 */
function calculateReadingTime(content) {
  const words = content.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Process a single markdown file
 */
function processPost(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const { data: frontmatter, content: markdownContent } = matter(content);
  const filename = path.basename(filepath, '.md');
  
  return {
    slug: filename,
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
 * Main execution
 */
function main() {
  console.log('📝 Generating posts JSON...');
  
  // Check if posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('⚠️  No posts directory found, creating empty posts array');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([]));
    return;
  }
  
  // Get all markdown files
  const files = fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.md') && file !== 'POST_TEMPLATE.md')
    .map(file => path.join(POSTS_DIR, file));
  
  console.log(`📚 Found ${files.length} post(s)`);
  
  if (files.length === 0) {
    console.log('⚠️  No posts found, creating empty posts array');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([]));
    return;
  }
  
  // Process all posts
  const posts = files.map(processPost);
  
  // Sort by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Write to JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
  
  console.log(`✅ Generated posts JSON with ${posts.length} post(s)`);
  console.log(`   Output: ${OUTPUT_FILE}`);
}

// Run the script
main();
