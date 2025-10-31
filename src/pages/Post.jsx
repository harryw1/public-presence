/**
 * Post.jsx - Individual blog post page
 * 
 * Features:
 * - Full markdown content rendering with syntax highlighting
 * - LaTeX/math equation support
 * - Post metadata display
 * - Social sharing buttons
 * - Previous/Next post navigation
 * - SEO meta tags (title, description)
 */

import { useParams, Link } from 'react-router-dom';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // GitHub Flavored Markdown (tables, strikethrough, etc.)
import remarkMath from 'remark-math'; // Math equation parsing
import rehypeKatex from 'rehype-katex'; // LaTeX rendering
import rehypeHighlight from 'rehype-highlight'; // Code syntax highlighting
import { getPostBySlug, getPostNavigation } from '../utils/posts';
import { formatDate } from '../utils/dateUtils';

// Import KaTeX CSS for math rendering
import 'katex/dist/katex.min.css';
// Import highlight.js CSS for code syntax highlighting
import 'highlight.js/styles/github-dark.css';

function Post() {
  // Get the post slug from the URL parameter
  // Example: /blog/my-first-post -> slug = "my-first-post"
  const { slug } = useParams();
  
  // Load the post data
  const post = getPostBySlug(slug);
  
  // Get previous and next posts for navigation
  const navigation = post ? getPostNavigation(slug) : { previous: null, next: null };
  
  /**
   * Update document title when post loads
   * This improves SEO and browser tab display
   */
  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Public Presence`;
    }
    
    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'Public Presence';
    };
  }, [post]);
  
  /**
   * Scroll to top when post changes
   * Improves UX when navigating between posts
   */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  
  // Handle case where post is not found
  if (!post) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="error">
            <h1>Post Not Found</h1>
            <p>The post you're looking for doesn't exist.</p>
            <Link to="/blog" className="read-more">
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  /**
   * Generate share URLs for social media
   * These open sharing dialogs in new windows
   */
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = encodeURIComponent(post.title);
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    email: `mailto:?subject=${shareTitle}&body=I thought you might find this interesting: ${shareUrl}`
  };
  
  return (
    <div className="main-content">
      <article className="container">
        {/* Post header with metadata */}
        <header className="post-header">
          <h1 className="post-title">{post.title}</h1>
          
          <div className="post-meta">
            <span className="post-date">
              📅 {formatDate(post.date)}
            </span>
            
            <span className="post-reading-time">
              📖 {post.readingTime} min read
            </span>
            
            <span className="post-author">
              ✍️ {post.author}
            </span>
          </div>
          
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
        </header>
        
        {/* Main post content
            ReactMarkdown converts markdown to HTML
            Plugins add extra features:
            - remarkGfm: GitHub Flavored Markdown (tables, task lists, etc.)
            - remarkMath: Parse math equations (e.g., $x^2$)
            - rehypeKatex: Render math with LaTeX
            - rehypeHighlight: Syntax highlighting for code blocks */}
        <div className="post-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
          >
            {post.content}
          </ReactMarkdown>
        </div>
        
        {/* Social sharing buttons */}
        <div className="social-share">
          <strong>Share this post:</strong>
          <a 
            href={shareLinks.twitter} 
            target="_blank" 
            rel="noopener noreferrer"
            className="share-button"
          >
            🐦 Twitter
          </a>
          <a 
            href={shareLinks.linkedin} 
            target="_blank" 
            rel="noopener noreferrer"
            className="share-button"
          >
            💼 LinkedIn
          </a>
          <a 
            href={shareLinks.facebook} 
            target="_blank" 
            rel="noopener noreferrer"
            className="share-button"
          >
            📘 Facebook
          </a>
          <a 
            href={shareLinks.email}
            className="share-button"
          >
            ✉️ Email
          </a>
        </div>
        
        {/* Previous/Next post navigation */}
        {(navigation.previous || navigation.next) && (
          <nav className="post-navigation">
            {/* Previous post */}
            {navigation.previous ? (
              <Link to={`/blog/${navigation.previous.slug}`} className="nav-link">
                <div className="nav-link-label">← Previous Post</div>
                <div className="nav-link-title">{navigation.previous.title}</div>
              </Link>
            ) : (
              <div /> // Empty div to maintain flexbox layout
            )}
            
            {/* Next post */}
            {navigation.next ? (
              <Link to={`/blog/${navigation.next.slug}`} className="nav-link">
                <div className="nav-link-label">Next Post →</div>
                <div className="nav-link-title">{navigation.next.title}</div>
              </Link>
            ) : (
              <div /> // Empty div to maintain flexbox layout
            )}
          </nav>
        )}
        
        {/* Back to blog link */}
        <div className="text-center mt-lg">
          <Link to="/blog" className="read-more">
            ← Back to all posts
          </Link>
        </div>
      </article>
    </div>
  );
}

export default Post;
