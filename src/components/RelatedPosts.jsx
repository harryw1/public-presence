/**
 * RelatedPosts.jsx - Display related posts based on shared tags
 *
 * Shows 2-3 related articles at the end of each post
 * Helps readers discover more content and increases engagement
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, BookOpen } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

/**
 * Find posts that share tags with the current post
 * @param {Object} currentPost - The current post being viewed
 * @param {Array} allPosts - Array of all available posts
 * @param {number} limit - Maximum number of related posts to return
 * @returns {Array} Array of related posts sorted by relevance
 */
function findRelatedPosts(currentPost, allPosts, limit = 3) {
  if (!currentPost || !allPosts) return [];

  const currentTags = new Set(currentPost.tags);

  // Calculate relevance score for each post
  const scoredPosts = allPosts
    .filter(post => post.slug !== currentPost.slug) // Exclude current post
    .map(post => {
      // Count how many tags match
      const matchingTags = post.tags.filter(tag => currentTags.has(tag)).length;
      return {
        ...post,
        relevanceScore: matchingTags
      };
    })
    .filter(post => post.relevanceScore > 0) // Only posts with at least one matching tag
    .sort((a, b) => {
      // Sort by relevance score (descending), then by date (newest first)
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.date) - new Date(a.date);
    })
    .slice(0, limit);

  return scoredPosts;
}

/**
 * RelatedPosts component
 *
 * @param {Object} props
 * @param {Object} props.currentPost - The current post object
 * @param {Array} props.allPosts - Array of all posts
 * @param {number} props.limit - Max number of related posts to show (default: 3)
 */
function RelatedPosts({ currentPost, allPosts, limit = 3 }) {
  const relatedPosts = useMemo(
    () => findRelatedPosts(currentPost, allPosts, limit),
    [currentPost, allPosts, limit]
  );

  // Don't render if no related posts found
  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="related-posts">
      <h2 className="related-posts-title">Related Posts</h2>

      <div className="related-posts-grid">
        {relatedPosts.map(post => (
          <article key={post.slug} className="related-post-card">
            <h3 className="related-post-title">
              <Link to={`/blog/${post.slug}`}>
                {post.title}
              </Link>
            </h3>

            <div className="related-post-meta">
              <span className="post-date">
                <Calendar size={14} aria-hidden="true" />
                <span className="sr-only">Published on </span>
                {formatDate(post.date)}
              </span>

              <span className="post-reading-time">
                <BookOpen size={14} aria-hidden="true" />
                <span className="sr-only">Reading time: </span>
                {post.readingTime} min read
              </span>
            </div>

            {post.excerpt && (
              <p className="related-post-excerpt">
                {post.excerpt}
              </p>
            )}

            {/* Show matching tags */}
            {post.tags.length > 0 && (
              <div className="related-post-tags">
                {post.tags
                  .filter(tag => currentPost.tags.includes(tag))
                  .slice(0, 3)
                  .map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

export default RelatedPosts;
