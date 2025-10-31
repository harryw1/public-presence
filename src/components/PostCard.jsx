/**
 * PostCard.jsx - Component for displaying blog post preview cards
 * 
 * Used on:
 * - Homepage (recent posts)
 * - Blog archive page (all posts)
 * 
 * Shows: title, date, excerpt, tags, reading time
 */

import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';

/**
 * PostCard component
 * 
 * @param {Object} post - Post object containing metadata and content
 * @param {string} post.slug - URL identifier for the post
 * @param {string} post.title - Post title
 * @param {string} post.date - ISO date string
 * @param {string} post.excerpt - Brief summary/preview text
 * @param {Array} post.tags - Array of tag strings
 * @param {number} post.readingTime - Estimated reading time in minutes
 */
function PostCard({ post }) {
  return (
    <article className="post-card">
      {/* Post title as clickable link */}
      <h2>
        <Link to={`/blog/${post.slug}`}>
          {post.title}
        </Link>
      </h2>
      
      {/* Post metadata: date and reading time */}
      <div className="post-meta">
        <span className="post-date">
          {/* Clock icon (Unicode character) */}
          📅 {formatDate(post.date)}
        </span>
        
        <span className="post-reading-time">
          {/* Book icon (Unicode character) */}
          📖 {post.readingTime} min read
        </span>
      </div>
      
      {/* Post excerpt/preview */}
      {post.excerpt && (
        <p className="post-excerpt">
          {post.excerpt}
        </p>
      )}
      
      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map(tag => (
            <Link 
              key={tag} 
              to={`/blog?tag=${encodeURIComponent(tag)}`}
              className="tag"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
      
      {/* Read more link */}
      <Link to={`/blog/${post.slug}`} className="read-more">
        Read full post →
      </Link>
    </article>
  );
}

export default PostCard;
