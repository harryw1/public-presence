/**
 * Home.jsx - Homepage component
 * 
 * The landing page for the site featuring:
 * - Hero section with site introduction
 * - Recent blog posts (5 most recent)
 * - Link to view all posts
 */

import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { getRecentPosts } from '../utils/posts';

function Home() {
  // Get the 5 most recent posts for display
  // This function is called during render, but since we're using
  // static site generation, it happens at build time, not runtime
  const recentPosts = getRecentPosts(5);
  
  return (
    <div className="main-content">
      <div className="container">
        {/* Hero section - site introduction */}
        <section className="hero">
          <h1>Public Presence</h1>
          <p className="hero-subtitle">
            Exploring sustainability science, public planning, policy, and 
            public transportation. Committed to bettering the public good 
            through evidence-based approaches to sustainability in the public sector.
          </p>
        </section>
        
        {/* Recent posts section */}
        <section className="recent-posts-section">
          <h2 className="section-title">Recent Posts</h2>
          
          {/* Check if there are any posts to display */}
          {recentPosts.length > 0 ? (
            <>
              {/* Render each post as a PostCard */}
              <div className="post-list">
                {recentPosts.map(post => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
              
              {/* Link to view all posts */}
              <div className="text-center mt-lg">
                <Link to="/blog" className="read-more">
                  View all posts →
                </Link>
              </div>
            </>
          ) : (
            /* Show message if no posts exist yet */
            <p className="text-center text-muted">
              No posts yet. Check back soon!
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Home;
