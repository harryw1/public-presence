/**
 * prebuild.js - Pre-build script
 * 
 * This script runs BEFORE the Vite build process and handles:
 * 1. Generating RSS feed from blog posts
 * 2. Validating that all posts have required frontmatter
 * 3. Creating a posts manifest for build optimization
 * 
 * Run automatically via: npm run build
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
const PUBLIC_DIR = path.join(__dirname, '../public');

/**
 * Get all markdown files from the posts directory
 */
function getPostFiles() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('⚠️  Posts directory does not exist. Creating it...');
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    return [];
  }
  
  return fs.readdirSync(POSTS_DIR)
    .filter(file => file.endsWith('.md'))
    .filter(file => file !== 'POST_TEMPLATE.md') // Exclude template
    .map(file => path.join(POSTS_DIR, file));
}

/**
 * Parse a post file and extract metadata
 */
function parsePost(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const { data: frontmatter, content: markdownContent } = matter(content);
  const filename = path.basename(filepath, '.md');
  
  // Validate required fields
  if (!frontmatter.title) {
    console.warn(`⚠️  Warning: Post ${filename} is missing title`);
  }
  if (!frontmatter.date) {
    console.warn(`⚠️  Warning: Post ${filename} is missing date`);
  }
  
  return {
    slug: filename,
    title: frontmatter.title || 'Untitled',
    date: frontmatter.date || new Date().toISOString(),
    excerpt: frontmatter.excerpt || '',
    tags: frontmatter.tags || [],
    author: frontmatter.author || 'Public Presence',
    content: markdownContent
  };
}

/**
 * Generate RSS feed XML
 */
function generateRSS(posts) {
  const siteUrl = 'https://publicpresence.org';
  const buildDate = new Date().toUTCString();
  
  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
  
  // Generate RSS items
  const items = sortedPosts.map(post => {
    const postUrl = `${siteUrl}/blog/${post.slug}`;
    const pubDate = new Date(post.date).toUTCString();
    
    // Escape XML special characters
    const escapeXml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };
    
    const title = escapeXml(post.title);
    const description = escapeXml(post.excerpt || post.content.substring(0, 200) + '...');
    const content = escapeXml(post.content);
    
    return `
    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      ${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>`;
  }).join('\n');
  
  // Generate full RSS XML
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Public Presence</title>
    <link>${siteUrl}</link>
    <description>Personal blog focused on sustainability science, public planning, policy, and public transportation</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
  
  return rss;
}

/**
 * Main execution
 */
function main() {
  console.log('🔨 Running prebuild script...\n');
  
  // Get all posts
  const postFiles = getPostFiles();
  console.log(`📚 Found ${postFiles.length} post(s)`);
  
  if (postFiles.length === 0) {
    console.log('⚠️  No posts found. Skipping RSS generation.');
    console.log('   Add markdown files to content/posts/ to generate content.\n');
    return;
  }
  
  // Parse all posts
  const posts = postFiles.map(parsePost);
  
  // Generate RSS feed
  console.log('📡 Generating RSS feed...');
  const rss = generateRSS(posts);
  
  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  // Write RSS file
  const rssPath = path.join(PUBLIC_DIR, 'rss.xml');
  fs.writeFileSync(rssPath, rss);
  console.log(`✅ RSS feed generated: ${rssPath}`);
  
  // Generate posts JSON for browser consumption
  console.log('📝 Generating posts JSON...');
  const postsJsonPath = path.join(PUBLIC_DIR, 'posts.json');
  const postsData = posts.map(post => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    tags: post.tags,
    author: post.author,
    content: post.content,
    readingTime: Math.ceil(post.content.trim().split(/\s+/).length / 200)
  }));
  fs.writeFileSync(postsJsonPath, JSON.stringify(postsData, null, 2));
  console.log(`✅ Posts JSON generated: ${postsJsonPath}\n`);
  
  // Summary
  console.log('📊 Build summary:');
  console.log(`   - Total posts: ${posts.length}`);
  console.log(`   - Latest post: ${posts[0]?.title || 'N/A'}`);
  console.log(`   - Oldest post: ${posts[posts.length - 1]?.title || 'N/A'}\n`);
  
  console.log('✅ Prebuild complete!\n');
}

// Run the script
main();
