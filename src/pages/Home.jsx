/**
 * Home.jsx - Homepage component
 * 
 * The landing page for the site featuring:
 * - Hero section with site introduction
 * - Recent blog posts (5 most recent)
 * - Link to view all posts
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { getRecentPosts } from '../utils/posts';

function Home() {
  // State for posts and loading status
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load posts when component mounts
  useEffect(() => {
    async function loadPosts() {
      try {
        const posts = await getRecentPosts(5);
        setRecentPosts(posts);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadPosts();
  }, []);
  
  return (
    <div className="main-content">
      <div className="container">
        {/* Hero section - site introduction */}
        <section className="hero">
          <h1>publicpresence.org</h1>
          <p className="hero-subtitle">
            Exploring sustainability science, public planning, policy, and 
            public transportation. Committed to bettering the public good 
            through evidence-based approaches to sustainability in the public sector.
          </p>
        </section>
        
        {/* Recent posts section */}
        <section className="recent-posts-section">
          <h2 className="section-title">Recent Posts</h2>
          
          {loading ? (
            <p className="loading">Loading posts...</p>
          ) : recentPosts.length > 0 ? (
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
